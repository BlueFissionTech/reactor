import test from "node:test";
import assert from "node:assert/strict";

import { createBlueFissionApi } from "../src/adapters/bluefission.js";

test("Blue Fission API bootstrap is safe without a browser document", async () => {
  const requests = [];
  const api = createBlueFissionApi({
    apiBaseUrl: "/api",
    fetchImpl: async (url, request) => {
      requests.push({ url, request });
      return new Response(JSON.stringify({ data: { id: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    },
    resources: {
      item: {
        endpoint: "items",
        actions: {
          recent: {
            path: "recent",
            method: "GET"
          },
          archive: "archive"
        }
      }
    }
  });

  const recent = await api.resources.item.recent({ limit: 3 });
  const archived = await api.resources.item.archive({ id: 1 });

  assert.deepEqual(recent.data, { id: 1 });
  assert.equal(requests[0].url, "/api/items/recent?limit=3");
  assert.equal(requests[0].request.method, "GET");
  assert.equal(requests[1].url, "/api/items/archive");
  assert.equal(requests[1].request.method, "POST");
  assert.equal(requests[1].request.headers.get("Content-Type"), "application/json");
  assert.equal(requests[1].request.body, "{\"id\":1}");
  assert.deepEqual(archived.data, { id: 1 });
});
