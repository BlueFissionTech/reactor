import test from "node:test";
import assert from "node:assert/strict";

import { HttpResponse } from "../src/net/http.js";
import { createGateway, createServiceClient } from "../src/services/service.js";

test("gateway processors run in order and may leave the current value unchanged", async () => {
  const calls = [];
  const gateway = createGateway([
    async (value) => {
      calls.push("first");
      return { ...value, first: true };
    },
    async () => {
      calls.push("second");
      return undefined;
    },
    async (value) => {
      calls.push("third");
      return { ...value, third: true };
    }
  ]);

  const result = await gateway.process({ started: true });

  assert.deepEqual(calls, ["first", "second", "third"]);
  assert.deepEqual(result, { started: true, first: true, third: true });
});

test("service client mirrors DevElation request and response processor stages", async () => {
  const sent = [];
  const service = createServiceClient({
    client: {
      async send(request) {
        sent.push(request);
        return new HttpResponse({
          statusCode: 200,
          body: { data: { ok: true } },
          request
        });
      }
    },
    requestProcessors: [
      (request, context) => request
        .withHeader("X-Trace", context.traceId)
        .withQuery({ team: "blue" })
    ],
    responseProcessors: [
      (response, context) => ({
        normalized: response.normalized(),
        request: context.request
      })
    ]
  });

  const result = await service.get("students", {}, { traceId: "abc123" });

  assert.equal(sent[0].method, "GET");
  assert.deepEqual(sent[0].headers, { "X-Trace": "abc123" });
  assert.deepEqual(sent[0].query, { team: "blue" });
  assert.equal(result.request, sent[0]);
  assert.equal(result.normalized.ok, true);
  assert.deepEqual(result.normalized.data, { ok: true });
});
