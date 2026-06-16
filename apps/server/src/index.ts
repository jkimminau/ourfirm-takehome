import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { API_ROUTES, type ApiError } from "@ourfirm/shared";

import { config } from "./config.js";
import { registerExtractRoute } from "./routes/extract.js";

export function buildServer() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? "info" },
    bodyLimit: config.maxUploadBytes,
  });

  app.register(cors, { origin: config.corsOrigins });
  app.register(multipart, {
    limits: { fileSize: config.maxUploadBytes, files: 1 },
  });

  app.get(API_ROUTES.health, async () => ({ status: "ok" as const }));

  registerExtractRoute(app);

  // Last line of defence: never leak a raw stack trace to the client.
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const status =
      typeof (error as { statusCode?: number }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;
    const body: ApiError = {
      error: {
        code: "PROCESSING_FAILED",
        message:
          "Something went wrong while processing the document. Please try again.",
      },
    };
    reply.status(status >= 400 && status < 600 ? status : 500).send(body);
  });

  return app;
}

async function start() {
  const app = buildServer();
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

// Only listen when run directly (e.g. `node dist/index.js`), not when imported
// by tests — buildServer() is exported for in-process testing via app.inject().
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start();
}
