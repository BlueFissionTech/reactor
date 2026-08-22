export const SocketStates = Object.freeze({
  IDLE: "idle",
  CONNECTING: "connecting",
  OPEN: "open",
  RECONNECTING: "reconnecting",
  CLOSING: "closing",
  CLOSED: "closed"
});

const SOCKET_OPEN = 1;

export function createSocketClient(options = {}) {
  const {
    url,
    protocols,
    parseJson = true,
    socketFactory = (targetUrl, targetProtocols) => new WebSocket(targetUrl, targetProtocols)
  } = options;

  if (!url) {
    throw new Error("createSocketClient requires a socket URL.");
  }

  const reconnect = normalizeReconnect(options.reconnect);
  const heartbeat = normalizeHeartbeat(options.heartbeat);
  const queueBeforeOpen = options.queueBeforeOpen === true;
  const scheduleTimeout = options.setTimeout || globalThis.setTimeout?.bind(globalThis);
  const cancelTimeout = options.clearTimeout || globalThis.clearTimeout?.bind(globalThis);
  const scheduleInterval = options.setInterval || globalThis.setInterval?.bind(globalThis);
  const cancelInterval = options.clearInterval || globalThis.clearInterval?.bind(globalThis);

  let socket = null;
  let state = SocketStates.IDLE;
  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  let heartbeatDeadline = null;
  let generation = 0;
  let manuallyClosed = false;
  let queue = [];

  function connect() {
    if ([SocketStates.CONNECTING, SocketStates.OPEN, SocketStates.RECONNECTING].includes(state)) {
      return api;
    }

    manuallyClosed = false;
    reconnectAttempt = 0;
    beginConnection(false);
    return api;
  }

  function beginConnection(isReconnect) {
    clearReconnectTimer();
    const currentGeneration = ++generation;
    transition(isReconnect ? SocketStates.RECONNECTING : SocketStates.CONNECTING);

    let connection;
    try {
      connection = typeof options.bootstrap === "function"
        ? options.bootstrap({
            url,
            protocols,
            attempt: reconnectAttempt,
            reconnecting: isReconnect,
            client: api
          })
        : { url, protocols };
    } catch (error) {
      handleConnectionFailure(error, currentGeneration);
      return;
    }

    if (isPromiseLike(connection)) {
      Promise.resolve(connection)
        .then((resolved) => openSocket(resolveConnection(resolved, url, protocols), currentGeneration))
        .catch((error) => handleConnectionFailure(error, currentGeneration));
      return;
    }

    openSocket(resolveConnection(connection, url, protocols), currentGeneration);
  }

  function openSocket(connection, currentGeneration) {
    if (manuallyClosed || currentGeneration !== generation) {
      return;
    }

    let nextSocket;
    try {
      nextSocket = connection.protocols
        ? socketFactory(connection.url, connection.protocols)
        : socketFactory(connection.url);
    } catch (error) {
      handleConnectionFailure(error, currentGeneration);
      return;
    }

    socket = nextSocket;

    nextSocket.onopen = (event) => {
      if (socket !== nextSocket || currentGeneration !== generation) {
        return;
      }

      reconnectAttempt = 0;
      transition(SocketStates.OPEN);
      flushQueue();
      startHeartbeat();

      if (typeof options.onOpen === "function") {
        options.onOpen(event, api);
      }
    };

    nextSocket.onmessage = (event) => {
      if (socket !== nextSocket || currentGeneration !== generation) {
        return;
      }

      const payload = parseJson ? tryParseJson(event.data) : event.data;
      acknowledgeHeartbeat(payload, event);

      if (typeof options.onMessage === "function") {
        options.onMessage(payload, event, api);
      }
    };

    nextSocket.onerror = (event) => {
      if (socket !== nextSocket || currentGeneration !== generation) {
        return;
      }

      notifyError(event);
    };

    nextSocket.onclose = (event) => {
      if (socket !== nextSocket || currentGeneration !== generation) {
        return;
      }

      stopHeartbeat();
      socket = null;

      if (typeof options.onClose === "function") {
        options.onClose(event, api);
      }

      if (manuallyClosed) {
        transition(SocketStates.CLOSED);
        return;
      }

      scheduleReconnect(event);
    };
  }

  function handleConnectionFailure(error, currentGeneration) {
    if (manuallyClosed || currentGeneration !== generation) {
      return;
    }

    notifyError(error);
    scheduleReconnect({ error, phase: "bootstrap" });
  }

  function send(message) {
    const payload = serializeMessage(message);

    if (isOpen()) {
      socket.send(payload);
      return api;
    }

    if (queueBeforeOpen) {
      queue.push(payload);
      return api;
    }

    // Preserve the original pass-through behavior while disconnected queueing remains opt-in.
    socket?.send(payload);
    return api;
  }

  function close(code, reason, closeOptions = {}) {
    manuallyClosed = true;
    clearReconnectTimer();
    stopHeartbeat();

    if (closeOptions.clearQueue !== false) {
      queue = [];
    }

    if (!socket) {
      generation += 1;
      transition(SocketStates.CLOSED);
      return api;
    }

    transition(SocketStates.CLOSING);
    socket.close(code, reason);
    return api;
  }

  function scheduleReconnect(event) {
    if (!reconnect.enabled || !canReconnect(event)) {
      transition(SocketStates.CLOSED);
      return;
    }

    if (reconnectAttempt >= reconnect.maxAttempts) {
      transition(SocketStates.CLOSED);
      if (typeof options.onReconnectExhausted === "function") {
        options.onReconnectExhausted(event, api);
      }
      return;
    }

    reconnectAttempt += 1;
    const delay = reconnect.delayFor(reconnectAttempt, event);
    transition(SocketStates.RECONNECTING);

    if (typeof options.onReconnect === "function") {
      options.onReconnect({ attempt: reconnectAttempt, delay, event }, api);
    }

    if (typeof scheduleTimeout !== "function") {
      transition(SocketStates.CLOSED);
      notifyError(new Error("Reconnect requires a timeout implementation."));
      return;
    }

    reconnectTimer = scheduleTimeout(() => {
      reconnectTimer = null;
      if (!manuallyClosed) {
        beginConnection(true);
      }
    }, delay);
  }

  function canReconnect(event) {
    if (manuallyClosed) {
      return false;
    }

    return typeof reconnect.shouldReconnect === "function"
      ? reconnect.shouldReconnect(event, reconnectAttempt + 1, api) !== false
      : true;
  }

  function flushQueue() {
    while (queue.length > 0 && isOpen()) {
      socket.send(queue[0]);
      queue.shift();
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    if (!heartbeat || typeof scheduleInterval !== "function") {
      return;
    }

    heartbeatTimer = scheduleInterval(() => {
      if (!isOpen() || heartbeatDeadline != null) {
        return;
      }

      const payload = typeof heartbeat.message === "function"
        ? heartbeat.message(api)
        : heartbeat.message;
      socket.send(serializeMessage(payload));

      if (typeof options.onHeartbeat === "function") {
        options.onHeartbeat(payload, api);
      }

      if (heartbeat.timeoutMs > 0 && typeof scheduleTimeout === "function") {
        heartbeatDeadline = scheduleTimeout(() => {
          heartbeatDeadline = null;
          if (!isOpen()) {
            return;
          }

          if (typeof options.onHeartbeatTimeout === "function") {
            options.onHeartbeatTimeout(api);
          }
          socket.close(heartbeat.closeCode, heartbeat.closeReason);
        }, heartbeat.timeoutMs);
      }
    }, heartbeat.intervalMs);
  }

  function acknowledgeHeartbeat(payload, event) {
    if (!heartbeat || !heartbeat.isPong(payload, event, api)) {
      return;
    }

    clearHeartbeatDeadline();
    if (typeof options.onPong === "function") {
      options.onPong(payload, event, api);
    }
  }

  function stopHeartbeat() {
    if (heartbeatTimer != null && typeof cancelInterval === "function") {
      cancelInterval(heartbeatTimer);
    }
    heartbeatTimer = null;
    clearHeartbeatDeadline();
  }

  function clearHeartbeatDeadline() {
    if (heartbeatDeadline != null && typeof cancelTimeout === "function") {
      cancelTimeout(heartbeatDeadline);
    }
    heartbeatDeadline = null;
  }

  function clearReconnectTimer() {
    if (reconnectTimer != null && typeof cancelTimeout === "function") {
      cancelTimeout(reconnectTimer);
    }
    reconnectTimer = null;
  }

  function transition(nextState) {
    if (state === nextState) {
      return;
    }

    const previousState = state;
    state = nextState;
    if (typeof options.onStateChange === "function") {
      options.onStateChange(nextState, previousState, api);
    }
  }

  function notifyError(error) {
    if (typeof options.onError === "function") {
      options.onError(error, api);
    }
  }

  function getSocket() {
    return socket;
  }

  function getState() {
    return state;
  }

  function getQueueSize() {
    return queue.length;
  }

  function isOpen() {
    return Boolean(socket && socket.readyState === SOCKET_OPEN);
  }

  const api = {
    connect,
    send,
    close,
    destroy: close,
    getSocket,
    getState,
    getQueueSize,
    isOpen
  };

  return api;
}

function normalizeReconnect(value) {
  if (!value) {
    return {
      enabled: false,
      maxAttempts: 0,
      shouldReconnect: null,
      delayFor: () => 0
    };
  }

  const source = value === true ? {} : value;
  const initialDelayMs = Math.max(0, Number(source.initialDelayMs ?? 500));
  const maxDelayMs = Math.max(initialDelayMs, Number(source.maxDelayMs ?? 30000));
  const factor = Math.max(1, Number(source.factor ?? 2));

  return {
    enabled: true,
    maxAttempts: Math.max(0, Number(source.maxAttempts ?? 5)),
    shouldReconnect: source.shouldReconnect,
    delayFor(attempt, event) {
      if (typeof source.delay === "function") {
        return Math.max(0, Number(source.delay(attempt, event)) || 0);
      }

      return Math.min(maxDelayMs, initialDelayMs * (factor ** Math.max(0, attempt - 1)));
    }
  };
}

function normalizeHeartbeat(value) {
  if (!value) {
    return null;
  }

  const source = value === true ? {} : value;
  return {
    intervalMs: Math.max(1, Number(source.intervalMs ?? 30000)),
    timeoutMs: Math.max(0, Number(source.timeoutMs ?? 10000)),
    message: source.message ?? { type: "ping" },
    isPong: typeof source.isPong === "function"
      ? source.isPong
      : (payload) => payload?.type === "pong",
    closeCode: Number(source.closeCode ?? 4000),
    closeReason: source.closeReason || "Heartbeat timeout"
  };
}

function resolveConnection(value, fallbackUrl, fallbackProtocols) {
  if (typeof value === "string") {
    return { url: value, protocols: fallbackProtocols };
  }

  return {
    url: value?.url || fallbackUrl,
    protocols: value?.protocols ?? fallbackProtocols
  };
}

function serializeMessage(message) {
  return typeof message === "string" ? message : JSON.stringify(message);
}

function isPromiseLike(value) {
  return Boolean(value && typeof value.then === "function");
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
