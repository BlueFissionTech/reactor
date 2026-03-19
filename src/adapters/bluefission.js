import { computed } from "../core/signals.js";
import { createTransport, createResourceRegistry } from "../core/transport.js";
import { createModuleManager } from "../core/module.js";
import { get as getElement, set as setElement, assign as assignTokens } from "../dom/framework.js";
import { Template } from "../dom/template.js";
import { createPanelRegistry } from "../ui/panels.js";
import { createPortletController } from "../ui/portlet.js";
import { createRecordSet } from "../data/record-set.js";
import { createServiceClient } from "../services/service.js";
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
  const service = createServiceClient({
    baseUrl: options.apiBaseUrl || "/api",
    fetchImpl: options.fetchImpl,
    defaultHeaders: options.defaultHeaders,
    requestProcessors: [
      createCsrfProcessor(options.csrfToken || readCsrfToken),
      ...(options.requestProcessors || [])
    ],
    responseProcessors: options.responseProcessors || []
  });

  return {
    transport,
    resources,
    service
  };
}

export function createBlueFissionApp(options = {}) {
  const api = createBlueFissionApi(options);
  const modules = createModuleManager();
  const panels = createPanelRegistry(options.panels || {});
  const portlets = createPortletController({
    ...options.portlets,
    confirm: options.portlets?.confirm || options.ui?.confirm
  });

  const app = {
    api,
    service: api.service,
    resources: api.resources,
    ui: options.ui || null,
    modules,
    panels,
    portlets,
    select,
    selectAll,
    get: getElement,
    getAll: selectAll,
    set: setElement,
    assign: assignTokens,
    computed,
    bindText,
    bindValue,
    interpolate,
    on,
    template(template, data) {
      return new Template(template, data);
    },
    recordSet(records = [], recordSetOptions = {}) {
      return createRecordSet(records, recordSetOptions);
    },
    start(module) {
      modules.register(module);
      return modules.start(module.name);
    },
    activatePanel(name, context = {}) {
      return panels.activate(name, {
        ...context,
        app
      });
    }
  };

  app.setText = app.bindText;
  app.setValue = app.bindValue;

  return app;
}

function readCsrfToken() {
  return document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
}

function createCsrfProcessor(csrfToken) {
  return (request) => {
    const token = resolveValue(csrfToken);
    return token ? request.withHeader("X-CSRF-TOKEN", token) : request;
  };
}

function resolveValue(value) {
  return typeof value === "function" ? value() : value;
}
