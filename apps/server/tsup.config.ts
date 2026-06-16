import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  // Bundle the workspace contract package (TS source) into the output...
  noExternal: ["@ourfirm/shared"],
  // ...but keep native/heavy deps external so their binaries load at runtime.
  external: ["sharp", "@napi-rs/canvas", "pdfjs-dist"],
});
