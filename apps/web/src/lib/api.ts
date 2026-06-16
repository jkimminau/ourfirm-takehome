import {
  API_ROUTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_FIELD_NAME,
  isApiError,
  type ExtractionErrorCode,
  type ExtractionResult,
} from "@ourfirm/shared";

/** Base URL of the document-processing server. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const maxMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

/** A request failure with a code the UI can branch on + a safe message. */
export class ApiRequestError extends Error {
  code: ExtractionErrorCode | "NETWORK";
  detail?: string;

  constructor(
    code: ExtractionErrorCode | "NETWORK",
    message: string,
    detail?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Fast client-side pre-check for instant feedback. The server remains the
 * authority (it inspects magic bytes); this only catches the obvious cases
 * before spending an upload.
 */
export function quickValidate(file: File): string | null {
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is larger than the ${maxMb} MB limit.`;
  }
  return null;
}

/** Upload a document and return its extraction result, or throw ApiRequestError. */
export async function extractDocument(
  file: File,
  signal?: AbortSignal,
): Promise<ExtractionResult> {
  const form = new FormData();
  form.append(UPLOAD_FIELD_NAME, file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_ROUTES.extract}`, {
      method: "POST",
      body: form,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiRequestError(
      "NETWORK",
      "Couldn't reach the extraction service. Please make sure it's running and try again.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiError(data)) {
      throw new ApiRequestError(
        data.error.code,
        data.error.message,
        data.error.detail,
      );
    }
    throw new ApiRequestError(
      "PROCESSING_FAILED",
      "The server returned an unexpected response. Please try again.",
    );
  }

  return data as ExtractionResult;
}
