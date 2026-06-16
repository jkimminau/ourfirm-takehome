import JSZip from "jszip";
import {
  isDetected,
  type ExtractionResult,
  type RegionImages,
  type RegionKind,
} from "@ourfirm/shared";
import { baseName, dataUrlToBytes, downloadBlob } from "./download";
import type { FullDocumentImages } from "./fullDocument";

/**
 * Bundle the full document plus every detected region (as PNGs) into a single
 * .zip and download it. Uses the user's adjusted crop for a region when present.
 * PNG is used for the archive since it's the lossless source; per-card buttons
 * still offer JPEG individually.
 */
export async function downloadAllZip(
  result: ExtractionResult,
  fullDocument: FullDocumentImages | null,
  overrides: Partial<Record<RegionKind, RegionImages>> = {},
): Promise<void> {
  const base = baseName(result.fileName);
  const zip = new JSZip();

  if (fullDocument) {
    zip.file(`${base}-full-document.png`, dataUrlToBytes(fullDocument.png));
  }
  for (const region of result.regions) {
    if (isDetected(region)) {
      const png = overrides[region.kind]?.png ?? region.images.png;
      zip.file(`${base}-${region.kind}.png`, dataUrlToBytes(png));
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${base}-regions.zip`);
}
