import { createTransport, createResourceRegistry } from "../core/transport.js";
import { createModuleManager } from "../core/module.js";
import {
  bindText,
  bindValue,
  interpolate,
  on,
  select,
  selectAll
} from "../dom/binder.js";

export function createBlueFissionApi(options = {}) {
  const transport = createTransport({
    baseUrl: options.apiBaseUrl || "/api",
    csrfToken: options.csrfToken || readCsrfToken,
    fetchImpl: options.fetchImpl,
    defaultHeaders: options.defaultHeaders,
    onRequest: options.onRequest,
    onResponse: options.onResponse
  });

  const resources = createResourceRegistry(transport, options.resources || {});

  return {
    transport,
    resources
  };
}

export function createBlueFissionApp(options = {}) {
  const api = createBlueFissionApi(options);
  const modules = createModuleManager();

  return {
    api,
    resources: api.resources,
    modules,
    get: select,
    getAll: selectAll,
    setText: bindText,
    setValue: bindValue,
    assign: interpolate,
    on,
    start(module) {
      modules.register(module);
      return modules.start(module.name);
    }
  };
}

function readCsrfToken() {
  return document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
}
