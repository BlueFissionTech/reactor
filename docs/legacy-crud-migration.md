# Legacy CRUD Migration Notes

## What was extracted

The first extracted legacy pattern is the repeated admin CRUD module flow used across internal dashboards and admin screens.

Those modules often repeat the same structure:

- define a record model with reactive fields
- show a listing view and an edit view
- load one record for show or edit
- save and delete through a CRUD API
- reload a jQuery DataTable
- display notices through a shared UI object

The related `scripts` directory also carried lower-level utilities that were part of the same original ecosystem:

- `framework.js`
- `template.js`
- `activity.js`
- `websocket.js`

Those are now part of Reactor's documented scope instead of being left outside the package boundary.

## Reactor replacement

Use:

- `createRecordModel`
- `createCrudPanelModule`
- `createRecordSet`
- `createPanelRegistry`
- `createJQueryBridge`
- `createBlueFissionApp`

This keeps the same operational flow while moving reusable behavior into Reactor. It is a migration aid, not a required project layout.

## Mapping

Legacy patterns can map to Reactor like this:

- `new Model` + many `new Reactor(...)` fields -> `createRecordModel(...)`
- repeated screen swap functions -> `createCrudPanelModule(...screens)`
- `app.api.<resource>.read/save/delete` -> `createResource(...)`
- `app.api.<resource>.<custom_action>` -> action-aware resource definitions on `createBlueFissionApp(...)`
- repeated jQuery event binding -> `createJQueryBridge(...)`
- repeated notices and list reloads -> `createCrudPanelModule(...messages/list)`
- `dashboard-ui/record-set.js` -> `createRecordSet(...)`
- `dashboard-ui/portlet-ui.js` -> `createPortletController(...)`

## Example Direction

A conventional resource module can become:

```js
const model = createRecordModel({
  id: 0,
  title: "",
  description: "",
  status: ""
});

const resourceModule = createCrudPanelModule({
  name: "resource-workspace",
  resource: app.resources.item,
  model,
  bridge: createJQueryBridge(window.jQuery),
  ui: app.ui,
  screens: {
    list: "[data-screen='list']",
    edit: "[data-screen='edit']"
  },
  selectors: {
    homeButton: "[data-action='home']",
    addButton: "[data-action='add']",
    saveButton: "[data-action='save']",
    deleteButton: "[data-action='delete']",
    showButton: "[data-action='show']",
    editButton: "[data-action='edit']"
  },
  list: {
    root: "[data-resource-list]",
    selector: "[data-resource-list]",
    getRecord(trigger) {
      return window.resourceTable.row(window.jQuery(trigger).parents("tr")).data();
    }
  }
});
```

## What is not extracted yet

- DataTables configuration
- chart bootstrapping
- dashboard navigation shell
- most of the historical `dashboard-ui` feature surface
- modal-specific flows
- settings sub-panels

Those should be added as separate adapters rather than folded into one monolith.

## `dashboard-ui` status

The old `dashboard-ui` module is broader than the CRUD panel pattern. It contains:

- notices and dialogs
- menu and hash-based navigation
- tab and area management
- AJAX-oriented session and timeout behavior
- direct DOM and plugin manipulation

Reactor currently documents and exposes only the parts that fit the current adapter boundary:

- jQuery event binding through `createJQueryBridge`
- basic show/hide and fade swapping through `createJQueryBridge`
- modal handoff through `createJQueryBridge`
- DataTable reload support through `createJQueryBridge`
- CRUD panel extraction through `createCrudPanelModule`
- legacy-compatible DOM helpers through `src/dom/framework.js`
- selector-based template rendering through `src/dom/template.js`
- activity tracking through `src/browser/activity.js`
- socket wiring through `src/browser/socket.js`

The rest of `dashboard-ui` should be treated as pending extraction work, not as already-modernized behavior.
