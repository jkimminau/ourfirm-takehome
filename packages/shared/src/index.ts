/**
 * @ourfirm/shared — the contract between the client (`apps/web`) and the
 * document-processing server (`apps/server`).
 *
 * This package is the single source of truth for the API shape, region/error
 * types, and upload constraints. Both apps import from here so they cannot
 * drift apart. It is consumed as raw TypeScript source (no build step):
 *   - web compiles it via Next `transpilePackages`
 *   - server transpiles it via tsx (dev) / tsup `noExternal` (build)
 */

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** The three regions the app extracts from a document. */
export type RegionKind = "signature" | "letterhead" | "footer";

export const REGION_KINDS: readonly RegionKind[] = [
  "letterhead",
  "signature",
  "footer",
];

/** Output image formats the brief requires us to support. */
export type ImageFormat = "png" | "jpeg";

export const IMAGE_FORMATS: readonly ImageFormat[] = ["png", "jpeg"];

/** A rectangle in page-image pixel space (origin top-left). */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The rasterized page a region was found on, in pixels at the render scale. */
export interface PageRef {
  /** Zero-based page index in the source document. */
  index: number;
  width: number;
  height: number;
}

/**
 * The extracted region crop, encoded as data URLs in BOTH required formats so
 * the client can preview and download either without a second round-trip or
 * any server-side state. The server is the image authority; the client only
 * chooses which encoding to hand the user.
 */
export interface RegionImages {
  png: string;
  jpeg: string;
}

/** A region that was located on the document. */
export interface DetectedRegion {
  kind: RegionKind;
  status: "detected";
  page: PageRef;
  box: BoundingBox;
  images: RegionImages;
  /** 0–1 heuristic confidence; informational, drives UI hinting only. */
  confidence: number;
}

/** A region the heuristics could not confidently locate. */
export interface MissingRegion {
  kind: RegionKind;
  status: "not_detected";
  /** Human-readable explanation shown directly in the UI. */
  message: string;
}

export type Region = DetectedRegion | MissingRegion;

export function isDetected(region: Region): region is DetectedRegion {
  return region.status === "detected";
}

/** Successful response body of `POST /api/extract`. */
export interface ExtractionResult {
  fileName: string;
  pageCount: number;
  /** Always one entry per RegionKind, in REGION_KINDS order. */
  regions: Region[];
}

// ---------------------------------------------------------------------------
// Errors — every failure the client can render as a human-readable message
// ---------------------------------------------------------------------------

export type ExtractionErrorCode =
  /** Not a PDF, or magic bytes don't match the claimed type (disguised file). */
  | "UNSUPPORTED_FILE_TYPE"
  /** Exceeds MAX_UPLOAD_BYTES. */
  | "FILE_TOO_LARGE"
  /** Zero-byte or truncated upload. */
  | "EMPTY_FILE"
  /** Parsed as a PDF but malformed / cannot be rasterized. */
  | "CORRUPT_DOCUMENT"
  /** Encrypted / password-protected document. */
  | "PASSWORD_PROTECTED"
  /** Valid container but no renderable pages. */
  | "NO_PAGES"
  /** Upload did not complete (network drop / aborted). */
  | "UPLOAD_INTERRUPTED"
  /** Unexpected server-side failure. */
  | "PROCESSING_FAILED";

/** Error response body for any non-2xx from the server. */
export interface ApiError {
  error: {
    code: ExtractionErrorCode;
    /** Safe, human-readable message — never a raw stack trace. */
    message: string;
    /** Optional extra context (e.g. detected type), also safe to display. */
    detail?: string;
  };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiError).error?.code === "string"
  );
}

// ---------------------------------------------------------------------------
// Upload constraints — shared so client and server validate identically
// ---------------------------------------------------------------------------

/** Max accepted upload size. Enforced on both client and server. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/** The only container we accept at MVP (docx is a deferred bonus). */
export const ACCEPTED_MIME_TYPES: readonly string[] = ["application/pdf"];
export const ACCEPTED_EXTENSIONS: readonly string[] = [".pdf"];

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

/** Multipart field name carrying the uploaded document. */
export const UPLOAD_FIELD_NAME = "file";

export const API_ROUTES = {
  health: "/health",
  extract: "/api/extract",
} as const;
