import { createSignal } from "../core/signals.js";

export const DialogStates = Object.freeze({
  CLOSED: "closed",
  OPEN: "open",
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled"
});

export function normalizeDialogRequest(input = {}) {
  const source = typeof input === "string" ? { message: input } : input;

  return {
    name: source.name || "confirm",
    title: source.title || "",
    message: source.message || "",
    confirmLabel: source.confirmLabel || "Confirm",
    cancelLabel: source.cancelLabel || "Cancel",
    payload: isObject(source.payload) ? { ...source.payload } : {},
    meta: isObject(source.meta) ? { ...source.meta } : {}
  };
}

export function createModalController(options = {}) {
  const state = createSignal(DialogStates.CLOSED);
  const current = createSignal(null);
  const result = createSignal(null);

  function open(request = {}) {
    const normalized = normalizeDialogRequest(request);
    current.value = normalized;
    result.value = null;
    state.value = DialogStates.OPEN;
    callHook(options.onOpen, normalized);
    return normalized;
  }

  function close(nextResult = {}) {
    const normalized = {
      state: nextResult.state || DialogStates.CLOSED,
      payload: isObject(nextResult.payload) ? { ...nextResult.payload } : {},
      request: current.value
    };

    result.value = normalized;
    state.value = DialogStates.CLOSED;
    callHook(options.onClose, normalized);
    current.value = null;
    return normalized;
  }

  return {
    state,
    current,
    result,
    open,
    close
  };
}

export function createConfirmationController(options = {}) {
  const modal = createModalController({
    onOpen: options.onOpen,
    onClose: options.onClose
  });
  const status = createSignal(DialogStates.CLOSED);
  let pending = null;

  function request(input = {}) {
    const normalized = modal.open(input);
    status.value = DialogStates.PENDING;
    callHook(options.onRequest, normalized);

    return new Promise((resolve) => {
      pending = {
        request: normalized,
        resolve
      };
    });
  }

  function confirm(payload = {}) {
    return settle(DialogStates.CONFIRMED, true, payload);
  }

  function cancel(payload = {}) {
    return settle(DialogStates.CANCELLED, false, payload);
  }

  function settle(state, confirmed, payload = {}) {
    if (!pending) {
      return null;
    }

    const output = {
      state,
      confirmed,
      payload: isObject(payload) ? { ...payload } : {},
      request: pending.request
    };
    const resolve = pending.resolve;
    pending = null;
    status.value = state;
    callHook(options.onResolve, output);
    modal.close(output);
    resolve(output);
    return output;
  }

  return {
    state: modal.state,
    current: modal.current,
    result: modal.result,
    status,
    request,
    confirm,
    cancel
  };
}

function callHook(hook, payload) {
  if (typeof hook === "function") {
    hook(payload);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
