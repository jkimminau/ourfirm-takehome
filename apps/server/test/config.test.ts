import { test } from "node:test";
import assert from "node:assert/strict";

import { buildModelChain } from "../src/config.js";

test("buildModelChain puts the primary first, then the fallbacks", () => {
  assert.deepEqual(
    buildModelChain("gemini-3.5-flash", "gemini-2.5-flash,gemini-2.0-flash"),
    ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"],
  );
});

test("buildModelChain trims whitespace and drops blanks", () => {
  assert.deepEqual(
    buildModelChain("gemini-3.5-flash", " gemini-2.5-flash , , "),
    ["gemini-3.5-flash", "gemini-2.5-flash"],
  );
});

test("buildModelChain dedupes while preserving order", () => {
  assert.deepEqual(
    buildModelChain("gemini-3.5-flash", "gemini-3.5-flash,gemini-2.5-flash"),
    ["gemini-3.5-flash", "gemini-2.5-flash"],
  );
});

test("buildModelChain handles no fallbacks", () => {
  assert.deepEqual(buildModelChain("gemini-3.5-flash", undefined), [
    "gemini-3.5-flash",
  ]);
  assert.deepEqual(buildModelChain("gemini-3.5-flash", ""), [
    "gemini-3.5-flash",
  ]);
});
