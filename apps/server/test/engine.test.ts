import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { MAX_UPLOAD_BYTES, isDetected, type Region } from "@ourfirm/shared";
import {
  extractDocument,
  isExtractionError,
  validateDocument,
} from "../src/extraction/index.js";

const SAMPLES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../web/public/samples",
);
const read = (name: string) => readFile(path.join(SAMPLES, name));
const byKind = (regions: Region[]) =>
  Object.fromEntries(regions.map((r) => [r.kind, r])) as Record<
    Region["kind"],
    Region
  >;

async function expectError(fn: () => Promise<unknown>, code: string) {
  try {
    await fn();
    assert.fail(`expected ExtractionError ${code}, but it resolved`);
  } catch (error) {
    assert.ok(isExtractionError(error), `not an ExtractionError: ${error}`);
    assert.equal(error.code, code);
  }
}

test("validateDocument rejects a non-PDF by magic bytes, not extension", async () => {
  await expectError(
    () => validateDocument(Buffer.from("plainly not a pdf"), "evil.pdf"),
    "UNSUPPORTED_FILE_TYPE",
  );
});

test("validateDocument rejects an empty file", async () => {
  await expectError(
    () => validateDocument(Buffer.alloc(0), "empty.pdf"),
    "EMPTY_FILE",
  );
});

test("validateDocument rejects a file over the size limit", async () => {
  await expectError(
    () => validateDocument(Buffer.alloc(MAX_UPLOAD_BYTES + 1), "huge.pdf"),
    "FILE_TOO_LARGE",
  );
});

test("extractDocument finds all three regions in a signed letter", async () => {
  const result = await extractDocument(
    await read("signed-letter.pdf"),
    "signed-letter.pdf",
  );
  assert.equal(result.regions.length, 3);
  assert.equal(result.previews.length, result.pageCount);
  const regions = byKind(result.regions);
  assert.equal(regions.letterhead.status, "detected");
  assert.equal(regions.signature.status, "detected");
  assert.equal(regions.footer.status, "detected");
});

test("the signature is the drawn ink, not the footer text", async () => {
  const result = await extractDocument(
    await read("signed-letter.pdf"),
    "signed-letter.pdf",
  );
  const regions = byKind(result.regions);
  const sig = regions.signature;
  const foot = regions.footer;
  assert.ok(isDetected(sig) && isDetected(foot));
  // The signature sits above the footer and carries no footer text underneath.
  assert.ok(sig.box.y < foot.box.y, "signature should be above the footer");
  assert.doesNotMatch(sig.text, /confidential/i);
  assert.match(foot.text, /confidential/i);
});

test("absent regions are reported as not_detected", async () => {
  const result = await extractDocument(
    await read("project-memo.pdf"),
    "project-memo.pdf",
  );
  const regions = byKind(result.regions);
  assert.equal(regions.letterhead.status, "detected");
  assert.equal(regions.signature.status, "not_detected");
  assert.equal(regions.footer.status, "not_detected");
});

test("a malformed PDF surfaces as CORRUPT_DOCUMENT", async () => {
  await expectError(
    async () => extractDocument(await read("corrupt.pdf"), "corrupt.pdf"),
    "CORRUPT_DOCUMENT",
  );
});
