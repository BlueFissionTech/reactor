# Binding Contracts

Binding contracts describe how a host application connects data, state, events, and lifecycle expectations to Reactor primitives.

They are intentionally small. A contract is not a renderer, route system, or consumer adapter. It is a reusable description of what a frontend surface expects and what Reactor can safely own.

## Purpose

Use binding contracts when a surface needs a stable handoff between:

- resource clients
- signal-backed state
- evented objects
- selector-addressed DOM regions
- module lifecycle hooks
- optional compatibility adapters

This gives teams a shared vocabulary without forcing every screen into the same file layout or product workflow.

## Contract Shape

Create a contract with `createBindingContract(...)`:

```js
const contract = createBindingContract({
  name: "resource-workspace",
  inputs: {
    resource: {
      type: "resource-client",
      required: true
    },
    record: {
      type: "signal-map",
      required: true
    }
  },
  outputs: {
    detailRegion: {
      type: "selector"
    }
  },
  events: {
    save: {
      type: "command"
    }
  },
  lifecycle: {
    start: {
      description: "Load initial state and publish the ready view."
    }
  }
});
```

Contracts are serializable through `describe()` or `toJSON()`.

## Inputs

Inputs are values the host application must provide. Common input types include:

- `resource-client`
- `signal`
- `signal-map`
- `record-set`
- `behavioral-object`
- `selector`
- `service-client`

Inputs should describe the shape Reactor expects, not a specific product model.

## Outputs

Outputs are host-owned destinations or derived values. Common outputs include:

- selector regions
- rendered fragments
- normalized response data
- state snapshots
- command results

Reactor can define the handoff shape. The host application owns the actual layout and product-specific presentation.

## Events And States

Use event names and state names that line up with existing Reactor and DevElation-aligned concepts where possible:

- `Events.READ`
- `Events.SAVED`
- `Events.ERROR`
- `States.LOADING`
- `States.SAVING`
- `States.SYNCED`
- `States.ERROR`

This keeps JavaScript bindings compatible with upstream behavior semantics without turning Reactor into a direct port of another library.

## Lifecycle

Lifecycle entries should describe when a host surface should:

- resolve selectors
- connect signals to DOM bindings
- load initial resource data
- attach event handlers
- release subscriptions
- stop timers or sockets

The lifecycle vocabulary should stay compatible with `createModule(...)`: `setup`, `start`, `stop`, and `destroy`.

## Ownership Boundary

Each contract can describe ownership:

```js
ownership: {
  reactor: [
    "binding descriptor shape",
    "state handoff conventions"
  ],
  application: [
    "selectors",
    "screen layout",
    "product workflow"
  ],
  upstream: [
    "response envelope",
    "behavior and state naming"
  ]
}
```

Reactor owns reusable frontend contracts and optional compatibility adapters. Host applications own layout, route names, domain models, and workflow-specific behavior. Upstream libraries own the backend or primitive semantics that shape Reactor's limits.

## Manifest

Use `createBindingManifest(...)` when a package or application wants to publish several contracts:

```js
const manifest = createBindingManifest([
  resourceWorkspaceContract,
  activityContract
]);

manifest.names();
manifest.get("resource-workspace");
manifest.describe();
```

Manifests make contract lists easy to inspect, test, and export without making the consuming application part of Reactor's public API.

## What Stays Outside Reactor

Reactor binding contracts should not include:

- consumer package names
- local file paths
- route-specific assumptions
- product-specific selectors
- business-domain models
- one-off adapter promises

If one product needs a capability that clearly belongs in Reactor, describe the general frontend contract and let that product implement its own adapter against it.
