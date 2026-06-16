import type { FastifyInstance, FastifyReply } from "fastify";
import {
  API_ROUTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_FIELD_NAME,
  type ApiError,
  type ExtractionErrorCode,
} from "@ourfirm/shared";

import {
  extractDocument,
  isExtractionError,
} from "../extraction/index.js";

/** HTTP status for each failure code. */
const STATUS_BY_CODE: Record<ExtractionErrorCode, number> = {
  UNSUPPORTED_FILE_TYPE: 415,
  FILE_TOO_LARGE: 413,
  EMPTY_FILE: 400,
  CORRUPT_DOCUMENT: 422,
  PASSWORD_PROTECTED: 422,
  NO_PAGES: 422,
  UPLOAD_INTERRUPTED: 400,
  PROCESSING_FAILED: 500,
};

function sendError(
  reply: FastifyReply,
  code: ExtractionErrorCode,
  message: string,
  detail?: string,
) {
  const body: ApiError = { error: { code, message, ...(detail ? { detail } : {}) } };
  return reply.status(STATUS_BY_CODE[code]).send(body);
}

const maxMb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

/**
 * POST /api/extract — accepts a single multipart file (`file`), runs the
 * extraction engine, and returns an ExtractionResult or a human-readable
 * ApiError. All processing failures arrive here as typed ExtractionErrors.
 */
export function registerExtractRoute(app: FastifyInstance) {
  app.post(API_ROUTES.extract, async (request, reply) => {
    // 1. Pull the uploaded file off the multipart request.
    let part;
    try {
      part = await request.file();
    } catch {
      return sendError(
        reply,
        "UNSUPPORTED_FILE_TYPE",
        "Expected a file upload. Please attach a PDF document.",
      );
    }

    if (!part) {
      return sendError(
        reply,
        "UNSUPPORTED_FILE_TYPE",
        "No file was uploaded. Please choose a PDF document.",
      );
    }

    if (part.fieldname !== UPLOAD_FIELD_NAME) {
      return sendError(
        reply,
        "UNSUPPORTED_FILE_TYPE",
        `Unexpected upload field "${part.fieldname}". Expected "${UPLOAD_FIELD_NAME}".`,
      );
    }

    // 2. Buffer the stream, distinguishing "too large" from "interrupted".
    let bytes: Buffer;
    try {
      bytes = await part.toBuffer();
    } catch {
      if (part.file.truncated) {
        return sendError(
          reply,
          "FILE_TOO_LARGE",
          `That file is larger than the ${maxMb} MB limit. Please upload a smaller PDF.`,
        );
      }
      return sendError(
        reply,
        "UPLOAD_INTERRUPTED",
        "The upload didn't finish. Please check your connection and try again.",
      );
    }

    if (part.file.truncated) {
      return sendError(
        reply,
        "FILE_TOO_LARGE",
        `That file is larger than the ${maxMb} MB limit. Please upload a smaller PDF.`,
      );
    }

    // 3. Run the engine. Its ExtractionErrors carry user-facing messages.
    try {
      const result = await extractDocument(bytes, part.filename ?? "document.pdf");
      return reply.status(200).send(result);
    } catch (error) {
      if (isExtractionError(error)) {
        return sendError(reply, error.code, error.message, error.detail);
      }
      request.log.error(error);
      return sendError(
        reply,
        "PROCESSING_FAILED",
        "Something went wrong while processing the document. Please try again.",
      );
    }
  });
}
