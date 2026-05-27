# Legacy Script Coverage

This note maps older shared browser utilities into Reactor without prescribing a downstream project layout.

## Source Shape Reviewed

The source areas reviewed for this mapping included:

- shared DOM helper scripts
- app bootstrap modules
- dashboard utility modules
- resource-oriented modules
- server-rendered panel markup

## Coverage map

### `framework.js`

Original role:

- wrapper around DOM elements
- chainable append and bind behavior
- convenience helpers like `get`, `set`, `assign`, and `create`

Reactor mapping:

- `src/dom/framework.js`

Exports:

- `El`
- `get`
- `set`
- `assign`
- `create`

### `template.js`

Original role:

- small selector-based templating helper
- token replacement using `{{ key }}`
- DOM replacement through `swap(...)`

Actual observed usage:

- `new Template('#user-detail-display-item', user)`
- `new Template('#credential-status-list-item')`
- `new Template('#contact-detail-display-item', model)`
- markup stored in `<script type="text/template" id="...">...</script>` blocks

Reactor mapping:

- `src/dom/template.js`

Exports:

- `Template`
- `renderTemplate`

### `activity.js`

Original role:

- track page activity, clicks, keypresses, scrolling, and mouse movement
- write counters into specific DOM locations

Reactor mapping:

- `src/browser/activity.js`

Export:

- `createActivityTracker`

### `websocket.js`

Original role:

- create one raw WebSocket connection
- parse incoming messages
- send message payloads from page controls
- mutate the page directly for chat-style output

Reactor mapping:

- `src/browser/socket.js`

Export:

- `createSocketClient`

## Related `dashboard-ui` utility coverage

While these are not low-level browser scripts, they were part of the same practical authoring style in older project modules:

### `record-set.js`

Original role:

- track list data, current record, paging, and selection state

Reactor mapping:

- `src/data/record-set.js`

Exports:

- `RecordSet`
- `createRecordSet`

### `portlet-ui.js`

Original role:

- collapse and remove portlet panels
- optionally route remove confirmation through dashboard UI

Reactor mapping:

- `src/ui/portlet.js`

Export:

- `createPortletController`

## Template format detail

The useful general pattern is selector-addressed template fragments, typically:

```html
<script type="text/template" id="credential-status-list-item">
  <option value="{{ credential_status_id }}">{{ label }}</option>
</script>
```

Then in JavaScript:

```js
const template = new Template('#credential-status-list-item');
list.append(template.render(row));
```

Or for section replacement:

```js
const template = new Template('#contact-detail-display-item', model);
template.render();
template.swap('#contact-details');
```

The helper:

1. Locates the script block by selector.
2. Reads its inner HTML.
3. Replaces each `{{ key }}` token with the matching field from the provided object.
4. Stores the rendered output for later reuse.
5. Uses `swap(target)` when the caller wants to replace an existing DOM node or section placeholder with the rendered fragment.

That means the template is not a live reactive renderer by itself. The "real time" behavior comes from app code repeatedly calling `render(...)` and then appending or swapping the resulting markup as data changes.

## Concrete Pattern

This pattern usually looks like:

- a detail template is defined as a `<script type="text/template">` block
- the module reads a resource record
- the model is updated from the API response
- `Template.render()` is called
- `Template.swap(...)` replaces the existing preview section with rendered detail markup

That is the behavior downstream consumers need to understand.

## Important boundary

This does not mean every original script is now in its final form.

It means Reactor now has a deliberate home for the reusable behavior from:

- `framework.js`
- `template.js`
- `activity.js`
- `websocket.js`

and the docs now reflect that those utilities are part of package scope rather than orphaned legacy code.
