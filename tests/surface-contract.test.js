import test from "node:test";
import assert from "node:assert/strict";

import {
  SurfaceFamilies,
  SurfaceUpdateSources,
  createSurfaceContract,
  createSurfaceManifest,
  createSurfacePulse
} from "../src/ui/surface-contract.js";

test("surface contracts normalize components, states, rules, pulses, and ownership", () => {
  const contract = createSurfaceContract({
    name: "guided-surface",
    family: SurfaceFamilies.SCENE,
    components: {
      media: {
        family: SurfaceFamilies.MEDIA,
        responsibility: "Render the current visual state.",
        states: {
          ready: "boolean"
        },
        bindings: ["mediaRegion"]
      }
    },
    states: {
      activeStep: "string"
    },
    events: ["advance"],
    updateRules: {
      scriptedStep: {
        source: SurfaceUpdateSources.SCRIPTED,
        trigger: "step.ready",
        deterministic: true,
        lane: "story"
      }
    },
    pulses: [
      {
        name: "show-media",
        surface: "media",
        source: SurfaceUpdateSources.SCRIPTED,
        action: "replace",
        target: "mediaRegion",
        payload: {
          asset: "intro"
        },
        timing: {
          delay: 120,
          duration: 300,
          lane: "story"
        }
      }
    ],
    ownership: {
      reactor: ["surface contract shape"],
      host: "rendering and assets",
      upstream: ["response and event semantics"]
    }
  });

  assert.equal(contract.family, SurfaceFamilies.SCENE);
  assert.equal(contract.component("media").states[0].name, "ready");
  assert.equal(contract.state("activeStep").type, "string");
  assert.equal(contract.event("advance").name, "advance");
  assert.equal(contract.updateRule("scriptedStep").deterministic, true);
  assert.equal(contract.pulse("show-media").timing.lane, "story");
  assert.deepEqual(contract.ownership.host, ["rendering and assets"]);
});

test("surface manifests expose family summaries and serializable contracts", () => {
  const manifest = createSurfaceManifest([
    { name: "dialogue", family: SurfaceFamilies.DIALOGUE },
    createSurfaceContract({ name: "overlay", family: SurfaceFamilies.OVERLAY })
  ]);

  assert.deepEqual(manifest.families(), [SurfaceFamilies.DIALOGUE, SurfaceFamilies.OVERLAY]);
  assert.equal(manifest.get("overlay").family, SurfaceFamilies.OVERLAY);
  assert.equal(manifest.get("missing"), null);
  assert.deepEqual(manifest.toJSON().surfaces.map((surface) => surface.name), ["dialogue", "overlay"]);
});

test("surface pulses default deterministic behavior by source", () => {
  const scripted = createSurfacePulse({
    source: SurfaceUpdateSources.SCRIPTED,
    action: "advance"
  });
  const reactive = createSurfacePulse({
    source: SurfaceUpdateSources.REACTIVE,
    action: "choose"
  });

  assert.equal(scripted.deterministic, true);
  assert.equal(reactive.deterministic, false);
  assert.deepEqual(scripted.timing, {
    delay: 0,
    duration: 0,
    lane: "default"
  });
});

test("surface contracts preserve explicit command result metadata", () => {
  const contract = createSurfaceContract({
    name: "command-result-handoff",
    components: {
      result: {
        family: SurfaceFamilies.COMMAND,
        states: {
          outputId: "string",
          reviewState: "string"
        }
      }
    },
    pulses: [
      {
        name: "publish-result",
        source: SurfaceUpdateSources.SYSTEM,
        payload: {
          output_id: "output-1",
          diagnostics: [],
          evidence_refs: ["evidence-1"],
          semantic_meta: {
            confidence: 0.88
          }
        }
      }
    ]
  });

  assert.equal(contract.component("result").states[0].name, "outputId");
  assert.deepEqual(contract.pulse("publish-result").payload.evidence_refs, ["evidence-1"]);
  assert.equal(contract.pulse("publish-result").payload.semantic_meta.confidence, 0.88);
});

test("surface descriptions are immutable snapshots", () => {
  const contract = createSurfaceContract({
    name: "notification",
    pulses: [
      {
        name: "toast",
        payload: {
          message: "Saved"
        }
      }
    ]
  });

  const snapshot = contract.describe();
  snapshot.pulses[0].payload.message = "Changed";

  assert.equal(contract.pulse("toast").payload.message, "Saved");
});
