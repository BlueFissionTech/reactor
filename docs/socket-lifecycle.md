# Socket lifecycle

`createSocketClient(...)` provides a browser-edge WebSocket lifecycle without imposing a domain protocol or DOM dependency.

Import it from the dedicated package path:

```js
import {
  SocketStates,
  createSocketClient
} from "@bluefission/reactor/socket";
```

## Authenticated bootstrap

Browser WebSocket constructors do not accept arbitrary authentication headers. Same-origin cookies are supplied by the browser. Token-based applications should resolve a short-lived signed URL or an allowed subprotocol before each connection attempt:

```js
const client = createSocketClient({
  url: "/socket",
  async bootstrap({ attempt }) {
    const response = await fetch(`/api/socket-ticket?attempt=${attempt}`);
    const { url, protocol } = await response.json();
    return { url, protocols: [protocol] };
  }
});
```

`bootstrap(...)` may return a URL string or `{ url, protocols }`. It runs before the first connection and every reconnect, allowing credentials to be refreshed without putting authentication policy inside Reactor.

## Connection lifecycle

The client exposes `idle`, `connecting`, `open`, `reconnecting`, `closing`, and `closed` through `SocketStates` and `getState()`.

```js
const client = createSocketClient({
  url: "wss://example.test/events",
  queueBeforeOpen: true,
  reconnect: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 30000,
    factor: 2
  },
  onStateChange(next, previous) {
    console.log(previous, next);
  }
});

client.connect();
```

Reconnect is opt-in. `shouldReconnect(event, nextAttempt, client)` can reject individual retries, and `delay(attempt, event)` can replace the deterministic exponential delay.

## Queue and ordering

`queueBeforeOpen: true` stores serialized outbound messages until the connection opens and flushes them in FIFO order. With queueing disabled, Reactor preserves the original pass-through behavior.

WebSocket preserves the order of sends on one live connection. Reactor preserves FIFO order while flushing its local queue. Neither guarantee provides application-level ordering across reconnects, acknowledgement, deduplication, replay, or exactly-once processing. Protocols that need those properties should carry sequence identifiers and acknowledgements in their own envelopes.

## Heartbeats

Heartbeat handling is opt-in:

```js
const client = createSocketClient({
  url: "/socket",
  heartbeat: {
    intervalMs: 30000,
    timeoutMs: 10000,
    message: { type: "ping" },
    isPong: (payload) => payload?.type === "pong"
  }
});
```

A missed acknowledgement closes the socket with code `4000` by default. If reconnect is enabled, the normal reconnect policy then applies.

## Teardown

`close(...)` and its `destroy(...)` alias cancel pending reconnect and heartbeat work, clear queued messages by default, and close the active socket. Pass `{ clearQueue: false }` as the third argument only when an application deliberately intends to retain queued work for a later explicit connection.
