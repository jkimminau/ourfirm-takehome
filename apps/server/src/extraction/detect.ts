import sharp from "sharp";
import type { BoundingBox, RegionKind } from "@ourfirm/shared";

import type { RasterPage, TextWord } from "./rasterize.js";

export { extractTextInBox };

/**
 * Heuristic "does this image look like a document?" check, used ONLY for image
 * inputs when the Gemini vision layer is disabled (PDFs are documents by
 * definition; the AI path has its own `isDocument` verdict).
 *
 * Documents are overwhelmingly dark ink on a light, low-saturation background.
 * Photos are the opposite: colourful (high saturation) and often dark overall.
 * We sample the image small and cheap and reject only the OBVIOUS non-document:
 * a colourful or dark picture. The thresholds are deliberately permissive so a
 * real scanned letter — even an off-white or faintly toned one — always passes.
 */
export async function looksLikeDocument(page: RasterPage): Promise<boolean> {
  // Downsample to a tiny thumbnail; stats over a few thousand pixels are plenty
  // to tell "paper" from "photo" and keep this near-free.
  const SAMPLE = 64;
  const { data, info } = await sharp(page.png)
    .resize({ width: SAMPLE, height: SAMPLE, fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 3 after removeAlpha (RGB)
  const pixels = info.width * info.height;
  if (pixels === 0) return true; // can't judge — don't reject

  let sumLightness = 0; // 0..255, max channel ≈ perceived brightness
  let sumSaturation = 0; // 0..1, (max-min)/max
  let lightPixels = 0; // near-white background pixels

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    sumLightness += max;
    sumSaturation += max === 0 ? 0 : (max - min) / max;
    if (max >= 200 && max - min <= 40) lightPixels += 1; // bright & near-grey
  }

  const avgLightness = sumLightness / pixels; // 0..255
  const avgSaturation = sumSaturation / pixels; // 0..1
  const lightFraction = lightPixels / pixels; // 0..1

  // A document is dark ink on a mostly bright, low-saturation page. The two
  // tell-tale signs of a NON-document photo are (a) genuine colour saturation
  // and (b) the lack of a substantial near-white "paper" background. We reject
  // only when BOTH hold, so a toned/off-white scan (low saturation → not
  // "colourful") or a dense form (little white, but desaturated) still passes.
  // A near-black image with no paper is also rejected.
  const colourful = avgSaturation > 0.28;
  const noPaper = lightFraction < 0.2;
  const tooDark = avgLightness < 90;
  return !((colourful && noPaper) || (tooDark && noPaper));
}

/** Outcome of running a region heuristic against a page. */
export interface Detection {
  kind: RegionKind;
  /** Source page the box lives on. */
  page: RasterPage;
  box: BoundingBox;
  /** 0–1 heuristic confidence. */
  confidence: number;
}

/** A region the heuristic declined to locate, with a user-facing reason. */
export interface NonDetection {
  kind: RegionKind;
  message: string;
}

export type DetectResult = Detection | NonDetection;

export function isDetection(r: DetectResult): r is Detection {
  return "box" in r;
}

// ---------------------------------------------------------------------------
// Tunable heuristic parameters (the "why" lives next to each).
// ---------------------------------------------------------------------------

/** Letterhead occupies the top ~20% of page 1. */
const LETTERHEAD_BAND = 0.2;
/** Footer occupies the bottom ~14% of the last page. */
const FOOTER_BAND = 0.14;
/**
 * Signatures are searched across the body of the last page, NOT just the
 * bottom: in practice the ink squiggle sits just below a closing line
 * ("Sincerely," / "PROVIDER:") which can be anywhere from the upper-middle of
 * the page down. We start the search below the letterhead band and stop above
 * the footer band (see detectSignature) so we never grab the footer itself.
 */
const SIGNATURE_SEARCH_TOP = 0.2;

/**
 * Ink threshold on a 0–255 greyscale image. Below this is "ink", above is
 * "paper". 200 tolerates off-white scans and light grey rules while still
 * rejecting anti-aliasing fringe.
 */
const INK_THRESHOLD = 200;

/** A band is "blank" if fewer than this fraction of its pixels are ink. */
const BLANK_INK_FRACTION = 0.0008;

/** Padding (as a fraction of band height) added around a tightened bbox. */
const PAD_FRACTION = 0.15;

// ---------------------------------------------------------------------------
// Low-level ink analysis
// ---------------------------------------------------------------------------

/** A binary ink mask for a rectangular crop, row-major, 1 = ink. */
interface InkMask {
  data: Uint8Array;
  width: number;
  height: number;
  /** Offset of this mask within the full page image. */
  offsetX: number;
  offsetY: number;
  /** Total ink pixels (cached). */
  inkCount: number;
}

/** Greyscale a page-image band and threshold it into a binary ink mask. */
async function buildInkMask(
  page: RasterPage,
  bandTop: number,
  bandHeight: number,
): Promise<InkMask> {
  const top = Math.max(0, Math.round(bandTop));
  const height = Math.min(page.height - top, Math.round(bandHeight));
  const width = page.width;

  const raw = await sharp(page.png)
    .extract({ left: 0, top, width, height })
    .greyscale()
    .raw()
    .toBuffer();

  const data = new Uint8Array(width * height);
  let inkCount = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i]! < INK_THRESHOLD) {
      data[i] = 1;
      inkCount++;
    }
  }

  return { data, width, height, offsetX: 0, offsetY: top, inkCount };
}

/**
 * Tighten to the bounding box of all ink in the mask, then pad. Returns null
 * if the mask is effectively blank.
 */
function inkBoundingBox(mask: InkMask, pad: number): BoundingBox | null {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < mask.height; y++) {
    const rowStart = y * mask.width;
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[rowStart + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null; // no ink

  const left = Math.max(0, minX - pad);
  const topInMask = Math.max(0, minY - pad);
  const right = Math.min(mask.width - 1, maxX + pad);
  const bottom = Math.min(mask.height - 1, maxY + pad);

  return {
    x: mask.offsetX + left,
    y: mask.offsetY + topInMask,
    width: right - left + 1,
    height: bottom - topInMask + 1,
  };
}

// ---------------------------------------------------------------------------
// Letterhead & footer: simple ink-band tightening
// ---------------------------------------------------------------------------

async function detectBand(
  page: RasterPage,
  kind: "letterhead" | "footer",
  bandTop: number,
  bandHeight: number,
  emptyMessage: string,
): Promise<DetectResult> {
  const mask = await buildInkMask(page, bandTop, bandHeight);
  const inkFraction = mask.inkCount / (mask.width * mask.height || 1);

  if (inkFraction < BLANK_INK_FRACTION) {
    return { kind, message: emptyMessage };
  }

  const pad = Math.round(bandHeight * PAD_FRACTION);
  const box = inkBoundingBox(mask, pad);
  if (!box) return { kind, message: emptyMessage };

  // Confidence scales with how much ink the band holds, capped — a healthy
  // letterhead/footer is neither blank nor a wall of text. Map a sensible
  // range of ink fractions onto 0.5–0.95.
  const confidence = clamp(0.5 + inkFraction * 60, 0.5, 0.95);

  return { kind, page, box, confidence };
}

export function detectLetterhead(firstPage: RasterPage): Promise<DetectResult> {
  return detectBand(
    firstPage,
    "letterhead",
    0,
    firstPage.height * LETTERHEAD_BAND,
    "No letterhead found in the top section of the first page.",
  );
}

export function detectFooter(lastPage: RasterPage): Promise<DetectResult> {
  const bandHeight = lastPage.height * FOOTER_BAND;
  return detectBand(
    lastPage,
    "footer",
    lastPage.height - bandHeight,
    bandHeight,
    "No footer found in the bottom section of the last page.",
  );
}

// ---------------------------------------------------------------------------
// Signature: row-density clustering + irregularity + text anchoring
// ---------------------------------------------------------------------------

const SIGNATURE_ANCHORS = [
  "signature",
  "sincerely",
  "regards",
  "signed",
  "respectfully",
  "yours truly",
  "best regards",
  "in witness whereof",
  "provider",
  "by:",
];

interface RowCluster {
  /** Row range within the mask. */
  startRow: number;
  endRow: number;
  /** Horizontal extent of ink across the cluster. */
  minX: number;
  maxX: number;
  inkCount: number;
}

/**
 * Detect a handwritten signature on the last page.
 *
 * The defining trait of a real signature is that it is *drawn ink with no
 * text-layer words under it*, whereas footers, the typed name, and the body
 * are printed TEXT (covered by `page.words`). So the strongest discriminator
 * is text-layer overlap: an ink cluster largely NOT covered by words is
 * signature-like; a cluster densely covered by words is printed text and is
 * rejected.
 *
 * Approach:
 *  1. Restrict the search to the body of the page, below the letterhead and
 *     ABOVE the footer band (the footer is excluded outright so we can never
 *     return it as the signature).
 *  2. Project ink per row and group inked rows into clusters.
 *  3. Score each cluster on: (a) how little of it is covered by text-layer
 *     words [dominant], (b) proximity below a closing anchor
 *     ("Sincerely," / "PROVIDER:" / …), (c) horizontal sprawl, (d) stroke
 *     irregularity (low fill ratio). Lowness on the page is NOT rewarded.
 *  4. Reject clusters that are mostly text, or whose best score is weak.
 */
export async function detectSignature(
  lastPage: RasterPage,
): Promise<DetectResult> {
  const empty = {
    kind: "signature" as const,
    message: "No signature found in the lower portion of the last page.",
  };

  // Footer band (page-pixel Y); the signature lives above it. Add a small
  // margin so disclaimer descenders / a footer rule never bleed into the
  // candidate area.
  const footerBandTop = lastPage.height * (1 - FOOTER_BAND);
  const footerMargin = lastPage.height * 0.02;
  const searchTop = Math.round(lastPage.height * SIGNATURE_SEARCH_TOP);
  const searchBottom = Math.max(searchTop + 1, Math.round(footerBandTop - footerMargin));
  const bandHeight = searchBottom - searchTop;

  const mask = await buildInkMask(lastPage, searchTop, bandHeight);
  if (mask.inkCount === 0) return empty;

  // Per-row ink counts.
  const rowInk = new Int32Array(mask.height);
  for (let y = 0; y < mask.height; y++) {
    let c = 0;
    const rowStart = y * mask.width;
    for (let x = 0; x < mask.width; x++) c += mask.data[rowStart + x]!;
    rowInk[y] = c;
  }

  // Group consecutive non-empty rows (bridging small gaps) into clusters.
  const minRowInk = Math.max(2, Math.round(mask.width * 0.002));
  const clusters: RowCluster[] = [];
  let current: RowCluster | null = null;
  let gap = 0;
  const MAX_GAP = Math.max(2, Math.round(mask.height * 0.015));

  for (let y = 0; y < mask.height; y++) {
    const inked = rowInk[y]! >= minRowInk;
    if (inked) {
      if (!current) {
        current = { startRow: y, endRow: y, minX: mask.width, maxX: -1, inkCount: 0 };
      }
      current.endRow = y;
      current.inkCount += rowInk[y]!;
      const rowStart = y * mask.width;
      for (let x = 0; x < mask.width; x++) {
        if (mask.data[rowStart + x]) {
          if (x < current.minX) current.minX = x;
          if (x > current.maxX) current.maxX = x;
        }
      }
      gap = 0;
    } else if (current) {
      gap++;
      if (gap > MAX_GAP) {
        clusters.push(current);
        current = null;
      }
    }
  }
  if (current) clusters.push(current);
  if (clusters.length === 0) return empty;

  // Per-row "is this row covered by a text-layer word" mask. Used both to
  // reject text-heavy clusters and to trim the winning cluster's box so it
  // doesn't bleed into an adjacent printed line (the typed name / closing).
  const wordRow = buildWordRowMask(lastPage.words, mask.offsetY, mask.height);

  // Anchor bottoms (page-pixel Y); a signature sits just below a closing line.
  const anchorYs = findAnchorYs(lastPage.words);

  let best: { cluster: RowCluster; score: number; textCoverage: number } | null = null;
  for (const cluster of clusters) {
    const clusterWidth = cluster.maxX - cluster.minX + 1;
    const clusterHeight = cluster.endRow - cluster.startRow + 1;
    if (clusterWidth < mask.width * 0.06) continue; // too narrow to be a signature
    if (clusterHeight < 4) continue; // a single thin rule alone isn't enough

    // Cluster bbox in page-pixel space (for text overlap + anchoring).
    const boxX = cluster.minX;
    const boxY = mask.offsetY + cluster.startRow;
    const boxW = clusterWidth;
    const boxH = clusterHeight;

    // (a) Text-layer coverage: fraction of the cluster's area covered by the
    // union of intersecting word boxes. Printed text → high; ink → ~0.
    const textCoverage = wordCoverageFraction(
      lastPage.words,
      boxX,
      boxY,
      boxW,
      boxH,
    );
    // Mostly-text clusters are printed (footer/typed name/body) — reject.
    if (textCoverage > 0.45) continue;
    // Reward LOW coverage (drawn ink) — this is the dominant signal.
    const inkPurity = clamp(1 - textCoverage / 0.45, 0, 1);

    const area = clusterWidth * clusterHeight;
    const fillRatio = cluster.inkCount / area; // printed text packs densely
    const irregularity = clamp(1 - fillRatio / 0.35, 0, 1);
    const widthScore = clamp(clusterWidth / (mask.width * 0.5), 0, 1);

    // Anchor proximity: reward a cluster sitting just BELOW a closing word.
    let anchorScore = 0;
    for (const ay of anchorYs) {
      const dist = boxY - ay; // positive => cluster below anchor
      const window = lastPage.height * 0.2;
      if (dist > -boxH && dist < window) {
        anchorScore = Math.max(anchorScore, 1 - Math.abs(dist) / window);
      }
    }

    const score =
      inkPurity * 0.5 +
      anchorScore * 0.25 +
      widthScore * 0.15 +
      irregularity * 0.1;

    if (!best || score > best.score) best = { cluster, score, textCoverage };
  }

  if (!best || best.score < 0.3) return empty;

  // Trim the winning cluster down to the contiguous run of ink rows that are
  // NOT covered by text-layer words. A bridged-in printed line (the typed name
  // below the squiggle, or the closing above it) shows up as a band of
  // word-covered rows; cut the cluster at the first such band so the box hugs
  // just the drawn ink. (Descenders extend a few px past a word's reported
  // box, so trimming the LAST row alone isn't enough — we cut at the band.)
  const c = best.cluster;
  let s = c.startRow;
  while (s < c.endRow && wordRow[s]) s++; // drop leading printed rows (closing)
  let e = s;
  while (e + 1 <= c.endRow && !wordRow[e + 1]) e++; // extend over ink-only rows
  let minX = mask.width;
  let maxX = -1;
  for (let y = s; y <= e; y++) {
    if (wordRow[y]) continue;
    const rowStart = y * mask.width;
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[rowStart + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < 0) {
    minX = c.minX;
    maxX = c.maxX;
  }

  const pad = Math.round(lastPage.height * 0.01);
  const left = Math.max(0, minX - pad);
  const right = Math.min(mask.width - 1, maxX + pad);
  // Pad vertically only into rows that aren't covered by a text word, so the
  // box never re-absorbs the closing line above or the typed name below.
  let topInMask = Math.max(0, s - pad);
  while (topInMask < s && wordRow[topInMask]) topInMask++;
  let bottomInMask = Math.min(mask.height - 1, e + pad);
  while (bottomInMask > e && wordRow[bottomInMask]) bottomInMask--;

  const box: BoundingBox = {
    x: left,
    y: mask.offsetY + topInMask,
    width: right - left + 1,
    height: bottomInMask - topInMask + 1,
  };

  // Map the cluster score (0.3–1) onto a presentable confidence (0.4–0.9).
  const confidence = clamp(0.4 + (best.score - 0.3) * 0.71, 0.4, 0.9);
  return { kind: "signature", page: lastPage, box, confidence };
}

/** Bottom-Y of any word matching a closing/signature anchor phrase. */
function findAnchorYs(words: TextWord[]): number[] {
  const ys: number[] = [];
  for (const w of words) {
    const lower = w.text.toLowerCase();
    if (SIGNATURE_ANCHORS.some((a) => lower.includes(a))) {
      ys.push(w.y + w.height); // bottom of anchor word; signature sits below
    }
  }
  return ys;
}

/**
 * Fraction of a region's area covered by the union of text-layer word boxes
 * that intersect it. Computed on a coarse occupancy grid (cheap, and exact
 * enough to separate "drawn ink, ~0 coverage" from "printed text, high
 * coverage"). Returns 0..1.
 */
function wordCoverageFraction(
  words: TextWord[],
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  if (w <= 0 || h <= 0) return 0;
  const GRID = 64;
  const cellW = w / GRID;
  const cellH = h / GRID;
  const covered = new Uint8Array(GRID * GRID);
  for (const word of words) {
    const wx0 = word.x;
    const wy0 = word.y;
    const wx1 = word.x + word.width;
    const wy1 = word.y + word.height;
    // Skip words that don't intersect the region at all.
    if (wx1 <= x || wx0 >= x + w || wy1 <= y || wy0 >= y + h) continue;
    const cx0 = clampInt((wx0 - x) / cellW, 0, GRID - 1);
    const cx1 = clampInt((wx1 - x) / cellW, 0, GRID - 1);
    const cy0 = clampInt((wy0 - y) / cellH, 0, GRID - 1);
    const cy1 = clampInt((wy1 - y) / cellH, 0, GRID - 1);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) covered[cy * GRID + cx] = 1;
    }
  }
  let n = 0;
  for (let i = 0; i < covered.length; i++) n += covered[i]!;
  return n / (GRID * GRID);
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/**
 * Boolean per mask-row (length = maskHeight): true if any text-layer word's
 * vertical span covers that page row. Used to strip printed-text rows out of
 * an ink cluster so the squiggle is separated from an adjacent typed line.
 */
function buildWordRowMask(
  words: TextWord[],
  offsetY: number,
  maskHeight: number,
): Uint8Array {
  const rows = new Uint8Array(maskHeight);
  for (const w of words) {
    const top = Math.floor(w.y - offsetY);
    const bottom = Math.ceil(w.y + w.height - offsetY);
    for (let y = Math.max(0, top); y < Math.min(maskHeight, bottom); y++) {
      rows[y] = 1;
    }
  }
  return rows;
}

/**
 * Extract the text-layer content inside a region box. Takes `words` whose
 * boxes intersect the box, sorts top-to-bottom then left-to-right, groups into
 * visual lines (similar Y), joins words with spaces and lines with "\n".
 * Returns "" if no words intersect (e.g. a hand-drawn signature). Trimmed.
 */
function extractTextInBox(words: TextWord[], box: BoundingBox): string {
  const inside = words.filter((w) => {
    const wx1 = w.x + w.width;
    const wy1 = w.y + w.height;
    return wx1 > box.x && w.x < box.x + box.width && wy1 > box.y && w.y < box.y + box.height;
  });
  if (inside.length === 0) return "";

  inside.sort((a, b) => a.y - b.y || a.x - b.x);

  // Group into visual lines: a word joins the current line if its vertical
  // midpoint is within ~60% of a typical glyph height of the line's baseline.
  const lines: TextWord[][] = [];
  for (const w of inside) {
    const last = lines[lines.length - 1];
    if (last) {
      const ref = last[0]!;
      const tol = Math.max(ref.height, w.height) * 0.6;
      const refMid = ref.y + ref.height / 2;
      const wMid = w.y + w.height / 2;
      if (Math.abs(wMid - refMid) <= tol) {
        last.push(w);
        continue;
      }
    }
    lines.push([w]);
  }

  return lines
    .map((line) =>
      line
        .slice()
        .sort((a, b) => a.x - b.x)
        .map((w) => w.text)
        .join(" "),
    )
    .join("\n")
    .trim();
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
