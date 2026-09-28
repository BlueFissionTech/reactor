# Getting Started With Reactor

## Who this is for

This guide is for developers who want to use Reactor in a Blue Fission application, compatible browser project, dashboard, or reusable module.

## Start with the right expectation

Reactor is a foundation library, not a finished UI system.

Use it when you want to standardize:

- response handling
- API access
- service-style request and response pipelines
- resource CRUD logic
- lightweight state
- evented object behavior
- module startup behavior
- legacy jQuery integration

Do not expect it to replace every existing dashboard behavior on day one.

## The shortest path

1. Create an app with `createBlueFissionApp`.
2. Register the resources your screen needs.
3. Use signals for local state.
4. Bind state to the DOM with `bindText` or `bindValue`.
5. Use primitive helpers when normalizing input values, lists, object paths, class names, and query numbers.
6. If you are migrating a list/edit admin screen, consider `createRecordModel` and `createCrudPanelModule`.
7. If you need a composed module surface, use action-aware resources, `RecordSet`, panel registration, and the app-level `get` / `set` / `assign` helpers.
8. If you are migrating older low-level script utilities, use the framework, template, activity, and socket helpers in Reactor instead of copying project-local files.

## Basic app setup

```js
import {
  createBlueFissionApp,
  createSignal,
  bindText
} from "@bluefission/reactor";

const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    item: "items",
    user: "admin/users"
  }
});

const heading = createSignal("Dashboard");
bindText("[data-heading]", heading);

window.app = app;
```

## Calling a resource

```js
app.resources.user.read(1).then((response) => {
  if (!response.ok) {
    console.error(response.errors);
    return;
  }

  console.log(response.data);
});
```

## Building local state

```js
import { createSignal, computed } from "@bluefission/reactor";

const total = createSignal(10);
const active = createSignal(8);

const inactive = computed(() => total.value - active.value, [total, active]);
```

## Normalizing Primitive Inputs

```js
import { Arr, Num, Obj, Str } from "@bluefission/reactor";

const query = {
  page: Num.toInteger(input.page, 1, { min: 1 }),
  tags: Arr.toList(input.tags, { split: true }),
  owner: Obj.getPath(input, "record.owner.name", "Unknown"),
  className: Str.joinClassNames("resource-row", input.active && "is-active")
};
```

Read:

- `docs/primitives.md`
- `examples/primitives.js`

## Composing A Resource Workspace

A common resource workspace usually needs:

- one global app object
- one API object with custom resource actions
- one form model
- one list-level record set
- one panel map

Reactor supports that shape without assuming a host application file layout:

```js
import {
  createBlueFissionApp,
  createRecordModel,
  createRecordSet
} from "@bluefission/reactor";

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
    }
  }
});

const item = createRecordModel({
  id: 0,
  title: "",
  owner: "",
  status: ""
});

const items = createRecordSet([], {
  idKey: "id",
  fetcher: async () => {
    const response = await app.resources.item.list();
    return response.list;
  }
});

app.assign("title", item.title);
app.set("[data-field='title']", item.title, "value");
```

Read:

- `docs/module-composition.md`
- `examples/resource-workspace.js`
- `docs/develation-alignment.md`

## Migrating A CRUD Panel

Use the CRUD panel adapter when the existing screen has the familiar pattern:

- a DataTable-backed list
- an edit form screen
- add and save buttons
- a delete action
- repeated read and update logic around one API resource

```js
import {
  createCrudPanelModule,
  createJQueryBridge,
  createRecordModel
} from "@bluefission/reactor";

const model = createRecordModel({
  id: 0,
  title: "",
  description: "",
  status: ""
});

const module = createCrudPanelModule({
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

## Recommended way to read the docs

1. Read `README.md` for intent and positioning.
2. Read `docs/api-reference.md` to see the actual exported API.
3. Read `docs/module-composition.md` if you are composing resources, records, panels, and bindings.
4. Read `docs/legacy-crud-migration.md` if you are replacing legacy CRUD-oriented module code.
5. Read `ARCHITECTURE.md` if you are making library-level design decisions.
