# Addon Module Patterns

This note maps the older addon source style used in projects like `control-hub/addons/students/resource/src` into Reactor.

## Source shape reviewed

The main legacy files checked for this mapping were:

- `students.js`
- `dashboard.js`
- `module-students.js`
- `bluefission-api.js`
- `bluefission-crud.js`
- `dashboard-ui/record-set.js`
- `dashboard-ui/portlet-ui.js`

## Migration goals

The older pattern worked, but it mixed too many concerns in each file:

- API resource setup
- custom endpoint actions
- signal-like model fields
- screen swapping
- DataTable row lookup
- template rendering
- portlet controls
- ad hoc panel bootstrapping

Reactor keeps those ideas, but gives each one a clearer surface.

## Mapping

### `bluefission-api.js`

Old shape:

- one global API object
- one `BlueFissionCrud` instance per endpoint
- ad hoc methods such as `student.get_recent_at_risk_student = ...`

Reactor shape:

- `createBlueFissionApi(...)`
- `createBlueFissionApp(...)`
- resource definitions with named `actions`

Example:

```js
const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    student: {
      endpoint: "students",
      actions: {
        recentAtRisk: {
          path: "recent_at_risk",
          method: "GET"
        },
        generate: "generate"
      }
    }
  }
});
```

That replaces monkey-patched methods with a declarative resource contract.

### `bluefission-crud.js`

Old shape:

- `list`, `save`, `add`, `update`, `remove`, `read`, `find`
- raw jQuery AJAX and callback style

Reactor shape:

- `createResource(...)`
- `createResourceFromDefinition(...)`
- `createResourceRegistry(...)`

The resource layer keeps CRUD behavior but returns normalized promises instead of forcing jQuery callbacks.

### `Model`, `Reactor`, and `computed`

Old shape:

- one mutable model object
- one reactive wrapper per field
- one `computed(...)` helper for derived values

Reactor shape:

- `createRecordModel(...)`
- `createBehavioralObject(...)`
- `createSignal(...)`
- `computed(...)`

Use `createRecordModel(...)` for form-oriented CRUD records.
Use `createBehavioralObject(...)` when the model should also behave like an evented object.

### `app.get`, `app.set`, `app.assign`, `app.computed`

Old shape:

- app-level convenience wrappers passed into module files

Reactor shape:

- `createBlueFissionApp(...)` now exposes the same family of helpers directly:
  - `app.get(...)`
  - `app.set(...)`
  - `app.assign(...)`
  - `app.computed(...)`

That keeps migration friction low while still preserving lower-level exports.

### `record-set.js`

Old shape:

- one plain object tracking `records`, `current`, `index`, `page`, and `perpage`

Reactor shape:

- `RecordSet`
- `createRecordSet(...)`

The Reactor version keeps the familiar API while adding:

- event signaling
- explicit fetch hooks
- id-based lookup
- snapshots for UI updates

### `portlet-ui.js`

Old shape:

- collapse and remove behavior coupled to jQuery and `DashboardUI.confirm`

Reactor shape:

- `createPortletController(...)`

This keeps the behavior small and composable:

```js
const portlets = createPortletController({
  confirm: (portlet) => window.confirm(`Close ${portlet.id || "this portlet"}?`)
});
```

### Panels and modules

Old shape:

- `Panels = { dashboard: Dashboard }`
- one global `App` object
- separate panel startup and module startup conventions

Reactor shape:

- `createPanelRegistry(...)`
- `createModule(...)`
- `createCrudPanelModule(...)`
- `createBlueFissionApp(...).activatePanel(...)`

That gives panels and modules one explicit startup path.

## Students-style example

The closest current example is:

- `examples/students-addon.js`

It shows how to combine:

- declarative resource actions
- a record model
- a record set
- jQuery interop
- template swapping
- CRUD module behavior
- panel activation

## Why this is better

The goal is not to erase the older shape. The goal is to preserve what made it productive while removing the hidden coupling:

- network logic no longer depends on jQuery
- custom endpoint actions no longer require direct instance mutation
- record collections are not anonymous globals
- panel startup is explicit
- template rendering stays compatible with the real `text/template` flow

That gives internal addon authors a cleaner default without blocking immediate migration.
