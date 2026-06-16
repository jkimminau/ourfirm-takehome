import type { FastifyInstance } from "fastify";
import { API_ROUTES, type ApiError } from "@ourfirm/shared";

/**
 * STUB — replaced by the extraction-API task (#4).
 *
 * The real handler will: read the multipart upload, validate it (magic bytes +
 * size), run the extraction engine, and return an ExtractionResult or a
 * human-readable ApiError. This placeholder only keeps the server bootable
 * during scaffolding.
 */
export function registerExtractRoute(app: FastifyInstance) {
  app.post(API_ROUTES.extract, async (_request, reply) => {
    const body: ApiError = {
      error: {
        code: "PROCESSING_FAILED",
        message: "Extraction is not implemented yet.",
      },
    };
    reply.status(501).send(body);
  });
}
