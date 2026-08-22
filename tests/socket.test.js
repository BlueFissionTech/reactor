import assert from "node:assert/strict";
import test from "node:test";

import { SocketStates, createSocketClient } from "../src/browser/socket.js";

test("socket client preserves the minimal connect, message, send, and close surface", () => {
  const sockets = [];
  const messages = [];
  const states = [];
  const client = createSocketClient({
    url: "wss://example.test/socket",
    socketFactory: createSocketFactory(sockets),
    onMessage: (payload) => messages.push(payload),
    onStateChange: (next) => states.push(next)
  });

  assert.equal(client.getState(), SocketStates.IDLE);
  assert.equal(client.connect(), client);
  assert.equal(client.getState(), SocketStates.CONNECTING);

  sockets[0].open();
  assert.equal(client.isOpen(), true);
  client.send({ type: "ready" });
  sockets[0].message('{"type":"ack"}');
  client.close(1000, "done");

  assert.deepEqual(sockets[0].sent, ['{"type":"ready"}']);
  assert.deepEqual(messages, [{ type: "ack" }]);
  assert.deepEqual(states, [
    SocketStates.CONNECTING,
    SocketStates.OPEN,
    SocketStates.CLOSING,
    SocketStates.CLOSED
  ]);
  assert.equal(client.getSocket(), null);
});

test("socket bootstrap can resolve an authenticated target before each attempt", async () => {
  const sockets = [];
  const attempts = [];
  const timers = createTimers();
  const client = createSocketClient({
    url: "wss://example.test/socket",
    bootstrap: async ({ attempt, reconnecting }) => {
      attempts.push({ attempt, reconnecting });
      return {
        url: `wss://example.test/socket?ticket=${attempt + 1}`,
        protocols: ["bf-json"]
      };
    },
    reconnect: { maxAttempts: 1, initialDelayMs: 25 },
    socketFactory: createSocketFactory(sockets),
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout
  });

  client.connect();
  await settle();
  assert.equal(sockets[0].url, "wss://example.test/socket?ticket=1");
  assert.deepEqual(sockets[0].protocols, ["bf-json"]);

  sockets[0].open();
  sockets[0].serverClose(1006, "network");
  assert.equal(client.getState(), SocketStates.RECONNECTING);
  assert.deepEqual(timers.timeoutDelays(), [25]);

  timers.runNextTimeout();
  await settle();
  assert.equal(sockets[1].url, "wss://example.test/socket?ticket=2");
  assert.deepEqual(attempts, [
    { attempt: 0, reconnecting: false },
    { attempt: 1, reconnecting: true }
  ]);
});

test("pre-open queueing flushes messages in FIFO order", () => {
  const sockets = [];
  const client = createSocketClient({
    url: "wss://example.test/socket",
    queueBeforeOpen: true,
    socketFactory: createSocketFactory(sockets)
  });

  client.send({ sequence: 1 });
  client.connect();
  client.send({ sequence: 2 });

  assert.equal(client.getQueueSize(), 2);
  sockets[0].open();

  assert.deepEqual(sockets[0].sent, [
    '{"sequence":1}',
    '{"sequence":2}'
  ]);
  assert.equal(client.getQueueSize(), 0);
});

test("manual close cancels reconnect work and clears queued messages", () => {
  const sockets = [];
  const timers = createTimers();
  const client = createSocketClient({
    url: "wss://example.test/socket",
    queueBeforeOpen: true,
    reconnect: true,
    socketFactory: createSocketFactory(sockets),
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout
  });

  client.connect();
  sockets[0].open();
  sockets[0].serverClose(1006, "network");
  client.send("queued");
  client.close();

  assert.equal(client.getState(), SocketStates.CLOSED);
  assert.equal(client.getQueueSize(), 0);
  assert.equal(timers.timeoutCount(), 0);
  assert.equal(timers.runNextTimeout(), false);
  assert.equal(sockets.length, 1);
});

test("heartbeat pong acknowledgement prevents timeout teardown", () => {
  const sockets = [];
  const timers = createTimers();
  const pongs = [];
  const client = createSocketClient({
    url: "wss://example.test/socket",
    heartbeat: { intervalMs: 100, timeoutMs: 20 },
    socketFactory: createSocketFactory(sockets),
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval,
    clearInterval: timers.clearInterval,
    onPong: (payload) => pongs.push(payload)
  });

  client.connect();
  sockets[0].open();
  timers.runIntervals();
  assert.deepEqual(sockets[0].sent, ['{"type":"ping"}']);
  assert.equal(timers.timeoutCount(), 1);

  sockets[0].message('{"type":"pong"}');
  assert.deepEqual(pongs, [{ type: "pong" }]);
  assert.equal(timers.timeoutCount(), 0);

  client.destroy();
  assert.equal(timers.intervalCount(), 0);
});

test("heartbeat timeout closes the connection and enters reconnect policy", () => {
  const sockets = [];
  const timers = createTimers();
  const timeouts = [];
  const client = createSocketClient({
    url: "wss://example.test/socket",
    reconnect: { maxAttempts: 1, initialDelayMs: 50 },
    heartbeat: { intervalMs: 10, timeoutMs: 20 },
    socketFactory: createSocketFactory(sockets),
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    setInterval: timers.setInterval,
    clearInterval: timers.clearInterval,
    onHeartbeatTimeout: () => timeouts.push("timeout")
  });

  client.connect();
  sockets[0].open();
  timers.runIntervals();
  timers.runIntervals();
  assert.deepEqual(sockets[0].sent, ['{"type":"ping"}']);

  timers.runNextTimeout();
  assert.deepEqual(timeouts, ["timeout"]);
  assert.equal(client.getState(), SocketStates.RECONNECTING);
  assert.deepEqual(timers.timeoutDelays(), [50]);
});

test("bootstrap failures report errors and stop after the retry limit", () => {
  const timers = createTimers();
  const errors = [];
  const exhausted = [];
  const client = createSocketClient({
    url: "wss://example.test/socket",
    bootstrap() {
      throw new Error("ticket unavailable");
    },
    reconnect: { maxAttempts: 1, initialDelayMs: 0 },
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    onError: (error) => errors.push(error.message),
    onReconnectExhausted: () => exhausted.push(true)
  });

  client.connect();
  assert.equal(client.getState(), SocketStates.RECONNECTING);
  timers.runNextTimeout();

  assert.deepEqual(errors, ["ticket unavailable", "ticket unavailable"]);
  assert.deepEqual(exhausted, [true]);
  assert.equal(client.getState(), SocketStates.CLOSED);
});

function createSocketFactory(sockets) {
  return (url, protocols) => {
    const socket = new FakeSocket(url, protocols);
    sockets.push(socket);
    return socket;
  };
}

class FakeSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 0;
    this.sent = [];
  }

  open() {
    this.readyState = 1;
    this.onopen?.({ type: "open" });
  }

  message(data) {
    this.onmessage?.({ data });
  }

  send(payload) {
    if (this.readyState !== 1) {
      throw new Error("Socket is not open.");
    }
    this.sent.push(payload);
  }

  close(code = 1000, reason = "") {
    this.readyState = 3;
    this.onclose?.({ code, reason, wasClean: code === 1000 });
  }

  serverClose(code, reason) {
    this.close(code, reason);
  }
}

function createTimers() {
  let nextId = 1;
  const timeouts = new Map();
  const intervals = new Map();

  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      timeouts.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timeouts.delete(id);
    },
    setInterval(callback, delay) {
      const id = nextId++;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    timeoutCount() {
      return timeouts.size;
    },
    intervalCount() {
      return intervals.size;
    },
    timeoutDelays() {
      return [...timeouts.values()].map((timer) => timer.delay);
    },
    runNextTimeout() {
      const entry = timeouts.entries().next();
      if (entry.done) {
        return false;
      }
      const [id, timer] = entry.value;
      timeouts.delete(id);
      timer.callback();
      return true;
    },
    runIntervals() {
      [...intervals.values()].forEach((timer) => timer.callback());
    }
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}
