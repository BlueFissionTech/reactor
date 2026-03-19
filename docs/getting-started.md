# Getting Started With Reactor

## Who this is for

This guide is for Blue Fission developers who want to start using Reactor inside an internal app, dashboard, or extracted Opus module.

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
5. If you are migrating old Opus admin modules, use `createRecordModel` and `createCrudPanelModule`.
6. If you are migrating older addon modules, use action-aware resources, `RecordSet`, panel registration, and the app-level `get` / `set` / `assign` helpers.
7. If you are migrating older low-level script utilities, use the framework, template, activity, and socket helpers in Reactor instead of copying project-local files.

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
    content: "admin/content",
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

## Building a students-style addon

The older addon pattern usually had:

- one global app object
- one API object with ad hoc custom actions
- one form model
- one list-level record set
- one panel map

Reactor now supports that shape directly:

```js
import {
  createBlueFissionApp,
  createRecordModel,
  createRecordSet
} from "@bluefission/reactor";

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

const student = createRecordModel({
  student_id: 0,
  first_name: "",
  last_name: "",
  email: ""
});

const students = createRecordSet([], {
  idKey: "student_id",
  fetcher: async () => {
    const response = await app.resources.student.list();
    return response.list;
  }
});

app.assign("first_name", student.first_name);
app.set(".student-email-field", student.email, "value");
```

Read:

- `docs/addon-module-patterns.md`
- `examples/students-addon.js`
- `docs/develation-alignment.md`

## Migrating an Opus CRUD panel

Use the Opus CRUD adapter when the existing screen has the familiar pattern:

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
  content_id: 0,
  title: "",
  description: ""
});

const module = createCrudPanelModule({
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

## Recommended way to read the docs

1. Read `README.md` for intent and positioning.
2. Read `docs/api-reference.md` to see the actual exported API.
3. Read `docs/addon-module-patterns.md` if you are replacing existing addon module code.
4. Read `docs/opus-migration.md` if you are replacing existing Opus module code.
5. Read `ARCHITECTURE.md` if you are making library-level design decisions.
