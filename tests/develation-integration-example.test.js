import test from "node:test";
import assert from "node:assert/strict";

import {
  develationIntegrationExamples,
  normalizedServiceResponse,
  renderedEditForm,
  renderedIntegrationPage,
  renderedResults,
  renderedXmlPayload,
  saveDevelationRecord
} from "../examples/develation-integration.js";

test("develation integration example normalizes service and object payloads", () => {
  assert.equal(normalizedServiceResponse.ok, true);
  assert.equal(normalizedServiceResponse.data.title, "Alpha");
  assert.equal(normalizedServiceResponse.list.length, 2);
  assert.equal(develationIntegrationExamples.eventedRecordSnapshot.lastChangeType, "state:enter");
});

test("develation integration example renders practical helper output", () => {
  assert.match(renderedIntegrationPage, /class="bf-reactor-html bf-rx-page"/);
  assert.match(renderedIntegrationPage, /Rendered parser output/);
  assert.match(renderedResults, /<th>Title<\/th><th>Status<\/th>/);
  assert.match(renderedResults, /<td>Alpha<\/td>/);
  assert.match(renderedEditForm, /<form/);
  assert.match(renderedEditForm, /name="status"/);
  assert.equal(renderedXmlPayload, '<RESOURCE id="1">Alpha</RESOURCE>');
});

test("develation service client example mirrors request and response processors", async () => {
  const response = await saveDevelationRecord({
    title: "Updated"
  });

  assert.equal(response.ok, true);
  assert.equal(response.data.title, "Updated");
  assert.equal(response.data.method, "POST");
  assert.equal(response.data.url, "/resources");
  assert.equal(response.data.accept, "application/json");
});
