# Reactor

Reactor is the shared frontend foundation for Blue Fission applications and compatible browser projects.

It exists to replace copied, project-local JavaScript with a package that has a clear API, a stable mental model, and a practical migration path from current Blue Fission frontend code. Today that means supporting legacy jQuery-heavy screens while moving reusable behavior into framework-agnostic primitives.

## What Reactor is

Reactor is a small frontend library for:

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
   Primitive helpers, response normalization, transport, state, and module lifecycle.
2. Browser binding
   Small DOM helpers for simple reactive behavior without introducing a full renderer.
3. Adapters
   Compatibility layers for Blue Fission conventions, jQuery-heavy screens, and extracted legacy patterns.

That separation matters. It lets us keep legacy integration support without hard-coding legacy assumptions into the permanent center of the library.

## Package surface

The current public surface is:

- `src/core/response.js`
  `normalizeResponse`, `BlueFissionResponse`
- `src/core/primitives.js`
  `Value`, `Arr`, `Obj`, `Str`, `Num`, `Primitive`, `toList`, `getPath`, `setPath`, `joinClassNames`, `toNumber`, and related value helpers
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
  `escapeHtml`, `renderHtml`, `renderHtmlPage`, `HtmlThemeClasses`, `renderElement`, `renderTable`, `renderForm`, `renderFormField`, `renderXml`, and small HTML utility helpers
- `src/adapters/jquery.js`
  `createJQueryBridge`, `createJQueryNotifier`
- `src/adapters/bluefission.js`
  `createBlueFissionApi`, `createBlueFissionApp`
- `src/adapters/opus-crud.js`
  `createRecordModel`, `createCrudPanelModule`
- `src/browser/activity.js`
  `createActivityTracker`
- `src/browser/socket.js`
  `SocketStates`, `createSocketClient`

## Quick start

The package manifest is fixed at `0.1.0`. Once that version is available from the configured npm registry, consume it with an exact constraint:

```bash
npm install --save-exact @bluefission/reactor@0.1.0
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

- `examples/primitives.js`
- `examples/resource-workspace.js`
- `docs/primitives.md`
- `docs/module-composition.md`
- `docs/develation-alignment.md`
- `docs/develation-integration.md`

## Primitive Helpers

Reactor exposes first-class primitive helpers for JavaScript-side value, list, object, string, and number normalization:

```js
import { Obj, Arr, Num, Str } from "@bluefission/reactor";

const query = {
  page: Num.toInteger(input.page, 1, { min: 1 }),
  tags: Arr.toList(input.tags, { split: true }),
  owner: Obj.getPath(input, "record.owner.name", "Unknown"),
  className: Str.joinClassNames("resource-row", input.active && "is-active")
};
```

These helpers are aligned with DevElation's upstream primitive vocabulary without becoming a browser-side clone of the PHP classes. The goal is consistent input normalization and mutation-free object access across Reactor modules.

## HTML Helper Compatibility

The HTML helper group is intentionally small, but it now represents the reusable concepts from the upstream HTML utilities:

- text formatting, href/base href normalization, images, files, pagination, result tables, lists, and bar graphs
- form open/close, fields, dropdowns, date splitting/joining, and validation metadata
- table rendering from row data
- template/runtime output normalization through `renderHtml(...)`
- XML-like node rebuilding through `renderXml(...)`

`renderHtml(...)` accepts rendered strings as-is so output from parsing and runtime readers, including Vibrato `Reader::output()`, can be passed directly. Structured payloads can also use `html`, `output`, `rendered`, `renderedOutput`, `rendered_output`, `markdown`, `text`, `records`, `rows`, `fields`, `items`, `nodes`, `fragments`, `blocks`, or `children`.

For text safety, use `{ text: value }`, table rows, and form field values; those are escaped by default. Use `{ html: value }` only when the caller owns the trust boundary.

For a consistent optional baseline stylesheet, import `@bluefission/reactor/html.css` and wrap generated fragments with `renderHtmlPage(...)` or a root element using `class="bf-reactor-html"`. The stylesheet is intentionally scoped to that root and `bf-rx-*` helper classes, so it can coexist with app, framework, or platform CSS without acting as a global reset.

```js
import "@bluefission/reactor/html.css";
import { renderHtmlPage, renderResults } from "@bluefission/reactor";

const page = renderHtmlPage(renderResults(records), {
  title: "Resource index",
  density: "compact"
});
```

Relevant files:

- `examples/html-output-contracts.js`
- `examples/develation-integration.js`
- `src/html/theme.css`
- `docs/api-reference.md`
- `docs/develation-alignment.md`
- `docs/develation-integration.md`

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
- exact version constraints are preferred for production adoption
- backend compatibility matters more than frontend fashion
- migration is favored over rewrite theater

This is a platform library. Its value is not novelty. Its value is reducing drift across projects while giving us a cleaner path forward.

Reactor is a public MIT-licensed companion to DevElation for JavaScript and browser-facing concerns.

## License

Reactor is available under the MIT License. See `LICENSE`.

## Document map

- `README.md`
  project overview and usage entry point
- `docs/getting-started.md`
  first practical steps and composition patterns
- `docs/socket-lifecycle.md`
  authenticated bootstrap, reconnect, heartbeat, queue, ordering, and teardown contracts
- `docs/releasing.md`
  public npm publication, trusted publishing, provenance, and versioning workflow
- `docs/api-reference.md`
  current public API summary
- `docs/module-composition.md`
  general composition guidance for resources, records, panels, and optional compatibility adapters
- `docs/primitives.md`
  first-class value, list, object, string, and number helper contracts
- `docs/binding-contracts.md`
  reusable frontend binding contract shape and ownership boundaries
- `docs/surface-contracts.md`
  reusable rich-surface component, state, event, and pulse contract shape
- `docs/dialog-flows.md`
  modal and confirmation request/result contracts
- `docs/table-list-adapters.md`
  table/list query, row lookup, refresh, loading, and selection contracts
- `docs/notification-adapters.md`
  normalized notification payload and dispatch conventions
- `docs/develation-alignment.md`
  how Reactor aligns with DevElation service, net, html, and object patterns
- `docs/develation-integration.md`
  practical DevElation service, parser, HTML, XML, and object integration examples
- `docs/legacy-script-coverage.md`
  mapping from the original `scripts` utilities to Reactor equivalents
- `docs/dashboard-ui-interop.md`
  status of legacy `dashboard-ui` features and how they relate to jQuery
- `docs/dashboard-utility-map.md`
  method-level ownership map for legacy dashboard utility extraction
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
- first-class primitive helper exports for consistent normalization
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
