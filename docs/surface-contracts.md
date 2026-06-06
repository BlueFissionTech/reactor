# Surface Contracts

Surface contracts describe rich interactive frontend areas without prescribing a renderer, route system, asset pipeline, or host application layout.

They are useful when a host needs a shared vocabulary for media, dialogue, scene, overlay, panel, notification, choice, and command surfaces.

## Purpose

Use surface contracts to describe:

- component responsibilities
- state names and shapes
- binding destinations
- event names
- update rules
- deterministic scripted pulses
- reactive user or runtime pulses
- ownership boundaries

The contract is descriptive. Reactor defines the shape and vocabulary. Host applications own rendering, routes, assets, product models, and workflow-specific behavior.

## Surface Families

Reactor provides common family names through `SurfaceFamilies`:

- `media`
- `dialogue`
- `scene`
- `overlay`
- `panel`
- `notification`
- `choice`
- `command`

These families are intentionally broad. They describe interface responsibilities rather than product-specific screens.

## Contract Shape

Create a surface with `createSurfaceContract(...)`:

```js
const contract = createSurfaceContract({
  name: "guided-rich-surface",
  family: SurfaceFamilies.SCENE,
  components: {
    media: {
      family: SurfaceFamilies.MEDIA,
      responsibility: "Show the current media asset.",
      states: {
        ready: "boolean",
        asset: "string"
      }
    },
    choices: {
      family: SurfaceFamilies.CHOICE,
      responsibility: "Expose available commands.",
      events: ["choose"]
    }
  }
});
```

Contracts are serializable with `describe()` and `toJSON()`.

## Update Rules

Update rules distinguish authored or deterministic updates from reactive updates:

```js
updateRules: {
  authoredStep: {
    source: SurfaceUpdateSources.SCRIPTED,
    trigger: "step.ready",
    deterministic: true,
    lane: "story",
    priority: 10
  },
  userChoice: {
    source: SurfaceUpdateSources.REACTIVE,
    trigger: "choice.selected",
    deterministic: false,
    lane: "interaction",
    priority: 20
  }
}
```

Use scripted updates when the order is authored, replayable, or proof-driven. Use reactive updates when input arrives from a user, runtime event, resource response, or host workflow.

## Pulses

Pulses are small update descriptors:

```js
const pulse = createSurfacePulse({
  name: "show-intro-media",
  surface: "media",
  source: SurfaceUpdateSources.SCRIPTED,
  action: "replace",
  target: "region",
  payload: {
    asset: "intro"
  },
  timing: {
    delay: 0,
    duration: 300,
    lane: "story"
  }
});
```

Reactor does not execute pulses in this layer. The descriptor lets a host or adapter apply the same state and ordering vocabulary consistently.

## Command Results And Review Handoffs

Command-result surfaces should keep command output, review state, diagnostics, and evidence references explicit in state or payload metadata.

Recommended state and payload fields include:

- `status`
- `output_id`
- `waiting`
- `completed`
- `diagnostics`
- `evidence_refs`
- `semantic_meta`
- `reviewState`

Approval and review behavior should stay in host workflow policy. Reactor can describe the surface and event vocabulary, but it should not infer approval state from renderer behavior.

Use `SurfaceFamilies.COMMAND` for command result areas, `SurfaceFamilies.CHOICE` for review choices, and `SurfaceFamilies.PANEL` for evidence or provenance areas.

## Ownership Boundary

Surface contracts should keep this split:

- Reactor owns descriptor shape, family names, state/event conventions, and pulse vocabulary.
- Host applications own rendering, routes, assets, product models, and workflow behavior.
- Upstream libraries own backend, response, behavior, or primitive semantics that shape frontend limits.

## Manifest

Use `createSurfaceManifest(...)` to publish a set of related surface contracts:

```js
const manifest = createSurfaceManifest([
  guidedSurface,
  operationalSurface
]);

manifest.families();
manifest.get("guided-rich-surface");
manifest.describe();
```

## What Stays Outside Reactor

Surface contracts should not include:

- consumer package names
- local paths
- route-specific assumptions
- product-specific assets
- domain models
- renderer-specific lifecycle behavior

If a host needs a capability that clearly belongs in Reactor, express it as a reusable surface family, update rule, pulse field, or binding convention.
