import {
  REGION_KINDS,
  type ExtractionResult,
  type Region,
  type RegionKind,
} from "@ourfirm/shared";

import { DEFAULT_MESSAGES, ExtractionError } from "./errors.js";
import { validateDocument } from "./validate.js";
import { rasterizeDocument, type RasterPage } from "./rasterize.js";
import {
  detectFooter,
  detectLetterhead,
  detectSignature,
  isDetection,
  type DetectResult,
} from "./detect.js";
import { cropRegion, toPageRef } from "./crop.js";

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

    // Encode crops for detections; keep contract ordering via REGION_KINDS.
    const regions: Region[] = await Promise.all(
      REGION_KINDS.map((kind) => buildRegion(byKind[kind])),
    );

    return {
      fileName,
      pageCount: pages.length,
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

/** Turn a detection result into its contract Region (detected or not). */
async function buildRegion(result: DetectResult): Promise<Region> {
  if (!isDetection(result)) {
    return { kind: result.kind, status: "not_detected", message: result.message };
  }

  const images = await cropRegion(result.page, result.box);
  return {
    kind: result.kind,
    status: "detected",
    page: toPageRef(result.page),
    box: result.box,
    images,
    confidence: result.confidence,
  };
}

// Re-export the page type for consumers/tests that want it.
export type { RasterPage };
