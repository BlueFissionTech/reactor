# Reactor API Reference

This is the current public API exported from `src/index.js`.

## Core response

### `normalizeResponse(payload, options?)`

Normalizes backend payloads into a predictable Blue Fission-friendly response object.

### `BlueFissionResponse`

Small wrapper around `normalizeResponse`.

## Core transport

### `createTransport(options?)`

Fetch-based transport with:

- base URL handling
- CSRF header injection
- request and response hooks
- JSON and text parsing
- normalized responses

### `createResource(transport, endpoint)`

Creates CRUD methods for one endpoint:

- `list(params?)`
- `read(id, options?)`
- `create(data, options?)`
- `update(id, data, options?)`
- `save(data, options?)`
- `remove(id, options?)`
- `call(action, options?)`

### `createResourceFromDefinition(transport, definition, fallbackEndpoint?)`

Builds a CRUD resource from either:

- a string endpoint
- a definition object with `endpoint` and optional `actions`

Example:

```js
const item = createResourceFromDefinition(transport, {
  endpoint: "items",
  actions: {
    recent: {
      path: "recent",
      method: "GET"
    },
    archive: "archive"
  }
});
```

### `createResourceRegistry(transport, resources)`

Builds a keyed resource map from endpoint strings or definition objects.

## Core state

### `Signal`

Observable value container with:

- `value`
- `subscribe(callback, options?)`
- `publish(value?)`

### `createSignal(value)`

Convenience constructor for `Signal`.

### `isSignal(value)`

Checks whether a value is a Reactor signal.

### `computed(getter, dependencies?)`

Creates derived signal state.

## Behavioral objects

### `Events`

Common event constants inspired by DevElation object behavior.

### `States`

Common state constants such as `IsBusy`, `IsReading`, and `IsConnected`.

### `BehavioralObject`

Evented object with signal-backed fields.

Useful methods:

- `on(eventName, handler)`
- `off(eventName, handler)`
- `when(eventName, handler)`
- `trigger(eventName, payload)`
- `perform(eventName, payload)`
- `enter(stateName, payload)`
- `leave(stateName, payload)`
- `is(stateName)`
- `signal(field)`
- `field(name, value?)`
- `assign(data, options?)`
- `clear()`
- `echo(other, eventNames)`
- `snapshot()`

### `createBehavioralObject(initialData?)`

Convenience constructor for `BehavioralObject`.

## Modules

### `createModule(name, definition, options?)`

Creates a module with lifecycle hooks:

- `setup`
- `start`
- `stop`
- `destroy`

### `createModuleManager()`

Registry for named modules.

## DOM binding

### `select(selector, root?)`

Returns one DOM element.

### `selectAll(selector, root?)`

Returns all matching DOM elements as an array.

### `bindText(selector, source, options?)`

Binds text content to a signal or static value.

### `bindValue(selector, source, options?)`

Creates two-way binding for form controls.

### `interpolate(tag, source, options?)`

Replaces `{tag}` text placeholders inside the DOM.

### `on(selector, eventName, handler, options?)`

Attaches DOM event handlers and returns an unsubscribe function.

## Legacy-compatible DOM helpers

### `El`

Chainable DOM wrapper inspired by `framework.js`.

Methods include:

- `append(value)`
- `on(eventName, handler, options?)`
- `bind(name, source, options?)`
- `showIf(source, options?)`
- `addClassIf(className, source, options?)`
- `removeIf(source, options?)`

### `get(selector, root?)`

Returns a wrapped `El`.

### `set(selector, value, attribute?, options?)`

Legacy-style binding helper for one or more elements.

### `assign(tag, value, options?)`

Legacy-style token binding helper.

### `create(tagName)`

Creates a wrapped DOM element.

## Templates

### `Template`

Selector-driven template helper for the observed legacy pattern:

```html
<script type="text/template" id="resource-detail">
  <div>{{ title }}</div>
</script>
```

Methods:

- `render(data?)`
- `swap(target)`

### `renderTemplate(template, data)`

Convenience wrapper around `Template`.

## HTTP and services

### `HttpRequest`

Request object with:

- `withMethod(method)`
- `withHeader(name, value)`
- `withBody(body)`
- `withQuery(query)`
- `toUrl(baseUrl?)`

### `HttpResponse`

Response object with:

- `ok`
- `header(name)`
- `json()`
- `normalized()`

### `createHttpClient(options?)`

Low-level HTTP client that returns `HttpResponse`.

### `createGateway(processors?)`

Composable processor pipeline for request or response transformation.

### `createServiceClient(options?)`

Service-oriented client that combines:

- `HttpRequest`
- an HTTP client
- request processors
- response processors

Methods:

- `request(input, context?)`
- `get(url, options?, context?)`
- `post(url, body, options?, context?)`
- `put(url, body, options?, context?)`
- `patch(url, body, options?, context?)`
- `delete(url, body, options?, context?)`

## Data and UI

### `RecordSet`

Signal-aware list model inspired by the older dashboard `record-set.js`.

Methods:

- `fetch(page?, perPage?)`
- `add(record)`
- `remove(idOrIndex?)`
- `update(record, matcher?)`
- `get(idOrIndex?)`
- `current()`
- `select(idOrIndex)`
- `list()`
- `snapshot()`

### `createRecordSet(records?, options?)`

Convenience constructor for `RecordSet`.

### `createPanelRegistry(initialPanels?)`

Panel registry with:

- `register(name, panel)`
- `get(name)`
- `list()`
- `activate(name, context?)`

### `createPortletController(options?)`

Portlet helper inspired by `portlet-ui.js`.

Methods:

- `collapse(target)`
- `remove(target)`

## HTML helpers

### `escapeHtml(value)`

Escapes HTML-sensitive characters.

### `formatContent(content, options?)`

Formats lightweight markup into HTML.

### `renderTable(records?, options?)`

Renders a simple HTML table from row data.

### `renderFormField(config?)`

Renders a simple field, textarea, or select control.

## Adapters

### `createJQueryBridge($)`

Compatibility bridge for jQuery-heavy apps.

Methods:

- `onReady(callback)`
- `on(rootSelector, eventName, targetSelector, handler)`
- `onDirect(selector, eventName, handler)`
- `show(selector)`
- `hide(selector)`
- `fadeSwap(fromSelector, toSelector, duration?)`
- `modal(selector, action?)`
- `dataTableReload(selector)`
- `ajax(options)`

### `createJQueryNotifier(options?)`

Notifier wrapper with:

- `success(message)`
- `error(message)`

### `createBlueFissionApi(options?)`

Blue Fission-oriented API bootstrap.

Returns:

- `transport`
- `resources`
- `service`

Resource definitions can be plain endpoints or objects with named actions.

### `createBlueFissionApp(options?)`

Higher-level app bootstrap for legacy and modern internal modules.

Returns:

- `api`
- `service`
- `resources`
- `ui`
- `modules`
- `panels`
- `portlets`
- `select`
- `selectAll`
- `get`
- `getAll`
- `set`
- `assign`
- `computed`
- `bindText`
- `bindValue`
- `interpolate`
- `on`
- `template(template, data)`
- `recordSet(records?, options?)`
- `start(module)`
- `activatePanel(name, context?)`

### `createRecordModel(definition)`

Signal-backed record model used by CRUD panel adapters.

Extra methods:

- `update(values)`
- `clear()`
- `snapshot()`

### `createCrudPanelModule(options)`

Reusable CRUD module for conventional admin screens.

Supports:

- screen swapping
- save and delete flows
- jQuery event binding
- DataTable refresh hooks
- custom lifecycle hooks

## Browser utilities

### `createActivityTracker(options?)`

Tracks browser activity and optional DOM counters.

### `createSocketClient(options)`

Small WebSocket wrapper with send, close, and event callbacks.
