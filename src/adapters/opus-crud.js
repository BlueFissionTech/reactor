import { createModule } from "../core/module.js";
import { createSignal, isSignal } from "../core/signals.js";

export function createRecordModel(definition = {}) {
  const model = {};
  const snapshot = {};

  for (const [key, value] of Object.entries(definition)) {
    model[key] = isSignal(value) ? value : createSignal(value);
    snapshot[key] = model[key].value;
  }

  model.update = (values = {}) => {
    for (const [key, signal] of Object.entries(model)) {
      if (!isSignal(signal)) {
        continue;
      }

      if (Object.prototype.hasOwnProperty.call(values, key)) {
        signal.value = values[key];
      }
    }

    return model;
  };

  model.clear = () => {
    for (const [key, signal] of Object.entries(model)) {
      if (!isSignal(signal)) {
        continue;
      }

      signal.value = snapshot[key];
    }

    return model;
  };

  model.snapshot = () => {
    const output = {};

    for (const [key, signal] of Object.entries(model)) {
      if (isSignal(signal)) {
        output[key] = signal.value;
      }
    }

    return output;
  };

  return model;
}

export function createCrudPanelModule(options = {}) {
  const {
    name,
    resource,
    model,
    bridge,
    ui,
    selectors = {},
    screens = {},
    list = {},
    messages = {},
    hooks = {}
  } = options;

  if (!name) {
    throw new Error("createCrudPanelModule requires a module name.");
  }

  if (!resource) {
    throw new Error("createCrudPanelModule requires a resource.");
  }

  if (!model || typeof model.snapshot !== "function") {
    throw new Error("createCrudPanelModule requires a record model.");
  }

  const cleanup = [];
  let currentRecord = null;

  function notice(message, type = "success") {
    if (ui?.notice) {
      ui.notice(message, type);
      return;
    }

    if (type === "error") {
      console.error(message);
      return;
    }

    console.log(message);
  }

  function showEditScreen() {
    if (screens.list && screens.edit && bridge?.fadeSwap) {
      bridge.fadeSwap(screens.list, screens.edit);
      return;
    }

    if (screens.list && bridge?.hide) {
      bridge.hide(screens.list);
    }

    if (screens.edit && bridge?.show) {
      bridge.show(screens.edit);
    }
  }

  function showListScreen() {
    if (screens.edit && screens.list && bridge?.fadeSwap) {
      bridge.fadeSwap(screens.edit, screens.list);
      return;
    }

    if (screens.edit && bridge?.hide) {
      bridge.hide(screens.edit);
    }

    if (screens.list && bridge?.show) {
      bridge.show(screens.list);
    }
  }

  function resolveRecordId(record = {}) {
    if (typeof hooks.getRecordId === "function") {
      return hooks.getRecordId(record, model);
    }

    const snapshot = record === model ? model.snapshot() : record;
    const idKey = Object.keys(snapshot).find((key) => key === "id" || key.endsWith("_id"));
    return idKey ? snapshot[idKey] : null;
  }

  async function readRecord(record, behavior = {}) {
    const id = resolveRecordId(record);
    if (id == null) {
      return null;
    }

    currentRecord = id;
    const response = await resource.read(id);

    if (!response.ok) {
      notice(response.status || messages.readError || "Unable to load record.", "error");
      return response;
    }

    model.update(response.data || {});

    if (typeof hooks.afterRead === "function") {
      await hooks.afterRead({ response, model, record, currentRecord });
    }

    if (behavior.showEdit !== false) {
      showEditScreen();
    }

    return response;
  }

  async function saveRecord() {
    const payload = model.snapshot();
    const prepared = typeof hooks.beforeSave === "function"
      ? await hooks.beforeSave({ payload, model })
      : payload;

    const response = await resource.save(prepared);

    if (!response.ok && !response.id) {
      notice(response.status || messages.saveError || "Unable to save record.", "error");
      return response;
    }

    if (response.data && typeof response.data === "object") {
      model.update(response.data);
    }

    if (typeof hooks.afterSave === "function") {
      await hooks.afterSave({ response, model });
    }

    if (list.reload) {
      list.reload();
    } else if (list.selector && bridge?.dataTableReload) {
      bridge.dataTableReload(list.selector);
    }

    notice(messages.saved || "Record has been saved.");
    showListScreen();
    return response;
  }

  async function deleteRecord() {
    const id = currentRecord ?? resolveRecordId(model);
    if (id == null) {
      return null;
    }

    if (typeof hooks.beforeDelete === "function") {
      const allowed = await hooks.beforeDelete({ id, model, currentRecord });
      if (allowed === false) {
        return null;
      }
    }

    const response = await resource.remove(id);

    if (!response.ok) {
      notice(response.status || messages.deleteError || "Unable to delete record.", "error");
      return response;
    }

    model.clear();
    currentRecord = null;

    if (typeof hooks.afterDelete === "function") {
      await hooks.afterDelete({ response, model });
    }

    if (list.reload) {
      list.reload();
    } else if (list.selector && bridge?.dataTableReload) {
      bridge.dataTableReload(list.selector);
    }

    notice(messages.deleted || "Record has been deleted.");
    showListScreen();
    return response;
  }

  function bindActions() {
    if (selectors.homeButton && bridge?.onDirect) {
      cleanup.push(bridge.onDirect(selectors.homeButton, "click", (event) => {
        event.preventDefault();
        showListScreen();
      }));
    }

    if (selectors.addButton && bridge?.onDirect) {
      cleanup.push(bridge.onDirect(selectors.addButton, "click", (event) => {
        event.preventDefault();
        currentRecord = null;
        model.clear();
        showEditScreen();
      }));
    }

    if (selectors.saveButton && bridge?.onDirect) {
      cleanup.push(bridge.onDirect(selectors.saveButton, "click", async (event) => {
        event.preventDefault();
        await saveRecord();
      }));
    }

    if (selectors.deleteButton && bridge?.onDirect) {
      cleanup.push(bridge.onDirect(selectors.deleteButton, "click", async (event) => {
        event.preventDefault();
        await deleteRecord();
      }));
    }

    if (list.root && selectors.showButton && bridge?.on) {
      cleanup.push(bridge.on(list.root, "click", selectors.showButton, async (event) => {
        event.preventDefault();
        const row = list.getRecord ? list.getRecord(event.currentTarget) : null;
        await readRecord(row || model, { showEdit: hooks.showEditOnRead ?? false });
      }));
    }

    if (list.root && selectors.editButton && bridge?.on) {
      cleanup.push(bridge.on(list.root, "click", selectors.editButton, async (event) => {
        event.preventDefault();
        const row = list.getRecord ? list.getRecord(event.currentTarget) : null;
        await readRecord(row || model, { showEdit: true });
      }));
    }

    if (list.root && selectors.manageButton && bridge?.on && typeof hooks.manage === "function") {
      cleanup.push(bridge.on(list.root, "click", selectors.manageButton, async (event) => {
        event.preventDefault();
        const row = list.getRecord ? list.getRecord(event.currentTarget) : null;
        await hooks.manage({ row, model, currentRecord });
      }));
    }
  }

  return createModule(name, {
    async start() {
      bindActions();

      if (typeof hooks.onStart === "function") {
        await hooks.onStart({ model, resource });
      }

      if (typeof hooks.ready === "function") {
        await hooks.ready({ model, resource });
      }
    },
    async stop() {
      while (cleanup.length > 0) {
        const dispose = cleanup.pop();
        if (typeof dispose === "function") {
          dispose();
        }
      }
    }
  });
}
