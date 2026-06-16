import type { NextConfig } from "next";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";

const nextConfig: NextConfig = {
  // Consume the shared contract package as raw TypeScript source.
  transpilePackages: ["@ourfirm/shared"],
};

// Next 16 runs Turbopack by default; opt the vanilla-extract integration into
// it (the plugin defaults to webpack-only mode, which Turbopack rejects).
const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

export default withVanillaExtract(nextConfig);
