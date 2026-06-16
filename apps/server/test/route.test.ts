import { test } from "node:test";
import assert from "node:assert/strict";

import { buildServer } from "../src/index.js";

test("GET /health returns ok", async () => {
  const app = buildServer();
  const res = await app.inject({ method: "GET", url: "/health" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { status: "ok" });
  await app.close();
});

test("POST /api/extract without a file returns a readable, non-stack error", async () => {
  const app = buildServer();
  const res = await app.inject({
    method: "POST",
    url: "/api/extract",
    headers: { "content-type": "application/json" },
    payload: {},
  });
  assert.ok([400, 415].includes(res.statusCode));
  const body = res.json() as { error?: { code: string; message: string } };
  assert.ok(body.error, "expected an error body");
  assert.equal(typeof body.error.message, "string");
  // Never leak a stack trace / raw Error to the client.
  assert.doesNotMatch(body.error.message, /\bat \w|Error:|\.ts:|\.js:/);
  await app.close();
});
