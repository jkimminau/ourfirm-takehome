import {
  REGION_KINDS,
  type BoundingBox,
  type DetectedRegion,
  type ExtractionResult,
  type Region,
  type RegionKind,
} from "@ourfirm/shared";

import { isVisionEnabled } from "../config.js";
import { DEFAULT_MESSAGES, ExtractionError } from "./errors.js";
import { validateDocument } from "./validate.js";
import { rasterizeDocument, type RasterPage } from "./rasterize.js";
import {
  detectFooter,
  detectLetterhead,
  detectSignature,
  extractTextInBox,
  isDetection,
  type DetectResult,
} from "./detect.js";
import { cropRegion, encodePagePreview, toPageRef } from "./crop.js";
import { detectRegionsWithVision } from "./vision.js";

/** Confidence we attach to a region the AI vision layer located. */
const AI_CONFIDENCE = 0.9;

export { ExtractionError, isExtractionError } from "./errors.js";
export { validateDocument } from "./validate.js";

/**
 * The full extraction pipeline: validate → rasterize → detect → crop/encode.
 *
 * Returns an ExtractionResult whose `regions` array always has exactly one
 * entry per RegionKind, in REGION_KINDS order. Every failure surfaces as an
 * ExtractionError with a human-readable, stack-trace-free message.
 */
export async function extractDocument(
  bytes: Buffer,
  fileName: string,
): Promise<ExtractionResult> {
  // Validation throws its own well-typed ExtractionErrors; let them through.
  await validateDocument(bytes, fileName);

  // Rasterization throws PASSWORD_PROTECTED / CORRUPT_DOCUMENT / NO_PAGES.
  const pages = await rasterizeDocument(bytes);
  if (pages.length === 0) {
    throw new ExtractionError("NO_PAGES", DEFAULT_MESSAGES.NO_PAGES);
  }

  try {
    const firstPage = pages[0]!;
    const lastPage = pages[pages.length - 1]!;

    // Run the three heuristics. They share no state, so run them together.
    const [letterhead, signature, footer] = await Promise.all([
      detectLetterhead(firstPage),
      detectSignature(lastPage),
      detectFooter(lastPage),
    ]);

    const byKind: Record<RegionKind, DetectResult> = {
      letterhead,
      signature,
      footer,
    };

    // The page each kind is searched on — also the page vision was given, so a
    // vision box can be cropped even when the heuristic returned not_detected.
    const pageByKind: Record<RegionKind, RasterPage> = {
      letterhead: firstPage,
      signature: lastPage,
      footer: lastPage,
    };

    // Optional refine/override layer: ask Gemini to locate the regions and use
    // its boxes where returned. Letterhead lives on page 1; signature + footer
    // on the last page. Each page's vision call is wrapped so a failure (no
    // key, network, parse) silently falls back to the heuristic — extraction
    // must NEVER fail because of vision. The heuristic page each kind was found
    // on is preserved so crops/text come from the right raster.
    const visionBoxes: Partial<Record<RegionKind, BoundingBox>> = {};
    if (isVisionEnabled()) {
      const [firstVision, lastVision] = await Promise.all([
        visionForPage(firstPage, ["letterhead"]),
        visionForPage(lastPage, ["signature", "footer"]),
      ]);
      Object.assign(visionBoxes, firstVision, lastVision);
    }

    // Encode crops for detections + a downscaled preview for every page.
    const [regions, previews] = await Promise.all([
      Promise.all(
        REGION_KINDS.map((kind) =>
          buildRegion(byKind[kind], pageByKind[kind], visionBoxes[kind]),
        ),
      ),
      Promise.all(pages.map((page) => encodePagePreview(page))),
    ]);

    return {
      fileName,
      pageCount: pages.length,
      previews,
      regions,
    };
  } catch (error) {
    // Detection/crop failures are unexpected (validation + rasterization
    // already passed), so anything here is an internal fault.
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      "PROCESSING_FAILED",
      DEFAULT_MESSAGES.PROCESSING_FAILED,
    );
  }
}

/**
 * Run the vision layer for one page, returning a kind→box map. Wrapped so any
 * failure (no key, network, malformed response) yields {} and the caller falls
 * back to the heuristic for every kind on this page. Never throws.
 */
async function visionForPage(
  page: RasterPage,
  kinds: RegionKind[],
): Promise<Partial<Record<RegionKind, BoundingBox>>> {
  try {
    return await detectRegionsWithVision(page, kinds);
  } catch {
    return {};
  }
}

/**
 * Turn a heuristic detection result into its contract Region.
 *
 * If the vision layer supplied a box for this kind it OVERRIDES the heuristic
 * (even when the heuristic returned not_detected): we crop the vision box from
 * `sourcePage` — the same page vision was given — and mark `detectedBy: "ai"`.
 * Otherwise we use the heuristic box (`detectedBy: "heuristic"`), or report
 * `not_detected` when neither located the region.
 */
async function buildRegion(
  result: DetectResult,
  sourcePage: RasterPage,
  visionBox: BoundingBox | undefined,
): Promise<Region> {
  if (visionBox) {
    return buildDetected(sourcePage, result.kind, visionBox, AI_CONFIDENCE, "ai");
  }

  if (!isDetection(result)) {
    return { kind: result.kind, status: "not_detected", message: result.message };
  }

  return buildDetected(
    result.page,
    result.kind,
    result.box,
    result.confidence,
    "heuristic",
  );
}

/** Crop a box on a page and assemble the contract DetectedRegion. */
async function buildDetected(
  page: RasterPage,
  kind: RegionKind,
  box: BoundingBox,
  confidence: number,
  detectedBy: DetectedRegion["detectedBy"],
): Promise<DetectedRegion> {
  const images = await cropRegion(page, box);
  // Text-layer content inside the box. A hand-drawn signature legitimately
  // yields "" (ink with no selectable text under it).
  const text = extractTextInBox(page.words, box);
  return {
    kind,
    status: "detected",
    page: toPageRef(page),
    box,
    images,
    confidence,
    detectedBy,
    text,
  };
}

// Re-export the page type for consumers/tests that want it.
export type { RasterPage };
