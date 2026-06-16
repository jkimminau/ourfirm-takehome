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

/** Decode a base64 data URL into raw bytes (for zipping). */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Trigger a browser download of a Blob under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
