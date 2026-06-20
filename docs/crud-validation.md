# CRUD Adapter Validation

Issue #2 validates that Reactor can carry a representative CRUD-oriented module flow without copying host application code into the package.

## Validated Flow

The validated flow is intentionally neutral:

- a resource-backed record editor
- list and edit surfaces
- add, edit, save, delete, and home actions
- response-driven model updates
- list refresh hooks
- notification handoff
- lifecycle cleanup for registered event handlers

The executable coverage lives in `tests/opus-crud.test.js`. It uses plain test doubles for the resource, bridge, and UI collaborators so the contract stays service-free and portable.

## Reactor-Owned Contract

Reactor owns the reusable flow shape:

- `createRecordModel(...)` for signal-backed record state
- `createCrudPanelModule(...)` for the conventional list/edit/save/delete lifecycle
- bridge-level event registration and cleanup expectations
- optional list refresh handoff
- optional notice handoff
- hooks around read, save, delete, start, and ready events

Host applications own their routes, selectors, layouts, permission checks, table configuration, modal content, domain fields, and workflow policy.

## Gaps To Keep Separate

The validation confirms that the current adapter is useful, but it should not grow into a monolithic dashboard runtime. These remain separate reusable capability slices:

- table/list integration beyond a reload hook: #17
- modal and confirmation flow helpers: #18
- notification adapters beyond a generic `ui.notice(...)` handoff: #15
- a method-level dashboard interop matrix for legacy utility behavior: #16

Each follow-up should be tracked as a general Reactor issue with tests and neutral examples before implementation.
