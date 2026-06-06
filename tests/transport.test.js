import test from "node:test";
import assert from "node:assert/strict";

import {
  createResource,
  createResourceFromDefinition,
  createResourceRegistry,
  createTransport
} from "../src/core/transport.js";
import { createSignal } from "../src/core/signals.js";

test("transport prepares JSON requests, hooks, csrf, and normalized responses", async () => {
  const fetchCalls = [];
  const hookCalls = [];
  const transport = createTransport({
    baseUrl: "https://example.test/api",
    csrfToken: () => "csrf-token",
    defaultHeaders: {
      "X-App": "reactor"
    },
    fetchImpl: async (url, request) => {
      fetchCalls.push({ url, request });
      return {
        status: 201,
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ data: { saved: true }, id: 7 }),
        text: async () => ""
      };
    },
    onRequest: (event) => hookCalls.push(["request", event.url, event.request.method]),
    onResponse: (event) => hookCalls.push(["response", event.url, event.response.statusCode])
  });

  const response = await transport.post("/items", { name: "Ada" }, {
    headers: {
      "X-Trace": "abc123"
    }
  });

  assert.equal(fetchCalls[0].url, "https://example.test/api/items");
  assert.equal(fetchCalls[0].request.method, "POST");
  assert.equal(fetchCalls[0].request.headers.get("Content-Type"), "application/json");
  assert.equal(fetchCalls[0].request.headers.get("X-CSRF-TOKEN"), "csrf-token");
  assert.equal(fetchCalls[0].request.headers.get("X-App"), "reactor");
  assert.equal(fetchCalls[0].request.headers.get("X-Trace"), "abc123");
  assert.equal(fetchCalls[0].request.body, "{\"name\":\"Ada\"}");
  assert.equal(response.ok, true);
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.data, { saved: true });
  assert.equal(response.id, 7);
  assert.deepEqual(hookCalls, [
    ["request", "https://example.test/api/items", "POST"],
    ["response", "https://example.test/api/items", 201]
  ]);
});

test("resources resolve CRUD paths and serialize signal-backed model values", async () => {
  const calls = [];
  const transport = createRecordedTransport(calls);
  const resource = createResource(transport, "items");

  await resource.list({ page: 2, empty: null });
  await resource.read(7, { cache: "reload" });
  await resource.create({
    name: createSignal("Ada"),
    ignored() {
      return "skip";
    }
  });
  await resource.save({ id: 9, name: "Grace" });
  await resource.remove(11);
  await resource.call("search", {
    method: "GET",
    query: { q: "blue" }
  });

  assert.deepEqual(calls, [
    { method: "GET", path: "items?page=2", options: {} },
    { method: "GET", path: "items/7", options: { cache: "reload" } },
    { method: "POST", path: "items", body: { name: "Ada" }, options: {} },
    { method: "PUT", path: "items/9", body: { id: 9, name: "Grace" }, options: {} },
    { method: "DELETE", path: "items/11", body: null, options: {} },
    { method: "GET", path: "items/search?q=blue", body: undefined, options: {} }
  ]);
});

test("resource definitions attach reusable actions and registries", async () => {
  const calls = [];
  const transport = createRecordedTransport(calls);
  const resource = createResourceFromDefinition(transport, {
    endpoint: "reports",
    actions: {
      recent: {
        path: "recent",
        method: "GET"
      },
      archive: "archive"
    }
  });
  const registry = createResourceRegistry(transport, {
    users: "users",
    files: {
      endpoint: "files"
    }
  });

  await resource.recent({ team: "core" });
  await resource.archive({ id: 12 });

  assert.equal(resource.endpoint, "reports");
  assert.equal(registry.users.endpoint, "users");
  assert.equal(registry.files.endpoint, "files");
  assert.deepEqual(calls, [
    { method: "GET", path: "reports/recent?team=core", body: undefined, options: {} },
    { method: "POST", path: "reports/archive", body: { id: 12 }, options: {} }
  ]);
});

function createRecordedTransport(calls) {
  return {
    request(path, options = {}) {
      calls.push({
        method: (options.method || "GET").toUpperCase(),
        path,
        body: options.body,
        options: stripRequestOptions(options)
      });
      return Promise.resolve({ ok: true });
    },
    get(path, options = {}) {
      calls.push({ method: "GET", path, options });
      return Promise.resolve({ ok: true });
    },
    post(path, body, options = {}) {
      calls.push({ method: "POST", path, body, options });
      return Promise.resolve({ ok: true });
    },
    put(path, body, options = {}) {
      calls.push({ method: "PUT", path, body, options });
      return Promise.resolve({ ok: true });
    },
    delete(path, body, options = {}) {
      calls.push({ method: "DELETE", path, body, options });
      return Promise.resolve({ ok: true });
    }
  };
}

function stripRequestOptions(options) {
  const { method, body, ...rest } = options;
  return rest;
}
