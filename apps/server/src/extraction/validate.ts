import { fileTypeFromBuffer } from "file-type";
import { MAX_UPLOAD_BYTES } from "@ourfirm/shared";

import { DEFAULT_MESSAGES, ExtractionError } from "./errors.js";

/** PDF magic bytes — `%PDF-` at the very start of the file. */
const PDF_MAGIC = Buffer.from("%PDF-", "latin1");

/** The concrete input kinds the engine can rasterize. */
export type DocumentKind = "pdf" | "image";

/** What `validateDocument` resolves to: the accepted kind + its MIME type. */
export interface ValidatedDocument {
  kind: DocumentKind;
  /** The magic-byte-detected MIME (e.g. "application/pdf", "image/png"). */
  mime: string;
}

/** Image MIME types we treat as single-page documents. */
const ACCEPTED_IMAGE_MIMES = new Set(["image/png", "image/jpeg"]);

/**
 * Validate an uploaded document before we spend any CPU rasterizing it, and
 * report which concrete kind it is so the engine can pick the right rasterizer.
 *
 * Order matters: cheapest / most certain checks first. We deliberately trust
 * the *bytes*, never the filename or the client-claimed MIME type — a `.pdf`
 * extension on a renamed ZIP must still be rejected (the "disguised file"
 * guard). PNG/JPEG images are accepted and handled as one-page documents.
 */
export async function validateDocument(
  bytes: Buffer,
  _fileName: string,
): Promise<ValidatedDocument> {
  // Empty / truncated upload. We can't tell a half-finished upload from a
  // genuinely empty file at this layer, so both collapse to EMPTY_FILE; the
  // route handles true network aborts (UPLOAD_INTERRUPTED) separately.
  if (!bytes || bytes.length === 0) {
    throw new ExtractionError("EMPTY_FILE", DEFAULT_MESSAGES.EMPTY_FILE);
  }

  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new ExtractionError(
      "FILE_TOO_LARGE",
      DEFAULT_MESSAGES.FILE_TOO_LARGE,
    );
  }

  // Magic-byte detection. `file-type` sniffs the container; we additionally
  // confirm the raw `%PDF-` header because some valid PDFs (especially ones
  // with leading whitespace or odd producers) can confuse the sniffer, and we
  // want the header check to be authoritative for "is this really a PDF".
  const detected = await fileTypeFromBuffer(bytes);
  const headerLooksLikePdf = bytesStartWithPdfHeader(bytes);

  if (detected?.mime === "application/pdf") {
    return { kind: "pdf", mime: "application/pdf" }; // Definitely a PDF.
  }

  if (detected && ACCEPTED_IMAGE_MIMES.has(detected.mime)) {
    return { kind: "image", mime: detected.mime }; // PNG / JPEG image.
  }

  if (!detected && headerLooksLikePdf) {
    // Sniffer abstained but the header is present — accept; the rasterizer is
    // the next line of defence and will reject genuine corruption.
    return { kind: "pdf", mime: "application/pdf" };
  }

  // Anything else (an unsupported type, or one wearing a .pdf/.png extension).
  const detail = detected
    ? `Detected ${detected.mime} (.${detected.ext}).`
    : "Could not recognise the file as a PDF or image.";
  throw new ExtractionError(
    "UNSUPPORTED_FILE_TYPE",
    DEFAULT_MESSAGES.UNSUPPORTED_FILE_TYPE,
    detail,
  );
}

/** A PDF header may legally appear within the first 1 KB, after junk bytes. */
function bytesStartWithPdfHeader(bytes: Buffer): boolean {
  const window = bytes.subarray(0, Math.min(bytes.length, 1024));
  return window.indexOf(PDF_MAGIC) !== -1;
}
