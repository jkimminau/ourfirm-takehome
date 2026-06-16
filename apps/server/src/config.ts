// Load apps/server/.env for local dev (GEMINI_API_KEY etc.). No-op in
// production, where the platform (Heroku) injects real env vars.
import "dotenv/config";
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

  /**
   * Optional Gemini vision layer. When `geminiApiKey` is set, the extraction
   * engine asks Gemini to locate the regions and uses its boxes when returned,
   * falling back to the in-repo heuristics otherwise. Undefined ⇒ disabled.
   */
  geminiApiKey: process.env.GEMINI_API_KEY,
  /**
   * Detection-capable Gemini Flash model. Defaults to `gemini-3.5-flash`, the
   * current vision/object-detection Flash model (the older `gemini-2.5-flash`
   * is slated for deprecation). Override with GEMINI_MODEL if Google's naming
   * shifts again.
   */
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
} as const;

/** True when the optional Gemini vision layer is configured (API key present). */
export function isVisionEnabled(): boolean {
  return Boolean(config.geminiApiKey);
}
