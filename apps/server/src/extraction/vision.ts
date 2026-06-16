import { GoogleGenAI, Type, type Schema } from "@google/genai";
import type { BoundingBox, RegionKind } from "@ourfirm/shared";

import { config } from "../config.js";
import type { RasterPage } from "./rasterize.js";

/**
 * Optional AI vision layer over the heuristic detector.
 *
 * We hand Gemini the full-page PNG and ask it to return, for each requested
 * region kind it can find, a normalized bounding box. Gemini emits boxes in its
 * standard `box_2d` form — `[ymin, xmin, ymax, xmax]` normalized to 0–1000 with
 * a top-left origin (see Google's image-understanding docs) — which we
 * denormalize into page-pixel space using `page.width`/`page.height`.
 *
 * The caller treats this as a refine/override layer: any box returned here is
 * used as `detectedBy: "ai"`; any kind the model omits falls back to the
 * in-repo heuristics. The model also reports whether the page even looks like a
 * document, which the caller uses to reject photos for image inputs.
 *
 * Every failure is classified and re-thrown as a typed `VisionError` (kind
 * "rate_limited" | "unavailable") so the orchestrator can decide policy by
 * input type — propagate a precise AI error for images, or silently fall back
 * to heuristics for PDFs. This module never throws an unclassified error.
 */

/** A classified vision-layer failure the orchestrator maps to an AI error code. */
export type VisionErrorKind = "rate_limited" | "unavailable";

export class VisionError extends Error {
  readonly kind: VisionErrorKind;
  constructor(kind: VisionErrorKind, message: string) {
    super(message);
    this.name = "VisionError";
    this.kind = kind;
    Object.setPrototypeOf(this, VisionError.prototype);
  }
}

export function isVisionError(value: unknown): value is VisionError {
  return value instanceof VisionError;
}

/** Result of a vision page analysis: the located boxes + a document verdict. */
export interface VisionPageResult {
  boxes: Partial<Record<RegionKind, BoundingBox>>;
  /** Whether the model judged the page to be a document (vs. a photo/picture). */
  isDocument: boolean;
}

/** Per-kind instruction so the model matches our region definitions exactly. */
const KIND_GUIDANCE: Record<RegionKind, string> = {
  letterhead:
    "letterhead: the branded header band at the VERY TOP of the page " +
    "(company name/logo, address, contact details). Not body text.",
  footer:
    "footer: the fine print at the VERY BOTTOM of the page " +
    "(page numbers, disclaimers, confidentiality notices). Not body text.",
  signature:
    "signature: a HANDWRITTEN ink signature near the closing of the letter " +
    "(a drawn squiggle, NOT typed text, NOT the printed/typed name).",
};

/** Gemini box: [ymin, xmin, ymax, xmax], each 0–1000, top-left origin. */
type Box2D = [number, number, number, number];

interface VisionDetection {
  kind: string;
  box_2d: Box2D;
}

/**
 * The structured-output schema: an object carrying an `is_document` verdict and
 * a `regions` array of {kind, box_2d}. Forcing structured JSON means we never
 * scrape free text, and we get the document classification in the same call.
 */
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    is_document: {
      type: Type.BOOLEAN,
      description:
        "True if the image is a document (a letter, form, scan, memo, " +
        "invoice, contract, etc.). False if it is a photo, screenshot of " +
        "something non-document, artwork, or other picture.",
    },
    regions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kind: {
            type: Type.STRING,
            description: "Which region this box locates.",
          },
          box_2d: {
            type: Type.ARRAY,
            description:
              "Bounding box [ymin, xmin, ymax, xmax], each normalized to 0-1000.",
            items: { type: Type.NUMBER },
            minItems: "4",
            maxItems: "4",
          },
        },
        required: ["kind", "box_2d"],
      },
    },
  },
  required: ["is_document", "regions"],
};

// One client per process; constructing it is cheap but pointless to repeat.
let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!config.geminiApiKey) {
    throw new Error("Gemini vision is not configured (no GEMINI_API_KEY).");
  }
  client ??= new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

/**
 * Ask Gemini to locate the requested region kinds on `page` and judge whether
 * the page is a document. Returns the boxes (page-pixel space) for the kinds
 * the model found, plus `isDocument`. Kinds the model couldn't find are absent.
 *
 * Any failure (missing key, auth, network, 5xx, rate/quota, empty/unparseable
 * response) is classified and thrown as a typed `VisionError` so the caller can
 * apply per-input-type policy. Never throws an unclassified error.
 */
export async function detectRegionsWithVision(
  page: RasterPage,
  kinds: RegionKind[],
): Promise<VisionPageResult> {
  let ai: GoogleGenAI;
  try {
    ai = getClient();
  } catch (error) {
    // No key / client construction failure — the service is unavailable to us.
    throw classifyVisionError(error);
  }

  const wanted = kinds.map((k) => `- ${KIND_GUIDANCE[k]}`).join("\n");
  const prompt =
    "You are a precise document-layout detector. First decide whether the " +
    "image is a DOCUMENT (a letter, form, scan, memo, invoice, contract, " +
    "etc.) as opposed to a photo, artwork, or other picture, and report that " +
    "as `is_document`.\n\n" +
    "Then locate ONLY the following regions, if present:\n" +
    `${wanted}\n\n` +
    "Return one `regions` entry per region you can locate, using exactly " +
    `these \`kind\` values: ${kinds.join(", ")}. If a region is not present, ` +
    "omit it entirely — do not guess. Each box must be [ymin, xmin, ymax, " +
    "xmax] normalized to 0-1000 with the origin at the top-left corner.";

  let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
  try {
    response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/png",
                data: page.png.toString("base64"),
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        // Detection is deterministic-ish; keep it from wandering.
        temperature: 0,
      },
    });
  } catch (error) {
    // Network / auth / 5xx / rate-limit / safety block all surface here.
    throw classifyVisionError(error);
  }

  const raw = response.text;
  if (!raw) {
    // Empty body — often a safety block or a truncated/blocked candidate.
    throw new VisionError(
      "unavailable",
      "The document-analysis service returned an empty response.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new VisionError(
      "unavailable",
      "The document-analysis service returned an unreadable response.",
    );
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new VisionError(
      "unavailable",
      "The document-analysis service returned an unexpected response.",
    );
  }

  const obj = parsed as { is_document?: unknown; regions?: unknown };
  // Default to true: only an explicit `false` rejects a page as not-a-document,
  // so a quirk in the verdict never mislabels a real scan.
  const isDocument = obj.is_document !== false;
  const regions = Array.isArray(obj.regions)
    ? (obj.regions as VisionDetection[])
    : [];

  const requested = new Set<RegionKind>(kinds);
  const boxes: Partial<Record<RegionKind, BoundingBox>> = {};

  for (const entry of regions) {
    const kind = entry?.kind as RegionKind;
    if (!requested.has(kind)) continue; // ignore unknown / unrequested kinds
    if (boxes[kind]) continue; // keep the first box for a kind
    const box = denormalizeBox(entry.box_2d, page.width, page.height);
    if (box) boxes[kind] = box;
  }

  return { boxes, isDocument };
}

/**
 * Classify a thrown value from the Gemini call into a typed VisionError.
 *
 * The `@google/genai` SDK throws an `ApiError`-shaped object exposing `status`
 * (numeric HTTP code), `name`, and `message`. We match on the status and the
 * message text rather than `instanceof` because the error may be re-thrown as a
 * plain object or wrapped by fetch.
 *
 * - rate / quota / token-limit (HTTP 429, or messages mentioning quota / rate /
 *   limit / exhausted / RESOURCE_EXHAUSTED) → "rate_limited" (→ AI_RATE_LIMITED).
 * - everything else — auth (401/403/API key), network, 5xx, safety block,
 *   empty/unparseable — → "unavailable" (→ AI_UNAVAILABLE).
 */
function classifyVisionError(error: unknown): VisionError {
  if (error instanceof VisionError) return error;

  const e = error as
    | { status?: unknown; code?: unknown; name?: string; message?: string }
    | null;
  const status = typeof e?.status === "number" ? e.status : undefined;
  const codeNum = typeof e?.code === "number" ? e.code : undefined;
  const httpStatus = status ?? codeNum;
  const message = e?.message ?? String(error ?? "");
  const haystack = `${e?.name ?? ""} ${message}`.toLowerCase();

  const looksRateLimited =
    httpStatus === 429 ||
    /resource[_ ]?exhausted|quota|rate.?limit|too many requests|exhausted|token limit/.test(
      haystack,
    );

  if (looksRateLimited) {
    return new VisionError(
      "rate_limited",
      "The document-analysis service is rate-limited right now.",
    );
  }

  return new VisionError(
    "unavailable",
    "The document-analysis service is unavailable right now.",
  );
}

/**
 * Convert a Gemini `box_2d` ([ymin,xmin,ymax,xmax] in 0–1000) into a page-pixel
 * {x,y,width,height}, clamped to the page. Returns null if the box is malformed
 * or degenerate (so the caller falls back to the heuristic for that kind).
 */
function denormalizeBox(
  box: Box2D,
  pageWidth: number,
  pageHeight: number,
): BoundingBox | null {
  if (!Array.isArray(box) || box.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = box;
  if (![ymin, xmin, ymax, xmax].every((n) => typeof n === "number" && Number.isFinite(n))) {
    return null;
  }

  // Normalize, order, and scale to pixels.
  const x0 = clamp((Math.min(xmin, xmax) / 1000) * pageWidth, 0, pageWidth);
  const x1 = clamp((Math.max(xmin, xmax) / 1000) * pageWidth, 0, pageWidth);
  const y0 = clamp((Math.min(ymin, ymax) / 1000) * pageHeight, 0, pageHeight);
  const y1 = clamp((Math.max(ymin, ymax) / 1000) * pageHeight, 0, pageHeight);

  const x = Math.round(x0);
  const y = Math.round(y0);
  const width = Math.round(x1 - x0);
  const height = Math.round(y1 - y0);
  if (width < 1 || height < 1) return null;

  return { x, y, width, height };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
