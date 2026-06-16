# ourfirm-takehome

Take-home assessment: a web app that accepts a document upload (PDF; `.docx` a
plus) and extracts three regions — **signature**, **letterhead**, **footer** —
returning each as a downloadable **PNG or JPEG**. The full brief is at
`.notes/takehome-prompt.md` (gitignored).

## Monorepo layout (npm workspaces)
Two separate projects + a shared contract, by design:
- **`apps/web`** — the **client**. Next.js 16 (App Router) + TypeScript. Handles
  upload, document viewing/preview, region previews, and downloads. Talks to the
  server over HTTP. Deploys to Vercel. See `apps/web/AGENTS.md` for the Next 16
  breaking-changes warning — read `node_modules/next/dist/docs/` before using
  Next APIs.
- **`apps/server`** — the **document-processing backend**. Node + TypeScript +
  **Fastify 5**. Does all the heavy lifting (rasterize → detect → crop → encode)
  as a real Node container, which sidesteps serverless native-dep limits.
- **`packages/shared`** (`@ourfirm/shared`) — the **contract**: API shape,
  region/error types, upload constraints. Both apps import it; consumed as raw
  TS source (web via `transpilePackages`, server via tsx/tsup). It is the source
  of truth — change types here, not in either app.

Run everything: `npm run dev` from the root (concurrently starts web on :3000
and server on :4000). Node 22 (`.nvmrc`); `nvm use` first.

## Stack rules
- **Styling: Linaria** (zero-runtime CSS-in-JS). Write `` css`...` `` from
  `@linaria/core` **in the component's `.tsx`, below the component** — no separate
  style files. Tokens come from `@/styles/theme` (`var(--…)` strings; values in
  `app/globals.css`). The web app runs on **webpack** (`next dev/build --webpack`)
  because Linaria doesn't support Turbopack. **No Tailwind, no vanilla-extract.**
- **Imports:** external/package imports first, blank line, then local imports.
  Local imports use absolute `@/…` paths (mapped to `apps/web/src`), not `../`.
- **framer-motion** for animation — sparingly (clean hover/transition only).
- Server processing libs: **pdfjs-dist** + **@napi-rs/canvas** (rasterize / text
  layer), **sharp** (crop + PNG/JPEG), **file-type** (magic-byte validation),
  optional **@google/genai** (Gemini vision). `apps/server` only, real Node runtime.
- Light mode only for now.

## Architecture & approach
- **Client = viewing, server = processing.** The client renders the uploaded PDF
  for preview; the server extracts regions and returns crops (both PNG + JPEG
  data URLs) so the client can preview/download either with no second round-trip.
- **Heuristics-first** (our own logic, required by the brief): grayscale →
  threshold → ink-density projection → connected-component bbox, constrained to
  top band (letterhead) / bottom band (footer) / bottom of last page + text
  anchors (signature). A vision API (Gemini) is a deferred enhancement, not MVP.
- **Error handling is a first-class feature.** Unsupported/disguised files
  (check magic bytes, not extension), corrupt PDFs, password-protected docs,
  interrupted uploads, and regions-not-detected must all surface **human-readable**
  messages — never raw stack traces. Error codes live in `@ourfirm/shared`.

## Decisions & history
See `.notes/ai-collaboration-log.md` for the running decision record.
