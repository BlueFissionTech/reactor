# Dashboard Utility Ownership Map

This map keeps legacy dashboard utility extraction explicit. It is not a commitment to re-create every historical helper in Reactor.

Use it to decide whether a behavior belongs in Reactor, in a host application, or in a later adapter issue.

## Ownership Legend

- `reactor-core`: already represented by package primitives.
- `reactor-adapter`: suitable for a focused optional adapter with tests.
- `host-owned`: should stay in the consuming application.
- `deferred`: needs a separate issue before implementation.

## Method Groups

| Legacy behavior group | Current Reactor equivalent | Ownership | Follow-up |
| --- | --- | --- | --- |
| Resource CRUD calls | `createTransport(...)`, `createResource(...)`, `createResourceRegistry(...)` | `reactor-core` | Covered by existing transport/resource tests |
| Record edit state | `createRecordModel(...)`, `createCrudPanelModule(...)` | `reactor-adapter` | Covered by #2 / PR #19 |
| List row lookup and refresh | `createCrudPanelModule(...list)` reload hook | `reactor-adapter` | #17 |
| Dashboard notices | `ui.notice(...)` handoff and `createJQueryNotifier(...)` | `reactor-adapter` | #15 |
| Modal handoff and confirmations | `createJQueryBridge(...).modal(...)` handoff only | `reactor-adapter` | #18 |
| Hash route and panel activation | `createDashboardShell(...)`, `normalizeRoute(...)` | `reactor-core` | Covered by dashboard shell tests |
| Template render and selector swap | `createTemplate(...)`, `TemplateInstance.swap(...)` | `reactor-core` | Covered by template docs; broaden tests separately |
| DOM show/hide/fade/event bridge | `createJQueryBridge(...)` and DOM helpers | `reactor-adapter` | Broaden UI adapter tests separately |
| Browser activity tracking | `createActivityTracker(...)` | `reactor-core` | Broaden browser utility tests separately |
| Socket event handoff | `createSocketClient(...)` | `reactor-core` | Broaden browser utility tests separately |
| Rich text editor setup | None | `host-owned` | Keep provider configuration outside Reactor |
| Permission and workflow policy | None | `host-owned` | Keep authorization and product workflow outside Reactor |
| Route names, selectors, and screen layout | Examples only | `host-owned` | Keep examples neutral |

## Non-Goals

Reactor should not own:

- product routes
- screen-specific selectors
- permission checks
- table column definitions
- modal content
- rich text editor configuration
- plugin initialization that has no reusable adapter contract

## Extraction Rule

Add a Reactor adapter only when the behavior has:

- a reusable package-owned contract
- service-free tests
- neutral examples
- clear host-owned boundaries
- a small API that does not force a single application layout
