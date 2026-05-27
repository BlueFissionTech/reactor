import test from "node:test";
import assert from "node:assert/strict";

import { BlueFissionResponse, normalizeResponse } from "../src/core/response.js";

test("normalizes DevElation-style response envelopes", () => {
  const payload = {
    status: "created",
    data: { id: 42, name: "Ada" },
    list: [{ id: 1 }],
    id: 42,
    query: "items",
    children: [{ id: 43 }],
    meta: { page: 1 }
  };

  const response = normalizeResponse(payload, { statusCode: 201 });

  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.data, { id: 42, name: "Ada" });
  assert.deepEqual(response.list, [{ id: 1 }]);
  assert.equal(response.id, 42);
  assert.equal(response.query, "items");
  assert.deepEqual(response.children, [{ id: 43 }]);
  assert.deepEqual(response.meta, { page: 1 });
  assert.equal(response.raw, payload);
});

test("coerces strings and error maps into a stable response shape", () => {
  const json = normalizeResponse("{\"data\":{\"ready\":true},\"errors\":{\"name\":[\"Required\"]}}");
  const text = normalizeResponse("plain text");

  assert.equal(json.ok, false);
  assert.deepEqual(json.errors, ["Required"]);
  assert.deepEqual(json.data, { ready: true });
  assert.equal(text.status, "Unparsed response");
  assert.equal(text.data, "plain text");
});

test("BlueFissionResponse exposes normalized fields", () => {
  const response = new BlueFissionResponse({ data: "saved", ok: true });

  assert.equal(response.ok, true);
  assert.equal(response.data, "saved");
  assert.deepEqual(response.errors, []);
});
