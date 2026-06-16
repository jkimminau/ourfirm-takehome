import type { NextConfig } from "next";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";

const nextConfig: NextConfig = {
  // Native modules must load at runtime, not be bundled. pdf-to-img pulls in
  // @napi-rs/canvas; sharp is libvips-backed. Bundling their `.node` binaries
  // is the most common cause of broken PDF/image processing on Vercel.
  serverExternalPackages: ["pdf-to-img", "@napi-rs/canvas", "sharp"],
};

// Next 16 runs Turbopack by default; opt the vanilla-extract integration into
// it (the plugin defaults to webpack-only mode, which Turbopack rejects).
const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

export default withVanillaExtract(nextConfig);
