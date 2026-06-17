// Load apps/server/.env for local dev (GEMINI_API_KEY etc.). No-op in
// production, where the platform (Heroku) injects real env vars.
import "dotenv/config";
import { MAX_UPLOAD_BYTES } from "@ourfirm/shared";

/** Default fallback chain tried, in order, after the primary model. */
const DEFAULT_FALLBACK_MODELS = "gemini-2.5-flash,gemini-2.0-flash";

/**
 * Build the ordered model chain the vision layer attempts: the primary model
 * first, then each fallback. Even a healthy model can return a transient 503
 * ("model is experiencing high demand"); trying the next model before giving up
 * keeps AI detection working through a single model's demand spike. Deduped,
 * order-preserving, blanks dropped. Pure (exported for tests).
 */
export function buildModelChain(
  primary: string,
  fallbacksCsv: string | undefined,
): string[] {
  const fallbacks = (fallbacksCsv ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const chain: string[] = [];
  for (const model of [primary, ...fallbacks]) {
    if (model && !chain.includes(model)) chain.push(model);
  }
  return chain;
}

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
   * Ordered chain of detection-capable Gemini Flash models. The primary
   * (`GEMINI_MODEL`, default `gemini-3.5-flash`) is tried first; if it fails for
   * any reason (notably a transient 503 high-demand spike), each fallback
   * (`GEMINI_FALLBACK_MODELS`, default `gemini-2.5-flash,gemini-2.0-flash`) is
   * tried in turn before extraction falls back to the in-repo heuristics.
   */
  geminiModels: buildModelChain(
    process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
    process.env.GEMINI_FALLBACK_MODELS ?? DEFAULT_FALLBACK_MODELS,
  ),
  /**
   * Max time to wait on a Gemini call before giving up and falling back to the
   * heuristics. Bounds the wait when the service is slow/unreachable (a
   * rate-limit 429 already returns fast).
   */
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 12000),
} as const;

/** True when the optional Gemini vision layer is configured (API key present). */
export function isVisionEnabled(): boolean {
  return Boolean(config.geminiApiKey);
}
