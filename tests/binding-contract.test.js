import test from "node:test";
import assert from "node:assert/strict";

import { createBindingContract, createBindingManifest } from "../src/core/binding-contract.js";

test("binding contracts normalize inputs, outputs, lifecycle, and ownership", () => {
  const contract = createBindingContract({
    name: "resource-workspace",
    inputs: {
      resource: {
        type: "resource",
        required: true,
        description: "CRUD-capable resource client"
      },
      state: "signal-map"
    },
    outputs: [
      {
        name: "detailRegion",
        type: "selector",
        description: "Region updated after read"
      }
    ],
    events: ["read", { name: "save", type: "command" }],
    states: [{ name: "busy", type: "boolean" }],
    lifecycle: {
      start: {
        description: "Bind selectors and fetch initial state"
      }
    },
    ownership: {
      reactor: ["binding descriptors", "state handoff"],
      application: "selectors and product workflow",
      upstream: ["response envelope"]
    }
  });

  assert.equal(contract.name, "resource-workspace");
  assert.equal(contract.input("resource").required, true);
  assert.equal(contract.input("state").type, "signal-map");
  assert.equal(contract.output("detailRegion").type, "selector");
  assert.equal(contract.event("save").type, "command");
  assert.equal(contract.state("busy").type, "boolean");
  assert.equal(contract.lifecycleStep("start").description, "Bind selectors and fetch initial state");
  assert.deepEqual(contract.ownership.application, ["selectors and product workflow"]);
});

test("binding contract descriptions are immutable snapshots", () => {
  const contract = createBindingContract({
    name: "surface",
    inputs: ["payload"]
  });

  const first = contract.describe();
  first.inputs[0].name = "changed";

  assert.equal(contract.input("payload").name, "payload");
  assert.equal(contract.input("changed"), null);
});

test("binding contracts tolerate empty definitions", () => {
  const contract = createBindingContract(null);

  assert.equal(contract.name, "binding");
  assert.deepEqual(contract.ownership, {
    reactor: [],
    application: [],
    upstream: []
  });
  assert.deepEqual(contract.inputs, []);
});

test("binding manifests expose lookup and serializable descriptions", () => {
  const manifest = createBindingManifest([
    { name: "summary", inputs: ["payload"] },
    createBindingContract({ name: "detail", outputs: ["region"] })
  ]);

  assert.deepEqual(manifest.names(), ["summary", "detail"]);
  assert.equal(manifest.get("detail").output("region").name, "region");
  assert.equal(manifest.get("missing"), null);
  assert.deepEqual(manifest.toJSON().contracts.map((contract) => contract.name), ["summary", "detail"]);
});
