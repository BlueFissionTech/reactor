# Reactor Architecture

## Design stance

Reactor separates stable frontend concerns from project-local behavior:

1. Core primitives handle low-level helpers, data flow, transport, state, object behavior, and module lifecycle.
2. Service and HTML layers provide DevElation-aligned request, response, gateway, and rendering helpers without hard coupling.
3. Adapters integrate with legacy runtime assumptions such as jQuery and Blue Fission dashboard conventions.
4. Application code composes modules and resources rather than mutating globals ad hoc.

## Source layout

- `src/core`
  - framework-agnostic logic
- `src/net`
  - request and response objects
- `src/services`
  - processor-based service clients and gateways
- `src/data`
  - record-oriented data helpers
- `src/dom`
  - browser DOM binding helpers
- `src/ui`
  - panel and portlet helpers
- `src/html`
  - lightweight rendering decorators
- `src/adapters`
  - compatibility bridges for Blue Fission and jQuery ecosystems
- `src/browser`
  - browser-edge activity and socket lifecycle utilities

## Core contracts

### Primitive helper contract

`src/core/primitives.js` keeps recurring normalization behavior in one package-owned surface:

- value checks such as `isNil`, `isScalar`, `isEmpty`, and `hasValue`
- list conversion through `toList`, `firstItem`, and `lastItem`
- object access and copying through `getPath`, `setPath`, `pick`, and `omit`
- string helpers such as `toText`, `dasherize`, and `joinClassNames`
- number coercion through `toNumber`, `toInteger`, and `clampNumber`

The grouped exports `Value`, `Arr`, `Obj`, `Str`, `Num`, and `Primitive` mirror the upstream primitive vocabulary while staying JavaScript-native and dependency-free.

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

### Behavioral object contract

`BehavioralObject` mirrors the useful parts of the DevElation `Obj` pattern in JavaScript:

- signal-backed fields
- named events
- named states
- snapshots for view updates

This lets Reactor models behave like data objects and event emitters at the same time.

### Service contract

`HttpRequest`, `HttpResponse`, `createGateway`, and `createServiceClient` provide a processor-oriented request pipeline closer to DevElation service and net classes. This layer is intentionally generic so Reactor can work with Blue Fission conventions without being locked to them.

### HTML helper contract

`src/html/helpers.js` is a lightweight rendering utility group, not a full renderer. It covers the reusable HTML helper families from the upstream PHP side:

- formatting, href/base hrefs, images, files, pagination, results, lists, and bar graphs
- form wrappers, fields, dropdowns, date parts, and validation metadata
- tables and XML-like node rebuilding
- rendered-output normalization for parser/runtime strings and structured output envelopes

Rendered strings pass through `renderHtml(...)` because parser and runtime readers, including Vibrato `Reader::output()`, already return final output. Text-bearing structured fields such as `{ text }`, table cells, form values, XML content, and element children are escaped unless the caller explicitly provides an `{ html }` payload or trusted content option.

`src/html/theme.css` is an optional presentation layer for helper output. It is not a global stylesheet or application theme. Rules are rooted at `.bf-reactor-html`, use low-specificity scoped selectors and `bf-rx-*` class hooks, and expose CSS custom properties for consuming applications that need to align colors, density, and surface treatments with their own shell.

### Module contract

`createModule` gives each app unit explicit lifecycle hooks:

- `setup`
- `start`
- `stop`
- `destroy`

Plugins can extend the module context without forcing a framework choice.

### Binding contract

`createBindingContract` describes the expected handoff between host application state and Reactor bindings. It keeps inputs, outputs, events, states, selectors, lifecycle steps, and ownership boundaries inspectable without forcing a renderer or product-specific adapter.

### Socket lifecycle contract

`createSocketClient` owns browser WebSocket connection state, per-attempt bootstrap, optional reconnect and heartbeat policy, FIFO pre-open queueing, and cleanup. It does not own authentication policy, application message schemas, acknowledgement, replay, deduplication, or exactly-once processing. Those concerns remain behind application and protocol ports.

## Interop direction

Legacy dashboard code currently mixes:

- direct DOM mutation
- jQuery event binding
- AJAX wrappers
- window-global app objects

Older project modules also mixed:

- custom resource actions added at runtime
- anonymous record sets
- template swapping
- panel registries hidden in globals

Reactor keeps compatibility available through adapters, but the architectural target is:

- explicit app creation
- explicit resource registration
- explicit named resource actions
- explicit module wiring
- explicit panel activation
- DOM bindings tied to state
- evented record and object models

## Future layers

- dashboard shell and router helpers
- template adapters for current markup conventions
- data table and form adapters
- BlueCore-specific higher-level components
- optional modern renderer integrations

## Extracted legacy pattern

One extracted legacy pattern is the common CRUD admin panel flow. Historically this logic was rewritten across project-local modules. Reactor now provides a reusable adapter for that shape so projects can standardize around one implementation while keeping the current UI stack.

`dashboard-ui` itself is only partially represented so far. Reactor currently exposes the jQuery-facing bridge surface that supports parts of that world, but it does not yet contain a full dashboard shell adapter for navigation, tab management, prompts, session timeout behavior, or rich screen orchestration. That boundary should stay explicit in the docs so consumers know what is extracted already versus what remains legacy.
