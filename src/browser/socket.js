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

  let socket = null;

  function connect() {
    socket = protocols ? socketFactory(url, protocols) : socketFactory(url);

    socket.onopen = (event) => {
      if (typeof options.onOpen === "function") {
        options.onOpen(event, api);
      }
    };

    socket.onmessage = (event) => {
      const payload = parseJson ? tryParseJson(event.data) : event.data;
      if (typeof options.onMessage === "function") {
        options.onMessage(payload, event, api);
      }
    };

    socket.onerror = (event) => {
      if (typeof options.onError === "function") {
        options.onError(event, api);
      }
    };

    socket.onclose = (event) => {
      if (typeof options.onClose === "function") {
        options.onClose(event, api);
      }
    };

    return api;
  }

  function send(message) {
    const payload = typeof message === "string" ? message : JSON.stringify(message);
    socket?.send(payload);
    return api;
  }

  function close(code, reason) {
    socket?.close(code, reason);
    return api;
  }

  function getSocket() {
    return socket;
  }

  const api = {
    connect,
    send,
    close,
    getSocket
  };

  return api;
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
