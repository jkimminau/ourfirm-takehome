import sharp from "sharp";
import type {
  BoundingBox,
  PageRef,
  PagePreview,
  RegionImages,
} from "@ourfirm/shared";

import type { RasterPage } from "./rasterize.js";

/** Cap encoded crop width so data-URL payloads stay reasonable. */
const MAX_CROP_WIDTH = 1600;
/** JPEG quality for the lossy variant. */
const JPEG_QUALITY = 85;
/** Page previews are display-only, so downscale hard to keep payloads small. */
const PREVIEW_WIDTH = 800;
const PREVIEW_QUALITY = 72;
/** White, since documents are on white paper and we drop alpha for JPEG. */
const WHITE = { r: 255, g: 255, b: 255 } as const;

/** Build a contract-shaped PageRef from a rasterized page. */
export function toPageRef(page: RasterPage): PageRef {
  return { index: page.index, width: page.width, height: page.height };
}

/**
 * Crop `box` out of the page image and encode it as BOTH a PNG and a JPEG
 * data URL. Both encodings come from the same pixels so the client can offer
 * either download with no extra round-trip.
 */
export async function cropRegion(
  page: RasterPage,
  box: BoundingBox,
): Promise<RegionImages> {
  const region = clampBox(box, page.width, page.height);

  // Extract first, then resize down if the crop exceeds the width cap. We
  // flatten onto white so transparent or odd-channel sources encode cleanly
  // and the JPEG (which has no alpha) matches the PNG visually.
  let pipeline = sharp(page.png)
    .extract({
      left: region.x,
      top: region.y,
      width: region.width,
      height: region.height,
    })
    .flatten({ background: WHITE });

  if (region.width > MAX_CROP_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_CROP_WIDTH, withoutEnlargement: true });
  }

  // sharp pipelines are single-shot; clone before terminal encoders.
  const [png, jpeg] = await Promise.all([
    pipeline.clone().png().toBuffer(),
    pipeline.clone().jpeg({ quality: JPEG_QUALITY }).toBuffer(),
  ]);

  return {
    png: toDataUrl("image/png", png),
    jpeg: toDataUrl("image/jpeg", jpeg),
  };
}

/**
 * Encode a downscaled JPEG preview of a full page for on-screen display.
 * Flattened onto white; dimensions reflect the downscaled image.
 */
export async function encodePagePreview(page: RasterPage): Promise<PagePreview> {
  const pipeline = sharp(page.png)
    .flatten({ background: WHITE })
    .resize({ width: PREVIEW_WIDTH, withoutEnlargement: true });

  const { data, info } = await pipeline
    .jpeg({ quality: PREVIEW_QUALITY })
    .toBuffer({ resolveWithObject: true });

  return {
    index: page.index,
    width: info.width,
    height: info.height,
    image: toDataUrl("image/jpeg", data),
  };
}

function toDataUrl(mime: string, buffer: Buffer): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Clamp a box to the page bounds and enforce a minimum 1x1 size. */
function clampBox(
  box: BoundingBox,
  pageWidth: number,
  pageHeight: number,
): BoundingBox {
  const x = clampInt(box.x, 0, pageWidth - 1);
  const y = clampInt(box.y, 0, pageHeight - 1);
  const width = clampInt(box.width, 1, pageWidth - x);
  const height = clampInt(box.height, 1, pageHeight - y);
  return { x, y, width, height };
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}
