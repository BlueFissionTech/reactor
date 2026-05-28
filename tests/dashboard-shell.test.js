import test from "node:test";
import assert from "node:assert/strict";

import { createDashboardShell, normalizeRoute } from "../src/ui/dashboard-shell.js";

test("dashboard shells activate panels, menu state, and routes", async () => {
  const calls = [];
  const shell = createDashboardShell({
    homePanel: "summary",
    panels: {
      summary: {
        start(context) {
          calls.push(["summary", context.shell === shell]);
        }
      },
      detail: {
        init(context) {
          calls.push(["detail", context.route]);
        }
      }
    }
  });

  await shell.home();
  await shell.activatePanel("detail", { route: "records/7" });

  assert.deepEqual(calls, [
    ["summary", true],
    ["detail", "records/7"]
  ]);
  assert.equal(shell.currentPanel.value, "detail");
  assert.equal(shell.activeMenu.value, "detail");
  assert.equal(shell.route.value, "records/7");
});

test("dashboard shells map hash routes to registered panels", async () => {
  const calls = [];
  const shell = createDashboardShell({
    routes: {
      "records/7": "detail"
    },
    panels: {
      detail: {
        start(context) {
          calls.push(context.route);
        }
      }
    }
  });

  await shell.navigate("#/records/7");

  assert.deepEqual(calls, ["records/7"]);
  assert.equal(shell.currentPanel.value, "detail");
  assert.equal(shell.route.value, "records/7");
});

test("dashboard shells expose notice and dialog integration points", () => {
  const integrations = [];
  const shell = createDashboardShell({
    setActiveMenu(event) {
      integrations.push(["menu", event.name]);
    },
    setRoute(event) {
      integrations.push(["route", event.route]);
    },
    notice(event) {
      integrations.push(["notice", event.type, event.message]);
    },
    dialog(event) {
      integrations.push(["dialog", event.name]);
    }
  });

  shell.setActiveMenu("settings");
  shell.setRoute("#/settings");
  shell.notice("Saved", "success", { id: 12 });
  shell.dialog("confirm", { action: "delete" });

  assert.deepEqual(integrations, [
    ["menu", "settings"],
    ["route", "settings"],
    ["notice", "success", "Saved"],
    ["dialog", "confirm"]
  ]);
  assert.deepEqual(shell.noticeState.value, {
    message: "Saved",
    type: "success",
    meta: { id: 12 }
  });
  assert.deepEqual(shell.dialogState.value, {
    name: "confirm",
    payload: { action: "delete" }
  });
});

test("normalizes hash and path routes", () => {
  assert.equal(normalizeRoute("#/records/7"), "records/7");
  assert.equal(normalizeRoute("/settings/"), "settings");
  assert.equal(normalizeRoute("#"), "");
});
