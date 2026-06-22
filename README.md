# Reactor

Reactor is the shared frontend foundation for Blue Fission internal products.

It exists to replace copied, project-local JavaScript with a package that has a clear API, a stable mental model, and a practical migration path from current Blue Fission frontend code. Today that means supporting legacy jQuery-heavy screens while moving reusable behavior into framework-agnostic primitives.

## What Reactor is

Reactor is a small internal library for:

- normalizing Blue Fission response payloads
- calling backend APIs with a reusable transport and CRUD layer
- expressing request and response flows with DevElation-style service objects
- managing module lifecycle for admin and dashboard screens
- modeling evented state and record collections without locking into one framework
- binding lightweight reactive state to the DOM
- rehoming legacy helpers such as templates, record sets, panels, and portlets
- bridging current jQuery-first applications into a more structured architecture

## What Reactor is not

Reactor is not trying to be:

- a full UI framework
- a complete replacement for every current dashboard widget
- a forced rewrite away from jQuery
- a compiled frontend runtime with heavy build requirements

The point is to centralize the stable patterns first, then modernize the rest from a safer base.

## Why this repository exists

Right now, Blue Fission frontend behavior is split across several places:

- reusable utility code in existing internal frontend modules
- app-level modules in `framework/resource/src/js/modules/app`
- dashboard behavior in `framework/resource/src/js/modules/dashboard-ui`
- project-specific copies and forks

Those codebases share the same ideas:

- CRUD API wrappers
- response parsing
- reactive record state
- dashboard module bootstrapping
- jQuery event wiring
- screen swapping and notices

They just do it inconsistently. Reactor is the consolidation layer for those ideas.

## Current documentation quality

At the moment, Reactor is reasonably documented for architecture and intent, but still early in operational guidance.

It already has:

- a library-level overview in this file
- scope and acceptance criteria in `SPEC.md`
- a system view in `ARCHITECTURE.md`
- a roadmap in `ROADMAP.md`
- migration notes for legacy module composition

It was missing:

- a better explanation of how the pieces fit together
- a clear quick-start path
- a public API reference
- a stronger voice about what the library is trying to become

This README and the supporting docs are meant to close that gap.

## The Reactor mental model

Reactor is organized around three layers:

1. Core primitives
   Response normalization, transport, state, and module lifecycle.
2. Browser binding
   Small DOM helpers for simple reactive behavior without introducing a full renderer.
3. Adapters
   Compatibility layers for Blue Fission conventions, jQuery-heavy screens, and extracted legacy patterns.

That separation matters. It lets us keep legacy integration support without hard-coding legacy assumptions into the permanent center of the library.

## Package surface

The current public surface is:

- `src/core/response.js`
  `normalizeResponse`, `BlueFissionResponse`
- `src/core/transport.js`
  `createTransport`, `createResource`, `createResourceFromDefinition`, `createResourceRegistry`
- `src/core/signals.js`
  `Signal`, `createSignal`, `computed`
- `src/core/module.js`
  `createModule`, `createModuleManager`
- `src/core/binding-contract.js`
  `createBindingContract`, `createBindingManifest`
- `src/core/behavior.js`
  `Events`, `States`, `BehavioralObject`, `createBehavioralObject`
- `src/dom/binder.js`
  `select`, `selectAll`, `bindText`, `bindValue`, `interpolate`, `on`
- `src/dom/framework.js`
  legacy-compatible `El`, `get`, `set`, `assign`, `create`
- `src/dom/template.js`
  lightweight selector-based template rendering
- `src/net/http.js`
  `HttpRequest`, `HttpResponse`, `createHttpClient`
- `src/services/service.js`
  `createGateway`, `createServiceClient`
- `src/data/record-set.js`
  `RecordSet`, `createRecordSet`
- `src/ui/panels.js`
  `createPanelRegistry`
- `src/ui/dashboard-shell.js`
  `createDashboardShell`, `normalizeRoute`
- `src/ui/forms.js`
  `FormStatus`, `createFormController`, `serializeFormInput`, `normalizeFormErrors`
- `src/ui/surface-contract.js`
  `SurfaceFamilies`, `SurfaceUpdateSources`, `createSurfaceContract`, `createSurfaceManifest`, `createSurfacePulse`
- `src/ui/portlet.js`
  `createPortletController`
- `src/html/helpers.js`
  `escapeHtml`, `formatContent`, `renderTable`, `renderFormField`
- `src/adapters/jquery.js`
  `createJQueryBridge`, `createJQueryNotifier`
- `src/adapters/bluefission.js`
  `createBlueFissionApi`, `createBlueFissionApp`
- `src/adapters/opus-crud.js`
  `createRecordModel`, `createCrudPanelModule`
- `src/browser/activity.js`
  `createActivityTracker`
- `src/browser/socket.js`
  `createSocketClient`

## Quick start

NPM is the preferred consumption path:

```bash
npm install @bluefission/reactor
```

Then build an app with explicit resources and state:

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
    report: "reports"
  }
});

const message = createSignal("Loading...");

bindText("[data-role='message']", message);
bindValue("[name='message']", message);

app.resources.user.read(1).then((response) => {
  message.value = response.data.realname;
});
```

For direct browser usage inside internal repos, ESM imports also work:

```html
<script type="module">
  import { createBlueFissionApp } from "./src/index.js";

  const app = createBlueFissionApp({
    apiBaseUrl: "/api"
  });

  window.app = app;
</script>
```

## Extracted CRUD Pattern

One concrete compatibility adapter in Reactor is a repeated CRUD admin panel flow.

That adapter captures the recurring shape used by many internal screens:

- a reactive record model
- listing and edit screens
- read, save, and delete actions
- jQuery event handling through a bridge
- optional DataTables reload behavior
- shared success and error notices

Relevant files:

- `src/adapters/opus-crud.js`
- `examples/crud-panel-module.js`
- `docs/opus-migration.md`

## General Module Composition

Reactor supports a general module composition pattern through:

- action-aware resource definitions on `createBlueFissionApi` and `createBlueFissionApp`
- legacy-style `app.get`, `app.set`, `app.assign`, and `app.computed` helpers
- `RecordSet` for list-oriented state
- `createPanelRegistry` for panel bootstrapping
- `createPortletController` for portlet collapse and removal behavior
- `Template` for selector-addressed render-and-swap flows

Relevant files:

- `examples/resource-workspace.js`
- `docs/module-composition.md`
- `docs/develation-alignment.md`

## Legacy script coverage

I also checked older shared script patterns and pulled reusable concepts into Reactor:

- `framework.js`
  now represented by `src/dom/framework.js`
- `template.js`
  now represented by `src/dom/template.js`
- `activity.js`
  now represented by `src/browser/activity.js`
- `websocket.js`
  now represented by `src/browser/socket.js`

These are compatibility-minded rehomes, not fragile line-for-line copies.

## Design stance

Reactor is deliberately pragmatic:

- jQuery support stays available because current products need it
- jQuery is treated as an adapter, not the permanent core
- npm installation is preferred, but direct inclusion remains possible
- backend compatibility matters more than frontend fashion
- migration is favored over rewrite theater

This is an internal platform library. Its value is not novelty. Its value is reducing drift across projects while giving us a cleaner path forward.

## Document map

- `README.md`
  project overview and usage entry point
- `docs/getting-started.md`
  first practical steps and composition patterns
- `docs/api-reference.md`
  current public API summary
- `docs/module-composition.md`
  general composition guidance for resources, records, panels, and optional compatibility adapters
- `docs/binding-contracts.md`
  reusable frontend binding contract shape and ownership boundaries
- `docs/surface-contracts.md`
  reusable rich-surface component, state, event, and pulse contract shape
- `docs/dialog-flows.md`
  modal and confirmation request/result contracts
- `docs/develation-alignment.md`
  how Reactor aligns with DevElation service, net, html, and object patterns
- `docs/legacy-script-coverage.md`
  mapping from the original `scripts` utilities to Reactor equivalents
- `docs/dashboard-ui-interop.md`
  status of legacy `dashboard-ui` features and how they relate to jQuery
- `docs/opus-migration.md`
  compatibility notes for older CRUD-oriented module patterns
- `docs/crud-validation.md`
  validation notes for the extracted CRUD adapter and its remaining general gaps
- `SPEC.md`
  product scope, users, and acceptance criteria
- `ARCHITECTURE.md`
  structural and layering decisions
- `ROADMAP.md`
  near-term and long-term direction

## Current status

Reactor is in its foundation phase.

It now has:

- a coherent package structure
- a documented architectural direction
- a Blue Fission-oriented transport and app bootstrap layer
- a DevElation-aligned request, response, and gateway layer
- evented object and record-set primitives for legacy dashboard migrations
- a lightweight signal and DOM binding model
- an extracted CRUD panel adapter
- dashboard shell, form helper, surface contract, and CRUD adapter coverage
- baseline automated tests for response normalization, service gateways, evented objects, and Blue Fission API bootstrap

It still needs:

- broader automated coverage for DOM helpers, templates, record sets, and UI adapters
- reusable table, modal, and notification adapter slices
- method-level dashboard interop mapping for the remaining legacy utility surface

Those items are intentionally tracked as follow-up work rather than hidden as vague future intent.
