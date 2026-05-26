import {
  createBlueFissionApp,
  createCrudPanelModule,
  createJQueryBridge,
  createRecordModel
} from "../src/index.js";

const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    item: "items"
  }
});

const bridge = createJQueryBridge(window.jQuery);

const item = createRecordModel({
  id: 0,
  title: "",
  slug: "",
  summary: "",
  status: "",
  body: ""
});

const itemModule = createCrudPanelModule({
  name: "resource-editor",
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
    root: "[data-resource-list]",
    selector: "[data-resource-list]",
    getRecord(trigger) {
      return window.resourceTable
        ?.row(window.jQuery(trigger).parents("tr"))
        ?.data();
    }
  },
  messages: {
    saved: "Record saved.",
    deleted: "Record deleted."
  }
});

app.start(itemModule);
