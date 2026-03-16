# Opus Migration Notes

## What was extracted

The first extracted legacy pattern is the repeated admin CRUD module flow used in Opus modules such as:

- `module-content.js`
- `module-entries.js`
- `module-students.js`

Those modules all repeat the same structure:

- define a record model with reactive fields
- show a listing view and an edit view
- load one record for show or edit
- save and delete through a CRUD API
- reload a jQuery DataTable
- display notices through a shared UI object

## Reactor replacement

Use:

- `createRecordModel`
- `createCrudPanelModule`
- `createJQueryBridge`
- `createBlueFissionApp`

This keeps the same operational flow while moving the reusable behavior into Reactor.

## Mapping

Legacy patterns map to Reactor like this:

- `new Model` + many `new Reactor(...)` fields -> `createRecordModel(...)`
- repeated screen swap functions -> `createCrudPanelModule(...screens)`
- `app.api.<resource>.read/save/delete` -> `createResource(...)`
- repeated jQuery event binding -> `createJQueryBridge(...)`
- repeated notices and list reloads -> `createCrudPanelModule(...messages/list)`

## Example direction

An old `module-content.js` style module can become:

```js
const model = createRecordModel({
  content_id: 0,
  title: "",
  description: "",
  is_published: 0
});

const contentModule = createCrudPanelModule({
  name: "content",
  resource: app.resources.content,
  model,
  bridge: createJQueryBridge(window.jQuery),
  ui: app.ui,
  screens: {
    list: "#content-listing-screen",
    edit: "#content-edit-screen"
  },
  selectors: {
    homeButton: ".home-btn",
    addButton: "#content-add-btn",
    saveButton: "#content-save-btn",
    deleteButton: "#content-delete-btn",
    showButton: ".show-btn",
    editButton: ".edit-btn"
  },
  list: {
    root: "#dataTable",
    selector: "#dataTable",
    getRecord(trigger) {
      return window.contentTable.row(window.jQuery(trigger).parents("tr")).data();
    }
  }
});
```

## What is not extracted yet

- DataTables configuration
- template rendering helpers
- dashboard navigation shell
- modal-specific flows
- settings sub-panels

Those should be added as separate adapters rather than folded into one monolith.
