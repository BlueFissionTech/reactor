import test from "node:test";
import assert from "node:assert/strict";

import {
  NotificationTypes,
  createNotificationAdapter,
  normalizeNotification
} from "../src/ui/notifications.js";

test("notifications normalize payloads and unknown types", () => {
  assert.deepEqual(normalizeNotification({
    type: NotificationTypes.SUCCESS,
    message: "Saved",
    meta: {
      id: 12
    }
  }), {
    type: "success",
    message: "Saved",
    title: "",
    meta: {
      id: 12
    },
    context: null
  });

  assert.equal(normalizeNotification("Queued", "custom").type, "info");
});

test("notification adapters dispatch typed hooks before generic hooks", () => {
  const calls = [];
  const adapter = createNotificationAdapter({
    success(notification) {
      calls.push(["success", notification.message, notification.meta.id]);
    },
    notify(notification) {
      calls.push(["notify", notification.type]);
    }
  });

  const notification = adapter.success("Saved", {
    id: 7
  });
  adapter.warning("Check input");

  assert.deepEqual(notification, {
    type: "success",
    message: "Saved",
    title: "",
    meta: {
      id: 7
    },
    context: null
  });
  assert.deepEqual(calls, [
    ["success", "Saved", 7],
    ["notify", "warning"]
  ]);
});

test("notification adapters support custom dispatch and fallback logging", () => {
  const dispatched = [];
  const adapter = createNotificationAdapter({}, {
    dispatch(notification) {
      dispatched.push([notification.type, notification.message]);
    }
  });
  const fallbackCalls = [];
  const fallback = createNotificationAdapter({}, {
    fallback: {
      log(message, notification) {
        fallbackCalls.push(["log", message, notification.type]);
      },
      error(message, notification) {
        fallbackCalls.push(["error", message, notification.type]);
      }
    }
  });

  adapter.info("Ready");
  fallback.error("Failed");

  assert.deepEqual(dispatched, [["info", "Ready"]]);
  assert.deepEqual(fallbackCalls, [["error", "Failed", "error"]]);
});
