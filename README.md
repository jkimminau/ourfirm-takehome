# Document Region Extractor

Upload a PDF and extract three regions — **signature**, **letterhead**, and
**footer** — each downloadable as a **PNG or JPEG**. Built for the OurFirm Full
Stack engineering assessment.

> **Live demo:** **https://ourfirm-takehome.vercel.app**
> (client on Vercel · API on Heroku)

---

## Quick start

You need **Node 22** (see `.nvmrc`). Pick one:

### Docker (single command)

```bash
docker compose up --build
```

Then open **http://localhost:3000**. This builds and runs both the client
(`:3000`) and the processing server (`:4000`).

### Local dev (hot reload)

```bash
nvm use            # Node 22
npm install
npm run dev        # web on :3000, server on :4000 (concurrently)
```

Either way, click **Try a sample** to run a bundled document, or drop in your own
PDF.

---

## What it does

1. You upload a PDF (drag-and-drop or file picker), or pick a bundled sample.
2. The **server** rasterizes the pages, locates the three regions with
   transparent heuristics, and crops each one.
3. The **client** shows a preview of the document alongside each extracted region
   with its detection confidence, the selectable text it contains, and one-click
   **PNG / JPEG** downloads.

Imperfect extraction is expected and handled: when a region isn't present (or
can't be found confidently) the UI says so clearly rather than guessing.

---

## Architecture

Two separate projects + a shared contract, in an npm-workspaces monorepo:

```
ourfirm-takehome/
├── apps/
│   ├── web/        Next.js 16 client — upload, document viewing, downloads
│   └── server/     Fastify backend — the document-processing engine
├── packages/
│   └── shared/     @ourfirm/shared — the API/region/error contract (one source of truth)
└── scripts/        sample-document generator
```

- **Client = viewing, server = processing.** The split keeps the heavy,
  native-dependency work (PDF rasterization, image processing) in a real
  long-running Node container, instead of fighting serverless function limits.
- **`@ourfirm/shared`** is imported by both apps, so the API shape, region/error
  types, and upload limits can never drift apart.
- The client talks to the server over one HTTP endpoint, `POST /api/extract`
  (multipart upload → JSON result or a human-readable error).

### How extraction works (the heuristics)

Region detection is **our own logic**, not a black box. Each page is rasterized
at ~2× (≈144 DPI) with `pdfjs-dist` + `@napi-rs/canvas`; the PDF text layer is
read in the same pass so text positions share the image's coordinate system.

| Region | Approach |
| --- | --- |
| **Letterhead** | Top band of page 1; tightened to the ink bounding box. |
| **Footer** | Bottom band of the last page; same ink-tightening. |
| **Signature** | The interesting one (see below). |

**Signatures** are detected by a key insight: a real signature is **drawn ink
with no text-layer words underneath it**, whereas a footer or a typed name *is*
text. So the detector searches the area *below the letterhead and above the
footer* (the footer band is excluded outright), finds connected ink clusters,
and strongly prefers clusters with **low text-layer overlap** — rejecting printed
text. It also biases toward ink just below a closing anchor ("Sincerely",
"Regards", "IN WITNESS WHEREOF", "PROVIDER", "By:"). Crops are encoded to both
PNG and JPEG with `sharp`.

A **confidence** score (0–1) accompanies each detection and is surfaced in the UI
with a colour: green (high), amber (moderate — eyeball the crop), red (low).

---

## Tech choices & trade-offs

- **TypeScript everywhere** (required), strict mode, shared contract package.
- **Next.js 16 (App Router)** for the client — first-class Vercel deploys, React
  framework familiarity. **Fastify 5** for the server — mature multipart uploads,
  schema validation, and a clean centralized error handler.
- **vanilla-extract** for styling rather than Tailwind — zero-runtime, fully
  typed CSS that reads like CSS (wired for Next 16's Turbopack via
  `unstable_turbopack`).
- **PDF rasterization: `pdfjs-dist` + `@napi-rs/canvas`.** I initially reached
  for `pdf-to-img`, but in this workspace it bundles pdfjs `5.6.x` while
  resolving the hoisted pdfjs `6.x` for its worker, throwing an
  "API version does not match Worker version" error. Driving pdfjs directly uses
  one version for both rendering and the text layer, and removes a redundant
  parse. The swap is isolated to `apps/server/src/extraction/rasterize.ts`.
- **Document preview is server-rendered.** Rather than embed a browser PDF viewer
  (inconsistent across browsers, blank in some headless contexts), the server
  returns downscaled JPEG page images. The preview always paints and matches
  exactly what the engine analysed.
- **Output formats.** Each region is encoded as **both** PNG and JPEG up front, so
  the client offers either download with no second round-trip and no server
  state.

## Error handling

Errors are a first-class feature — every failure is a typed code mapped to a
safe, human-readable message (never a raw stack trace), defined in
`@ourfirm/shared`:

| Situation | Code | What the user sees |
| --- | --- | --- |
| Wrong / disguised file type | `UNSUPPORTED_FILE_TYPE` | "That file isn't a PDF…" |
| File over the 25 MB limit | `FILE_TOO_LARGE` | "That file is larger than the 25 MB limit." |
| Empty / truncated upload | `EMPTY_FILE` / `UPLOAD_INTERRUPTED` | "…did not finish uploading." |
| Malformed PDF | `CORRUPT_DOCUMENT` | "We couldn't read that PDF…" |
| Encrypted PDF | `PASSWORD_PROTECTED` | "This PDF is password-protected." |
| Region absent | _(per region)_ | "No signature found in the lower portion…" |

File-type validation **inspects the magic bytes, not the extension**, so a text
file or a gzip renamed `.pdf` is caught (try the "Disguised text file" sample).

## Sample documents

Bundled in `apps/web/public/samples/` and offered in the in-app gallery
(regenerate with `npm run samples`):

- **signed-letter.pdf** — letterhead + a hand-signed close + footer (all detected).
- **service-agreement.pdf** — 3 pages, signature on the last page.
- **project-memo.pdf** — letterhead only; signature + footer report "not detected".
- **corrupt.pdf** / **not-a-pdf.pdf** — exercise the error paths.

## Deployment

The live demo runs the client on Vercel and the backend on Heroku.

- **Client → Vercel.** A root `vercel.json` builds the `@ourfirm/web` workspace
  (`outputDirectory: apps/web/.next`) so the monorepo install resolves
  `@ourfirm/shared`. Set `NEXT_PUBLIC_API_URL` to the backend URL.
- **Backend → Heroku** (container stack), built remotely from `Dockerfile.server`
  via `heroku.yml` — no local Docker needed. Set `CORS_ORIGINS` to the client's
  URL. The same image runs locally (`docker compose`), on Heroku, or any
  container host. (Heroku uses the Dockerfile's directory as build context, which
  is why the Dockerfiles live at the repo root.)

### Environment variables

| App | Variable | Purpose |
| --- | --- | --- |
| server | `PORT` | Listen port (Heroku sets this; defaults to 4000). |
| server | `CORS_ORIGINS` | Comma-separated allowed origins (defaults to `http://localhost:3000`). |
| web | `NEXT_PUBLIC_API_URL` | Backend base URL (defaults to `http://localhost:4000`). |

## Known limitations & what I'd do with more time

- **Signature detection** is tuned and verified against the sample set, but the
  text-overlap threshold and anchor logic are heuristics. A signature drawn
  directly over a printed signature line, or an unanchored one, may be missed or
  loosely cropped. The confidence colour-coding is there to flag exactly these
  cases.
- **Single-page assumptions** — letterhead is sought on page 1, footer/signature
  on the last page.
- **Deliberately deferred** (documented trade-offs, not oversights): `.docx`
  input, OCR for scanned PDFs, adjustable crop handles, batch upload + ZIP
  download, a raster→SVG signature, an optional vision-API refinement layer, and
  an automated test suite. The architecture (typed engine behind a thin route,
  shared contract) is set up to add these cleanly.

## Project scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Run web + server with hot reload. |
| `npm run build` | Build server then web. |
| `npm run samples` | Regenerate the sample PDFs. |
| `docker compose up --build` | Run the whole app in containers. |

---

_Built with assistance from Claude Code; the collaboration log is kept locally in
a gitignored `.notes/` folder._
