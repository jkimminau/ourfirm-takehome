import withLinaria, { type LinariaConfig } from "next-with-linaria";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Monorepo root, so standalone output traces the @ourfirm/shared workspace dep.
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const config: LinariaConfig = {
  // Consume the shared contract package as raw TypeScript source.
  transpilePackages: ["@ourfirm/shared"],
  // Self-contained server bundle for a slim Docker image (`node server.js`).
  output: "standalone",
  outputFileTracingRoot: repoRoot,
};

// Linaria is a webpack/babel transform, so dev + build run with `--webpack`
// (Next 16 defaults to Turbopack, which Linaria doesn't support).
export default withLinaria(config);
