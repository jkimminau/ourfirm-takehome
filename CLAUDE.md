@AGENTS.md

# ourfirm-takehome

Take-home assessment: a web app that accepts a document upload (PDF; `.docx` a
plus) and extracts three regions — **signature**, **letterhead**, **footer** —
returning each as a downloadable **PNG or JPEG**. The full brief is at
`.notes/takehome-prompt.md` (gitignored).

## Stack
- **Next.js 16** (App Router) + **TypeScript**, deployed on **Vercel**.
  Turbopack is the default dev/build bundler — read `node_modules/next/dist/docs/`
  before using Next APIs (Next 16 has breaking changes vs. older training data).
- **vanilla-extract** for styling (zero-runtime, typed CSS in `*.css.ts`). It is
  wired for Turbopack via `unstable_turbopack: { mode: 'auto' }` in `next.config.ts`
  plus `@vanilla-extract/turbopack-plugin`. **Do not introduce Tailwind.**
- **framer-motion** for animation (sparingly — clean hover/transition only).
- Document processing: **pdf-to-img** (rasterize), **pdfjs-dist** (text-layer
  coords for heuristics), **sharp** (crop + PNG/JPEG export), **file-type**
  (magic-byte validation). These native packages are listed in
  `serverExternalPackages` and must run on the Node.js runtime, not Edge.

## Architecture
- **Server-side extraction**: Next.js route handler(s) rasterize → heuristically
  detect regions (our own logic) → crop → return PNG/JPEG. Keep core logic in-repo
  and readable.
- **Heuristics-first.** A vision API (Gemini via Vercel AI SDK) is a deferred
  enhancement layer, not required — the brief mandates our own logic regardless.
- Heuristic approach: grayscale → threshold → ink-density projection →
  connected-component bbox, constrained to top band (letterhead) / bottom band
  (footer) / bottom of last page + text anchors (signature).

## Conventions
- Node 22 (`.nvmrc`); `nvm use` before running scripts.
- Run dev: `npm run dev` (Turbopack, port 3000).
- Error handling is a first-class feature: unsupported/disguised files (check
  magic bytes, not extension), corrupt PDFs, interrupted uploads, and
  regions-not-detected must all surface **human-readable** messages, never raw
  stack traces.
- Light mode only for now.

## Decisions & history
See `.notes/ai-collaboration-log.md` for the running decision record.
