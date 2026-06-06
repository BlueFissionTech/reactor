import { createDashboardShell } from "../src/index.js";

const shell = createDashboardShell({
  homePanel: "summary",
  routes: {
    summary: "summary",
    "records/edit": "editor"
  },
  setActiveMenu({ name }) {
    document.querySelectorAll("[data-nav]").forEach((item) => {
      item.toggleAttribute("data-active", item.dataset.nav === name);
    });
  },
  setRoute({ route }) {
    history.replaceState(null, "", `#/${route}`);
  },
  notice({ message, type }) {
    document.querySelector("[data-notice]").textContent = `${type}: ${message}`;
  },
  dialog({ name, payload }) {
    document.querySelector(`[data-dialog='${name}']`)?.showModal?.();
    console.log("dialog payload", payload);
  }
});

shell.registerPanel("summary", {
  start() {
    document.querySelector("[data-screen='summary']").hidden = false;
    document.querySelector("[data-screen='editor']").hidden = true;
  }
});

shell.registerPanel("editor", {
  start() {
    document.querySelector("[data-screen='summary']").hidden = true;
    document.querySelector("[data-screen='editor']").hidden = false;
  }
});

window.addEventListener("hashchange", () => {
  shell.syncFromLocation(window.location);
});

document.querySelectorAll("[data-nav]").forEach((item) => {
  item.addEventListener("click", () => {
    shell.navigate(item.dataset.route || item.dataset.nav);
  });
});

shell.syncFromLocation(window.location);
