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
      student: {
        endpoint: "students",
        actions: {
          atRisk: {
            path: "at_risk",
            method: "GET"
          },
          generate: "generate"
        }
      }
    }
  });

  const atRisk = await api.resources.student.atRisk({ limit: 3 });
  const generated = await api.resources.student.generate({ id: 1 });

  assert.deepEqual(atRisk.data, { id: 1 });
  assert.equal(requests[0].url, "/api/students/at_risk?limit=3");
  assert.equal(requests[0].request.method, "GET");
  assert.equal(requests[1].url, "/api/students/generate");
  assert.equal(requests[1].request.method, "POST");
  assert.equal(requests[1].request.headers.get("Content-Type"), "application/json");
  assert.equal(requests[1].request.body, "{\"id\":1}");
  assert.deepEqual(generated.data, { id: 1 });
});
