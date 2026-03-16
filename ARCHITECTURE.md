# Reactor Architecture

## Design stance

Reactor separates stable frontend concerns from project-local behavior:

1. Core primitives handle data flow, transport, state, and module lifecycle.
2. Adapters integrate with legacy runtime assumptions such as jQuery and Blue Fission dashboard conventions.
3. Application code composes modules and resources rather than mutating globals ad hoc.

## Source layout

- `src/core`
  - framework-agnostic logic
- `src/dom`
  - browser DOM binding helpers
- `src/adapters`
  - compatibility bridges for Blue Fission and jQuery ecosystems

## Core contracts

### Response contract

The historic frontend code assumes backend payloads often include:

- `data`
- `status`
- `list`
- `id`
- `query`
- `children`

`normalizeResponse` preserves those fields while adding:

- `ok`
- `statusCode`
- `errors`
- `meta`
- `raw`

This lets current code keep using known fields while newer consumers gain consistent semantics.

### Transport contract

`createTransport` wraps fetch and handles:

- base URL joining
- request encoding
- JSON parsing
- CSRF header injection
- normalized response output

`createResource` layers CRUD semantics on top of that transport.

### State contract

`Signal` is a small observable value. It is intentionally close to the existing `Reactor` idea but framed as a reusable state primitive. `computed` supports derived values from one or more signals.

### Module contract

`createModule` gives each app unit explicit lifecycle hooks:

- `setup`
- `start`
- `stop`
- `destroy`

Plugins can extend the module context without forcing a framework choice.

## Interop direction

Legacy Opus code currently mixes:

- direct DOM mutation
- jQuery event binding
- AJAX wrappers
- window-global app objects

Reactor keeps compatibility available through adapters, but the architectural target is:

- explicit app creation
- explicit resource registration
- explicit module wiring
- DOM bindings tied to state

## Future layers

- dashboard shell and router helpers
- template adapters for current markup conventions
- data table and form adapters
- BlueCore-specific higher-level components
- optional modern renderer integrations

## Extracted legacy pattern

The first extracted legacy pattern is the common Opus CRUD admin panel flow. Historically this logic was rewritten in modules such as `module-content.js`, `module-entries.js`, and `module-students.js`. Reactor now provides a reusable adapter for that shape so projects can standardize around one implementation while keeping the current UI stack.
