import { isPlainObject } from "../core/primitives.js";

export const NotificationTypes = Object.freeze({
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning"
});

const knownTypes = new Set(Object.values(NotificationTypes));

export function normalizeNotification(input = "", type = NotificationTypes.INFO, meta = {}) {
  const source = isPlainObject(input) ? input : { message: input };
  const options = isPlainObject(type) ? type : { type, meta };
  const normalizedType = normalizeType(source.type || options.type);
  const message = source.message ?? source.text ?? "";
  const title = source.title ?? "";

  return {
    type: normalizedType,
    message: String(message),
    title: title ? String(title) : "",
    meta: {
      ...(isPlainObject(options.meta) ? options.meta : {}),
      ...(isPlainObject(source.meta) ? source.meta : {})
    },
    context: source.context ?? options.context ?? null
  };
}

export function createNotificationAdapter(target = {}, options = {}) {
  const fallback = options.fallback || console;

  function notify(input, type, meta) {
    const notification = normalizeNotification(input, type, meta);

    if (typeof options.dispatch === "function") {
      options.dispatch(notification);
      return notification;
    }

    const typedHandler = target[notification.type];
    if (typeof typedHandler === "function") {
      typedHandler(notification);
      return notification;
    }

    if (typeof target.notify === "function") {
      target.notify(notification);
      return notification;
    }

    dispatchFallback(fallback, notification);
    return notification;
  }

  return {
    notify,
    success(message, meta) {
      return notify(message, NotificationTypes.SUCCESS, meta);
    },
    error(message, meta) {
      return notify(message, NotificationTypes.ERROR, meta);
    },
    info(message, meta) {
      return notify(message, NotificationTypes.INFO, meta);
    },
    warning(message, meta) {
      return notify(message, NotificationTypes.WARNING, meta);
    }
  };
}

function normalizeType(type) {
  return knownTypes.has(type) ? type : NotificationTypes.INFO;
}

function dispatchFallback(fallback, notification) {
  const method = notification.type === NotificationTypes.ERROR ? "error" : "log";

  if (typeof fallback?.[method] === "function") {
    fallback[method](notification.message, notification);
  }
}
