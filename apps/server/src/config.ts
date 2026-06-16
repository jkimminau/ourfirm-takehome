import { MAX_UPLOAD_BYTES } from "@ourfirm/shared";

/** Runtime configuration, read once from the environment. */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "0.0.0.0",
  /** Comma-separated allowed origins for CORS; defaults to the local web app. */
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  maxUploadBytes: MAX_UPLOAD_BYTES,
} as const;
