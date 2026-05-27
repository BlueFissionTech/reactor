import {
  createBlueFissionApp,
  createCrudPanelModule,
  createJQueryBridge,
  createRecordModel
} from "../src/index.js";

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

const bridge = createJQueryBridge(window.jQuery);

const item = createRecordModel({
  id: 0,
  title: "",
  owner: "",
  status: "",
  priority: "",
  notes: ""
});

const statusLabel = app.computed(() => {
  return item.status.value ? item.status.value.toUpperCase() : "DRAFT";
}, [item.status]);

const items = app.recordSet([], {
  idKey: "id",
  fetcher: async () => {
    const response = await app.resources.item.list();
    return {
      list: response.list,
      total: response.list.length
    };
  }
});

app.assign("title", item.title);
app.assign("owner", item.owner);
app.assign("status", statusLabel);

app.set("[data-field='id']", item.id, "value", {
  rejectOn: Number.isNaN,
  mutator: Number
});
app.set("[data-field='title']", item.title, "value");
app.set("[data-field='status']", item.status, "value");

const workspacePanel = createCrudPanelModule({
  name: "resource-workspace",
  resource: app.resources.item,
  model: item,
  bridge,
  ui: {
    notice(message, type) {
      console.log(type || "success", message);
    }
  },
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
    selector: "[data-resource-list]",
    reload() {
      bridge.dataTableReload("[data-resource-list]");
    },
    getRecord(trigger) {
      return window.resourceTable
        ?.row(window.jQuery(trigger).parents("tr"))
        ?.data();
    }
  },
  hooks: {
    async onStart() {
      await items.fetch();
    },
    async afterRead({ model }) {
      const template = app.template("[data-template='resource-detail']", model);
      template.render();
      template.swap("[data-region='resource-detail']");
    }
  },
  messages: {
    saved: "Record saved.",
    deleted: "Record deleted."
  }
});

app.panels.register("workspace", workspacePanel);
app.activatePanel("workspace");

window.resourceWorkspace = app;
