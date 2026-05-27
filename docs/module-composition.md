# Module Composition

This note describes how to compose Reactor primitives for internal modules without assuming a specific downstream product layout.

## Intent

Reactor should provide reusable frontend contracts, not prescribe where an application stores files or how a downstream platform names screens. Use these pieces as opt-in building blocks:

- `createBlueFissionApp(...)` for shared API, module, panel, and binding access
- action-aware resources for endpoint-specific commands
- `createRecordModel(...)` for form-oriented record state
- `createRecordSet(...)` for list state
- `createPanelRegistry(...)` for named surface activation
- `createCrudPanelModule(...)` when a screen has a conventional list/edit/save/delete flow
- `createJQueryBridge(...)` only when the host screen still depends on jQuery plugins or delegated events

## Resource Setup

Define resources by capability rather than by downstream file or module names:

```js
const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    item: {
      endpoint: "items",
      actions: {
        recent: {
          path: "recent",
          method: "GET"
        },
        archive: "archive"
      }
    },
    setting: "settings"
  }
});
```

This keeps custom endpoint actions declarative and avoids mutating resource instances at runtime.

## State And Binding

Use a record model for editable state and bind it to selectors owned by the host application:

```js
const item = createRecordModel({
  id: 0,
  title: "",
  status: ""
});

app.assign("title", item.title);
app.set("[data-field='title']", item.title, "value");
```

Selectors in examples use `data-*` attributes because they are portable across dashboards, server-rendered screens, and progressive migrations.

## Lists And Panels

Use `RecordSet` for list state and `PanelRegistry` for named UI surfaces:

```js
const items = app.recordSet([], {
  idKey: "id",
  fetcher: async () => {
    const response = await app.resources.item.list();
    return response.list;
  }
});

app.panels.register("workspace", {
  async start() {
    await items.fetch();
  }
});
```

The host application decides how panels map to routes, tabs, menus, or server-rendered regions.

## CRUD Panels

`createCrudPanelModule(...)` is useful when an existing screen already has a list/edit/save/delete shape. Treat it as one optional adapter, not as the required way to build Reactor modules.

```js
const module = createCrudPanelModule({
  name: "resource-workspace",
  resource: app.resources.item,
  model: item,
  bridge: createJQueryBridge(window.jQuery),
  screens: {
    list: "[data-screen='list']",
    edit: "[data-screen='edit']"
  },
  selectors: {
    addButton: "[data-action='add']",
    saveButton: "[data-action='save']",
    deleteButton: "[data-action='delete']",
    editButton: "[data-action='edit']"
  }
});
```

If a host app does not use jQuery, call the lower-level resource, signal, DOM binding, and module APIs directly instead.

## Boundaries

Reactor owns reusable client-side contracts:

- response normalization
- request and response pipelines
- state and event primitives
- selector-based binding
- optional compatibility adapters

Downstream applications own:

- file layout
- route names
- screen naming
- project-specific selectors
- domain models
- product-specific workflow decisions

Keeping that boundary clear is what lets Reactor remain useful across Blue Fission projects without becoming a copy of any one downstream app.
