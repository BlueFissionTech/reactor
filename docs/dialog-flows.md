# Dialog And Confirmation Flows

Dialog helpers provide an explicit request/result contract for modal and confirmation flows.

Use them when a module needs to ask for confirmation without owning markup, route policy, permissions, or final workflow side effects.

## Dialog Request

`normalizeDialogRequest(...)` returns:

- `name`
- `title`
- `message`
- `confirmLabel`
- `cancelLabel`
- `payload`
- `meta`

## Modal Controller

`createModalController(options)` returns:

- `state`
- `current`
- `result`
- `open(request)`
- `close(result)`

Hooks:

- `onOpen(request)`
- `onClose(result)`

## Confirmation Controller

`createConfirmationController(options)` returns:

- `state`
- `current`
- `result`
- `status`
- `request(input)`
- `confirm(payload?)`
- `cancel(payload?)`

`request(...)` returns a promise that resolves only after `confirm(...)` or `cancel(...)`.

## Ownership

Reactor owns request normalization, open/closed/pending/confirmed/cancelled state vocabulary, and explicit result payloads.

Hosts own modal rendering, content composition, button placement, focus management, permissions, workflow policy, and final side effects.
