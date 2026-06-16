import type { ImageFormat, RegionKind } from "@ourfirm/shared";

/** Trigger a browser download of a data URL under the given filename. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Strip the extension from an uploaded file name for use as a base. */
export function baseName(fileName: string): string {
  return fileName.replace(/\.[^./\\]+$/, "") || "document";
}

/** e.g. "offer-letter-signature.png" */
export function regionFileName(
  sourceName: string,
  kind: RegionKind,
  format: ImageFormat,
): string {
  return `${baseName(sourceName)}-${kind}.${format}`;
}
