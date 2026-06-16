import type { ExtractionErrorCode } from "@ourfirm/shared";

/**
 * The single error type the extraction engine throws. The route maps `code`
 * straight onto the `ApiError` contract and surfaces `message` (and optional
 * `detail`) to the user, so both must always be human-readable and free of
 * stack traces / internal jargon.
 */
export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;
  readonly detail?: string;

  constructor(code: ExtractionErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
    this.detail = detail;
    // Restore prototype chain for `instanceof` after transpilation to ES5-ish
    // targets; harmless on modern targets.
    Object.setPrototypeOf(this, ExtractionError.prototype);
  }
}

/** Default, user-facing messages keyed by code, used where no bespoke copy is needed. */
export const DEFAULT_MESSAGES: Record<ExtractionErrorCode, string> = {
  UNSUPPORTED_FILE_TYPE:
    "That file isn't a PDF. Please upload a PDF document.",
  FILE_TOO_LARGE: "That file is too large. The maximum upload size is 25 MB.",
  EMPTY_FILE: "That file is empty or did not finish uploading.",
  CORRUPT_DOCUMENT:
    "We couldn't read that PDF — it appears to be damaged or malformed.",
  PASSWORD_PROTECTED:
    "That PDF is password-protected. Please upload an unlocked copy.",
  NO_PAGES: "That PDF has no pages to process.",
  UPLOAD_INTERRUPTED:
    "The upload didn't complete. Please try uploading the file again.",
  PROCESSING_FAILED:
    "Something went wrong while processing the document. Please try again.",
};

/** Narrowing helper for callers that catch unknown values. */
export function isExtractionError(value: unknown): value is ExtractionError {
  return value instanceof ExtractionError;
}
