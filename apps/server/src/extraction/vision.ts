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
 * used as `detectedBy: "ai"`; any kind the model omits (or any failure) falls
 * back to the in-repo heuristics. This module therefore THROWS on any error
 * (missing key, network, malformed/parse) so the caller's try/catch can fall
 * back cleanly — it must never silently return partial-but-wrong data.
 */

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
 * The structured-output schema. We force an array of {kind, box_2d} objects so
 * the response is trivially parseable and we never have to scrape free text.
 */
const RESPONSE_SCHEMA: Schema = {
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
 * Ask Gemini to locate the requested region kinds on `page`. Returns a map from
 * the kinds the model DID find to their boxes in page-pixel space. Kinds the
 * model couldn't find are simply absent. Throws on any error.
 */
export async function detectRegionsWithVision(
  page: RasterPage,
  kinds: RegionKind[],
): Promise<Partial<Record<RegionKind, BoundingBox>>> {
  if (kinds.length === 0) return {};

  const ai = getClient();

  const wanted = kinds.map((k) => `- ${KIND_GUIDANCE[k]}`).join("\n");
  const prompt =
    "You are a precise document-layout detector. Examine the page image and " +
    "locate ONLY the following regions, if present:\n" +
    `${wanted}\n\n` +
    "Return one entry per region you can locate, using exactly these `kind` " +
    `values: ${kinds.join(", ")}. If a region is not present, omit it ` +
    "entirely — do not guess. Each box must be [ymin, xmin, ymax, xmax] " +
    "normalized to 0-1000 with the origin at the top-left corner.";

  const response = await ai.models.generateContent({
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

  const raw = response.text;
  if (!raw) {
    throw new Error("Gemini vision returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini vision returned non-JSON output.");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini vision response was not a JSON array.");
  }

  const requested = new Set<RegionKind>(kinds);
  const out: Partial<Record<RegionKind, BoundingBox>> = {};

  for (const entry of parsed as VisionDetection[]) {
    const kind = entry?.kind as RegionKind;
    if (!requested.has(kind)) continue; // ignore unknown / unrequested kinds
    if (out[kind]) continue; // keep the first box for a kind
    const box = denormalizeBox(entry.box_2d, page.width, page.height);
    if (box) out[kind] = box;
  }

  return out;
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
