import { createRequire } from "node:module";
import path from "node:path";

import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";

import { DEFAULT_MESSAGES, ExtractionError } from "./errors.js";

/**
 * We rasterize and read the text layer in a single pass, at one scale, so the
 * page image and the text-layer coordinates share one coordinate system.
 * ~2x of the PDF's natural 72 DPI ≈ 144 DPI — enough detail for crisp crops
 * and reliable ink detection without blowing up memory on large documents.
 *
 * NOTE: we render with pdfjs-dist + @napi-rs/canvas directly rather than going
 * through `pdf-to-img`. In this workspace `pdf-to-img` bundles pdfjs 5.6.x but
 * resolves the hoisted pdfjs 6.x for its worker/font paths, which throws an
 * "API version does not match Worker version" error. Driving pdfjs ourselves
 * uses ONE pdfjs version for both rendering and text, and avoids a second parse.
 */
export const RENDER_SCALE = 2;

/**
 * Max width we rasterize an uploaded image to. Mirrors the effective resolution
 * of a PDF page rendered at RENDER_SCALE (a US-Letter page at 2x ≈ 1224px wide,
 * Legal/oversize a bit more), so the heuristics and crop encoder see comparable
 * detail whether the source was a PDF or a standalone image. Larger images are
 * downscaled; smaller ones are never enlarged.
 */
export const IMAGE_MAX_WIDTH = 1600;

/** A single rasterized page plus the words pdfjs found on it (image pixel space). */
export interface RasterPage {
  /** Zero-based page index. */
  index: number;
  /** PNG buffer of the full page at RENDER_SCALE. */
  png: Buffer;
  /** Page image dimensions in pixels at RENDER_SCALE. */
  width: number;
  height: number;
  /** Words extracted from the text layer, positioned in image-pixel space. */
  words: TextWord[];
}

/** A word from the PDF text layer, converted to top-left-origin pixel space. */
export interface TextWord {
  text: string;
  /** Top-left x of the word's box, in image pixels. */
  x: number;
  /** Top-left y of the word's box, in image pixels. */
  y: number;
  width: number;
  height: number;
}

// pdfjs needs to know where its bundled CMaps / standard fonts live so it can
// decode documents that rely on them. Resolve them off the installed package.
const require = createRequire(import.meta.url);
const pdfjsDir = path.dirname(require.resolve("pdfjs-dist/package.json"));
const STANDARD_FONT_DATA_URL = path.join(pdfjsDir, "standard_fonts") + path.sep;
const CMAP_URL = path.join(pdfjsDir, "cmaps") + path.sep;

/**
 * Parse the PDF, then render every page and read its text layer.
 *
 * Throws only `ExtractionError`s:
 *  - PASSWORD_PROTECTED for encrypted documents,
 *  - CORRUPT_DOCUMENT for anything that fails to parse / render,
 *  - NO_PAGES for a structurally valid PDF with zero pages.
 */
export async function rasterizeDocument(bytes: Buffer): Promise<RasterPage[]> {
  let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    doc = await pdfjs.getDocument({
      // pdfjs mutates the buffer it parses; hand it a private copy.
      data: Uint8Array.from(bytes),
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
      // Disable eval for safety; valid at runtime but absent from the published
      // type, so widen the param object here.
      isEvalSupported: false,
      // Quietest verbosity so pdfjs doesn't write warnings to the console.
      verbosity: 0,
    } as Parameters<typeof pdfjs.getDocument>[0]).promise;
  } catch (error) {
    throw classifyPdfError(error);
  }

  try {
    if (doc.numPages === 0) {
      throw new ExtractionError("NO_PAGES", DEFAULT_MESSAGES.NO_PAGES);
    }

    const pages: RasterPage[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      pages.push(await renderPage(doc, pageNumber));
    }
    return pages;
  } finally {
    // Tear down worker/transport; the documented way to free a parsed document.
    await doc.loadingTask.destroy().catch(() => {
      /* best-effort cleanup; never mask the real error */
    });
  }
}

/**
 * Rasterize a standalone image (PNG/JPEG) into a single-page RasterPage so it
 * flows through the same detect → crop → preview pipeline as a PDF page.
 *
 * The image is flattened onto white (so transparent PNGs and CMYK/odd-channel
 * JPEGs encode cleanly and match the heuristics' assumption of dark ink on
 * white paper), downscaled to IMAGE_MAX_WIDTH if larger, and re-encoded as PNG.
 * There is no text layer in an image, so `words` is empty — every region falls
 * to the pixel heuristics (or the vision layer) and signature text is "".
 *
 * Throws CORRUPT_DOCUMENT if sharp can't decode the bytes (truncated/garbage
 * image that nonetheless slipped past magic-byte validation).
 */
export async function rasterizeImage(bytes: Buffer): Promise<RasterPage[]> {
  try {
    const pipeline = sharp(bytes)
      // Honour EXIF orientation so a phone-rotated scan isn't analysed sideways.
      .rotate()
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true });

    const { data, info } = await pipeline
      .png()
      .toBuffer({ resolveWithObject: true });

    return [
      {
        index: 0,
        png: data,
        width: info.width,
        height: info.height,
        words: [],
      },
    ];
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      "CORRUPT_DOCUMENT",
      DEFAULT_MESSAGES.CORRUPT_DOCUMENT,
    );
  }
}

/** Render one page to PNG and extract its text words (best-effort). */
async function renderPage(
  doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>,
  pageNumber: number,
): Promise<RasterPage> {
  let png: Buffer;
  let width: number;
  let height: number;
  let scaledHeight: number;
  let page: Awaited<ReturnType<typeof doc.getPage>>;

  try {
    page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    width = Math.max(1, Math.ceil(viewport.width));
    height = Math.max(1, Math.ceil(viewport.height));
    // viewport.height is already in scaled (render) pixels.
    scaledHeight = viewport.height;

    const canvas = createCanvas(width, height);
    // @napi-rs/canvas implements the subset of the canvas API pdfjs needs, but
    // its type doesn't match pdfjs's DOM-typed `canvas` param; cast through.
    await page.render(
      { canvas, viewport } as unknown as Parameters<typeof page.render>[0],
    ).promise;
    png = canvas.toBuffer("image/png");
  } catch (error) {
    throw classifyPdfError(error);
  }

  // Text extraction is best-effort: a scanned PDF can be valid with no text
  // layer. Failure here just yields a word-less page; it never aborts.
  let words: TextWord[] = [];
  try {
    const content = await page.getTextContent();
    words = extractWords(
      content.items as Array<{
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      }>,
      scaledHeight,
    );
  } catch {
    words = [];
  }

  return { index: pageNumber - 1, png, width, height, words };
}

/**
 * Convert pdfjs text items into top-left-origin pixel-space words.
 *
 * item.transform = [a, b, c, d, e, f] in unscaled PDF user space (origin
 * bottom-left); e,f is the text baseline origin. We scale by RENDER_SCALE and
 * flip Y so it matches the rasterized image.
 */
function extractWords(
  items: Array<{ str?: string; transform?: number[]; width?: number; height?: number }>,
  scaledHeight: number,
): TextWord[] {
  const words: TextWord[] = [];
  for (const item of items) {
    if (typeof item.str !== "string") continue; // skip TextMarkedContent
    const str = item.str.trim();
    if (!str || !item.transform) continue;

    const [, , , , e, f] = item.transform;
    const scaledX = (e ?? 0) * RENDER_SCALE;
    const scaledY = (f ?? 0) * RENDER_SCALE;
    const w = (item.width ?? 0) * RENDER_SCALE;
    const h = (item.height ?? 0) * RENDER_SCALE;

    // scaledHeight is in render pixels; the baseline sits at the box bottom,
    // so flipping Y puts the box top one glyph-height above the baseline.
    const top = scaledHeight - scaledY - h;
    words.push({ text: str, x: scaledX, y: top, width: w, height: h });
  }
  return words;
}

/**
 * Map a thrown value from pdfjs onto an ExtractionError. We match on the
 * exception name and message text rather than `instanceof` because the error
 * may originate inside pdfjs's worker and be re-thrown as a plain object.
 */
function classifyPdfError(error: unknown): ExtractionError {
  // Already-classified errors (e.g. NO_PAGES bubbling through) pass through.
  if (error instanceof ExtractionError) return error;

  const name = (error as { name?: string } | null)?.name ?? "";
  const message =
    (error as { message?: string } | null)?.message ?? String(error ?? "");
  const haystack = `${name} ${message}`.toLowerCase();

  if (
    name === "PasswordException" ||
    haystack.includes("password") ||
    haystack.includes("encrypted")
  ) {
    return new ExtractionError(
      "PASSWORD_PROTECTED",
      DEFAULT_MESSAGES.PASSWORD_PROTECTED,
    );
  }

  return new ExtractionError(
    "CORRUPT_DOCUMENT",
    DEFAULT_MESSAGES.CORRUPT_DOCUMENT,
  );
}
