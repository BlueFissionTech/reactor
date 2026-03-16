# Reactor

Reactor is the new home for Blue Fission frontend primitives. It is intended to replace project-local copies of Opus and addon JavaScript with a documented package that works with BlueCore, Opus, DevElation-style responses, and current jQuery-heavy dashboards while moving toward a more framework-agnostic model.

## Goals

- Normalize Blue Fission response shapes in one place.
- Provide a small transport layer for API and CRUD work.
- Offer module lifecycle primitives for dashboard and app screens.
- Support reactive DOM binding without locking the repo into jQuery.
- Keep jQuery interoperability available for immediate adoption in existing projects.

## Current shape

This first pass focuses on the shared foundation:

- `src/core/response.js`: response normalization for Blue Fission and generic JSON payloads
- `src/core/transport.js`: fetch-based HTTP transport and CRUD resource client
- `src/core/module.js`: module lifecycle and plugin hooks
- `src/core/signals.js`: lightweight reactive values inspired by the existing `Reactor`
- `src/dom/binder.js`: DOM binding and interpolation helpers
- `src/adapters/jquery.js`: compatibility helpers for jQuery-first applications
- `src/adapters/bluefission.js`: Blue Fission-oriented app bootstrap and API helpers
- `src/adapters/opus-crud.js`: extracted Opus-style CRUD panel flow for admin modules

## Installation

NPM is the preferred path:

```bash
npm install @bluefission/reactor
```

Direct ESM inclusion is also possible in internal projects:

```html
<script type="module">
  import { createBlueFissionApp } from "./src/index.js";

  const app = createBlueFissionApp({
    apiBaseUrl: "/api"
  });

  window.app = app;
</script>
```

## Example

```js
import {
  createBlueFissionApp,
  createSignal,
  bindText,
  bindValue
} from "@bluefission/reactor";

const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    user: "users",
    addon: "admin/addons"
  }
});

const name = createSignal("Hello");

bindText("[data-role='message']", name);
bindValue("[name='name']", name);

app.resources.user.read(1).then((response) => {
  name.value = response.data.name;
});
```

## Extracted Opus flow

The repo now includes the first concrete migration target from the old Opus modules: an Opus-style CRUD panel adapter. It captures the repeated pattern used by modules like content, entries, and students:

- list screen and edit screen swapping
- add, show, edit, save, and delete actions
- record state with reactive fields
- optional jQuery/DataTables integration through a bridge

See:

- `src/adapters/opus-crud.js`
- `examples/opus-content-module.js`
- `docs/opus-migration.md`

## Why this exists

The current frontend behavior is split across:

- Opus modules in `framework/resource/src/js/modules/scripts`
- app modules in `framework/resource/src/js/modules/app`
- dashboard UI code in `framework/resource/src/js/modules/dashboard-ui`
- project-local implementations such as `hoom-addon/resource/src`

Those areas share the same ideas but duplicate them inconsistently. This repository is the consolidation point.

## Status

The repository now contains the initial package contract and compatibility-oriented primitives. Widget libraries, dashboard shells, code generation helpers, and richer Opus adapters should be layered on top of this foundation in later iterations.
