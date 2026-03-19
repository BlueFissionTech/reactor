# Legacy Script Coverage

This note maps the older `resource/src/js/modules/scripts` utilities from `control-hub` and related projects into Reactor.

## Original source area checked

The direct source area reviewed for this mapping was:

- `D:\projects\control-hub\resource\src\js\modules\scripts`

I also checked related usage in:

- `D:\projects\control-hub\resource\src\js\app.js`
- `D:\projects\control-hub\resource\src\js\modules\app\*`
- `D:\projects\control-hub\resource\src\js\modules\dashboard-ui\*`
- `D:\projects\control-hub\addons\students\resource\src\*`
- `D:\projects\control-hub\resource\src\js\pages\index.js`
- `D:\projects\control-hub\resource\markup\admin\panels\*`

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

While these are not in the `scripts` directory, they were part of the same practical authoring style in the older addons:

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

The real pattern in the inspected control-hub and framework markup is selector-addressed template fragments, typically:

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

## Concrete example checked

The most useful concrete example reviewed was:

- markup: `D:\projects\control-hub\addons\basiccontact\resource\markup\default\admin\panels\index.html`
- module: `D:\projects\control-hub\addons\basiccontact\resource\src\module-basiccontact.js`

That pair shows the real pattern clearly:

- `#contact-detail-display-item` is defined as a `<script type="text/template">` block
- the module reads a contact record
- the model is updated from the API response
- `Template.render()` is called
- `Template.swap('#contact-details')` replaces the existing preview section with rendered detail markup

That is the behavior downstream consumers such as `aidea` need to understand.

## Important boundary

This does not mean every original script is now in its final form.

It means Reactor now has a deliberate home for the reusable behavior from:

- `framework.js`
- `template.js`
- `activity.js`
- `websocket.js`

and the docs now reflect that those utilities are part of package scope rather than orphaned legacy code.
