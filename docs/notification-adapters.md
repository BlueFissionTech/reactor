# Notification Adapter Conventions

Notification adapters normalize application messages before a host display library receives them.

Use them when a module needs to report status without knowing whether the host uses a toast, banner, modal region, console, or another display surface.

## Contract

`normalizeNotification(...)` returns:

- `type`: `success`, `error`, `info`, or `warning`
- `message`
- `title`
- `meta`
- `context`

`createNotificationAdapter(target, options)` returns:

- `notify(input, type?, meta?)`
- `success(message, meta?)`
- `error(message, meta?)`
- `info(message, meta?)`
- `warning(message, meta?)`

The adapter dispatches in this order:

1. `options.dispatch(notification)`
2. typed target method such as `target.success(notification)`
3. `target.notify(notification)`
4. fallback logging

## Ownership

Reactor owns the normalized notification payload and dispatch order. Hosts own placement, animation, persistence, accessibility behavior, permissions, and provider-specific rendering.

Keep provider SDKs outside Reactor core. Pass small target objects or dispatch functions into the adapter instead.
