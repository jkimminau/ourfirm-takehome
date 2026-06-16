import type { NextConfig } from "next";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Monorepo root, so standalone output traces the @ourfirm/shared workspace dep.
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  // Consume the shared contract package as raw TypeScript source.
  transpilePackages: ["@ourfirm/shared"],
  // Self-contained server bundle for a slim Docker image (`node server.js`).
  output: "standalone",
  outputFileTracingRoot: repoRoot,
};

// Next 16 runs Turbopack by default; opt the vanilla-extract integration into
// it (the plugin defaults to webpack-only mode, which Turbopack rejects).
const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

export default withVanillaExtract(nextConfig);
