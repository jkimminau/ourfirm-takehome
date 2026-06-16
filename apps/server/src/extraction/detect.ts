import sharp from "sharp";
import type { BoundingBox, RegionKind } from "@ourfirm/shared";

import type { RasterPage, TextWord } from "./rasterize.js";

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
/** Signatures appear in the bottom ~40% of the last page. */
const SIGNATURE_BAND = 0.4;

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
 * Detect a handwritten-signature-like mark in the bottom band of the last page.
 *
 * Approach: build an ink mask, project ink density per row, group adjacent
 * inked rows into clusters, then score each cluster on the traits that
 * distinguish a signature from a printed text block — width, low fill ratio
 * (signatures are sparse, irregular strokes), and proximity to a closing-word
 * text anchor. Return the best cluster's padded bbox, or decline.
 */
export async function detectSignature(
  lastPage: RasterPage,
): Promise<DetectResult> {
  const empty = {
    kind: "signature" as const,
    message: "No signature found in the lower portion of the last page.",
  };

  const bandHeight = lastPage.height * SIGNATURE_BAND;
  const bandTop = lastPage.height - bandHeight;
  const mask = await buildInkMask(lastPage, bandTop, bandHeight);

  if (mask.inkCount === 0) return empty;

  // Per-row ink counts.
  const rowInk = new Int32Array(mask.height);
  for (let y = 0; y < mask.height; y++) {
    let c = 0;
    const rowStart = y * mask.width;
    for (let x = 0; x < mask.width; x++) c += mask.data[rowStart + x]!;
    rowInk[y] = c;
  }

  // Group consecutive non-empty rows (allowing 1-row gaps to bridge thin
  // strokes) into clusters.
  const minRowInk = Math.max(2, Math.round(mask.width * 0.002));
  const clusters: RowCluster[] = [];
  let current: RowCluster | null = null;
  let gap = 0;
  const MAX_GAP = Math.max(2, Math.round(mask.height * 0.02));

  for (let y = 0; y < mask.height; y++) {
    const inked = rowInk[y]! >= minRowInk;
    if (inked) {
      if (!current) {
        current = {
          startRow: y,
          endRow: y,
          minX: mask.width,
          maxX: -1,
          inkCount: 0,
        };
      }
      current.endRow = y;
      current.inkCount += rowInk[y]!;
      // Track horizontal extent for this row.
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

  // Convert anchor words (already in page-pixel space) to band-local Y.
  const anchorYs = findAnchorYs(lastPage.words).map((y) => y - mask.offsetY);

  let best: { cluster: RowCluster; score: number } | null = null;
  for (const cluster of clusters) {
    const clusterWidth = cluster.maxX - cluster.minX + 1;
    const clusterHeight = cluster.endRow - cluster.startRow + 1;
    if (clusterWidth < mask.width * 0.08) continue; // too narrow to be a signature
    if (clusterHeight < 3) continue; // a single thin rule alone isn't enough

    const area = clusterWidth * clusterHeight;
    const fillRatio = cluster.inkCount / area; // printed text packs densely
    // Signatures are sparse + irregular: reward LOW fill ratio.
    const irregularity = clamp(1 - fillRatio / 0.35, 0, 1);
    // Reward width (relative to band) — signatures sprawl horizontally.
    const widthScore = clamp(clusterWidth / mask.width, 0, 1);
    // Reward being in the lower half of the band (signatures sit low).
    const verticalCenter = (cluster.startRow + cluster.endRow) / 2;
    const lowness = clamp(verticalCenter / mask.height, 0, 1);

    // Anchor proximity: bias toward clusters near/below a closing word.
    let anchorScore = 0;
    for (const ay of anchorYs) {
      const dist = cluster.startRow - ay; // positive => cluster below anchor
      if (dist > -clusterHeight && dist < mask.height * 0.25) {
        anchorScore = Math.max(anchorScore, 1 - Math.abs(dist) / (mask.height * 0.25));
      }
    }

    const score =
      irregularity * 0.4 +
      widthScore * 0.25 +
      lowness * 0.15 +
      anchorScore * 0.2;

    if (!best || score > best.score) best = { cluster, score };
  }

  if (!best || best.score < 0.25) return empty;

  const pad = Math.round(mask.height * 0.06);
  const c = best.cluster;
  const left = Math.max(0, c.minX - pad);
  const right = Math.min(mask.width - 1, c.maxX + pad);
  const topInMask = Math.max(0, c.startRow - pad);
  const bottomInMask = Math.min(mask.height - 1, c.endRow + pad);

  const box: BoundingBox = {
    x: left,
    y: mask.offsetY + topInMask,
    width: right - left + 1,
    height: bottomInMask - topInMask + 1,
  };

  // Map the cluster score (0.25–1) onto a presentable confidence (0.4–0.9).
  const confidence = clamp(0.4 + (best.score - 0.25) * 0.66, 0.4, 0.9);
  return { kind: "signature", page: lastPage, box, confidence };
}

/** Top-Y of any word matching a closing/signature anchor phrase. */
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
