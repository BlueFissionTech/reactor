import test from "node:test";
import assert from "node:assert/strict";

import {
  createCrudPanelModule,
  createRecordModel
} from "../src/adapters/opus-crud.js";

test("CRUD panel modules run a representative list edit save delete flow", async () => {
  const bridge = createBridgeRecorder();
  const notices = [];
  const resourceCalls = [];
  const model = createRecordModel({
    id: 0,
    title: "",
    status: "draft"
  });
  const resource = {
    async read(id) {
      resourceCalls.push(["read", id]);
      return {
        ok: true,
        data: {
          id,
          title: "Loaded",
          status: "review"
        }
      };
    },
    async save(payload) {
      resourceCalls.push(["save", { ...payload }]);
      return {
        ok: true,
        data: {
          ...payload,
          status: "saved"
        }
      };
    },
    async remove(id) {
      resourceCalls.push(["remove", id]);
      return { ok: true };
    }
  };

  const module = createCrudPanelModule({
    name: "resource-editor",
    resource,
    model,
    bridge,
    ui: {
      notice(message, type) {
        notices.push([type || "success", message]);
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
      getRecord(eventTarget) {
        return eventTarget.record;
      }
    },
    messages: {
      saved: "Saved.",
      deleted: "Deleted."
    }
  });

  await module.start();
  await bridge.direct("[data-action='add']", "click")(clickEvent());
  await bridge.delegated("[data-resource-list]", "click", "[data-action='edit']")(clickEvent({
    record: {
      id: 7
    }
  }));

  model.title.value = "Updated";
  await bridge.direct("[data-action='save']", "click")(clickEvent());
  await bridge.direct("[data-action='delete']", "click")(clickEvent());
  await module.stop();

  assert.deepEqual(resourceCalls, [
    ["read", 7],
    ["save", { id: 7, title: "Updated", status: "review" }],
    ["remove", 7]
  ]);
  assert.deepEqual(model.snapshot(), {
    id: 0,
    title: "",
    status: "draft"
  });
  assert.deepEqual(notices, [
    ["success", "Saved."],
    ["success", "Deleted."]
  ]);
  assert.deepEqual(bridge.calls, [
    ["fadeSwap", "[data-screen='list']", "[data-screen='edit']"],
    ["fadeSwap", "[data-screen='list']", "[data-screen='edit']"],
    ["dataTableReload", "[data-resource-list]"],
    ["fadeSwap", "[data-screen='edit']", "[data-screen='list']"],
    ["dataTableReload", "[data-resource-list]"],
    ["fadeSwap", "[data-screen='edit']", "[data-screen='list']"]
  ]);
  assert.deepEqual(bridge.cleanupCalls.sort(), [
    "direct:[data-action='add']:click",
    "direct:[data-action='delete']:click",
    "direct:[data-action='home']:click",
    "direct:[data-action='save']:click",
    "delegated:[data-resource-list]:click:[data-action='edit']",
    "delegated:[data-resource-list]:click:[data-action='show']"
  ].sort());
});

test("CRUD panel modules validate required collaborators", () => {
  assert.throws(
    () => createCrudPanelModule({ resource: {}, model: createRecordModel({}) }),
    /requires a module name/
  );
  assert.throws(
    () => createCrudPanelModule({ name: "resource-editor", model: createRecordModel({}) }),
    /requires a resource/
  );
  assert.throws(
    () => createCrudPanelModule({ name: "resource-editor", resource: {} }),
    /requires a record model/
  );
});

function createBridgeRecorder() {
  const directHandlers = new Map();
  const delegatedHandlers = new Map();
  const cleanupCalls = [];

  return {
    calls: [],
    cleanupCalls,
    onDirect(selector, eventName, handler) {
      const key = `direct:${selector}:${eventName}`;
      directHandlers.set(key, handler);
      return () => cleanupCalls.push(key);
    },
    on(rootSelector, eventName, targetSelector, handler) {
      const key = `delegated:${rootSelector}:${eventName}:${targetSelector}`;
      delegatedHandlers.set(key, handler);
      return () => cleanupCalls.push(key);
    },
    direct(selector, eventName) {
      return directHandlers.get(`direct:${selector}:${eventName}`);
    },
    delegated(rootSelector, eventName, targetSelector) {
      return delegatedHandlers.get(`delegated:${rootSelector}:${eventName}:${targetSelector}`);
    },
    fadeSwap(fromSelector, toSelector) {
      this.calls.push(["fadeSwap", fromSelector, toSelector]);
    },
    hide(selector) {
      this.calls.push(["hide", selector]);
    },
    show(selector) {
      this.calls.push(["show", selector]);
    },
    dataTableReload(selector) {
      this.calls.push(["dataTableReload", selector]);
    }
  };
}

function clickEvent(currentTarget = {}) {
  return {
    currentTarget,
    preventDefault() {}
  };
}
