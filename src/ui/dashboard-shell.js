import { createSignal } from "../core/signals.js";
import { createPanelRegistry } from "./panels.js";

export function createDashboardShell(options = {}) {
  const panels = createPanelRegistry(options.panels || {});
  const currentPanel = createSignal(null);
  const activeMenu = createSignal(null);
  const route = createSignal(normalizeRoute(options.initialRoute || ""));
  const noticeState = createSignal(null);
  const dialogState = createSignal(null);
  const homePanel = options.homePanel || "home";

  const shell = {
    panels,
    currentPanel,
    activeMenu,
    route,
    noticeState,
    dialogState,
    registerPanel(name, panel) {
      return panels.register(name, panel);
    },
    async activatePanel(name, context = {}) {
      const panel = await panels.activate(name, {
        ...context,
        shell
      });

      if (!panel) {
        return null;
      }

      currentPanel.value = name;

      if (context.activateMenu !== false) {
        setActiveMenu(name, context);
      }

      if (context.updateRoute !== false) {
        setRoute(context.route || name, context);
      }

      return panel;
    },
    async home(context = {}) {
      return this.activatePanel(homePanel, {
        ...context,
        route: context.route || homePanel
      });
    },
    async navigate(target, context = {}) {
      const nextRoute = normalizeRoute(target);
      const panelName = resolvePanelName(nextRoute, options, context);

      setRoute(nextRoute, context);

      if (!panelName) {
        return null;
      }

      return this.activatePanel(panelName, {
        ...context,
        route: nextRoute,
        updateRoute: false
      });
    },
    syncFromLocation(location = globalThis.location, context = {}) {
      const target = location?.hash || location?.pathname || "";
      return this.navigate(target, context);
    },
    setActiveMenu(name, context = {}) {
      setActiveMenu(name, context);
    },
    setRoute(target, context = {}) {
      setRoute(target, context);
    },
    notice(message, type = "info", meta = {}) {
      const nextNotice = { message, type, meta };
      noticeState.value = nextNotice;
      callIntegration(options.notice, nextNotice);
      return nextNotice;
    },
    dialog(name, payload = {}) {
      const nextDialog = { name, payload };
      dialogState.value = nextDialog;
      callIntegration(options.dialog, nextDialog);
      return nextDialog;
    }
  };

  function setActiveMenu(name, context = {}) {
    activeMenu.value = name;
    callIntegration(options.setActiveMenu, { name, context, shell });
  }

  function setRoute(target, context = {}) {
    const nextRoute = normalizeRoute(target);
    route.value = nextRoute;
    callIntegration(options.setRoute, { route: nextRoute, context, shell });
  }

  return shell;
}

export function normalizeRoute(target = "") {
  const value = String(target || "").trim();

  if (!value || value === "#") {
    return "";
  }

  return value.replace(/^#\/?/, "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function resolvePanelName(route, options, context) {
  if (typeof options.resolvePanel === "function") {
    return options.resolvePanel(route, context);
  }

  const map = options.routes || {};
  if (route in map) {
    return map[route];
  }

  return route || options.homePanel || "home";
}

function callIntegration(callback, event) {
  if (typeof callback === "function") {
    callback(event);
  }
}
