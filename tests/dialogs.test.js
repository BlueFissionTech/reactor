import test from "node:test";
import assert from "node:assert/strict";

import {
  DialogStates,
  createConfirmationController,
  createModalController,
  normalizeDialogRequest
} from "../src/ui/dialogs.js";

test("dialog requests normalize strings and payload metadata", () => {
  assert.deepEqual(normalizeDialogRequest({
    name: "delete-record",
    title: "Delete",
    message: "Delete this record?",
    confirmLabel: "Delete",
    payload: {
      id: 7
    },
    meta: {
      severity: "warning"
    }
  }), {
    name: "delete-record",
    title: "Delete",
    message: "Delete this record?",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    payload: {
      id: 7
    },
    meta: {
      severity: "warning"
    }
  });

  assert.equal(normalizeDialogRequest("Proceed?").message, "Proceed?");
});

test("modal controllers open and close with hook payloads", () => {
  const calls = [];
  const modal = createModalController({
    onOpen(request) {
      calls.push(["open", request.name]);
    },
    onClose(result) {
      calls.push(["close", result.state]);
    }
  });

  modal.open({
    name: "edit-record",
    payload: {
      id: 3
    }
  });
  const result = modal.close({
    state: DialogStates.CONFIRMED,
    payload: {
      saved: true
    }
  });

  assert.equal(modal.state.value, DialogStates.CLOSED);
  assert.equal(modal.current.value, null);
  assert.equal(result.request.name, "edit-record");
  assert.deepEqual(calls, [
    ["open", "edit-record"],
    ["close", "confirmed"]
  ]);
});

test("confirmation controllers resolve confirm and cancel decisions explicitly", async () => {
  const calls = [];
  const controller = createConfirmationController({
    onRequest(request) {
      calls.push(["request", request.name]);
    },
    onResolve(result) {
      calls.push(["resolve", result.state, result.confirmed]);
    }
  });

  const pending = controller.request({
    name: "delete-record",
    payload: {
      id: 7
    }
  });
  assert.equal(controller.status.value, DialogStates.PENDING);
  controller.confirm({
    reason: "approved"
  });
  const confirmed = await pending;

  const second = controller.request("Continue?");
  controller.cancel({
    reason: "dismissed"
  });
  const cancelled = await second;

  assert.equal(confirmed.confirmed, true);
  assert.equal(confirmed.request.payload.id, 7);
  assert.equal(cancelled.confirmed, false);
  assert.equal(controller.state.value, DialogStates.CLOSED);
  assert.deepEqual(calls, [
    ["request", "delete-record"],
    ["resolve", "confirmed", true],
    ["request", "confirm"],
    ["resolve", "cancelled", false]
  ]);
});
