# DevElation Integration

This guide shows practical Reactor integration points for DevElation-backed PHP services and rendered output.

Reactor should not become a browser-side port of DevElation. The useful contract is narrower:

- DevElation owns PHP-side service, net, object, parsing, and HTML helper behavior.
- Reactor consumes service payloads, rendered output, record data, forms, and event/state concepts in JavaScript.
- Both sides keep predictable handoff shapes so applications do not need one-off glue for every endpoint.

## Service Responses

DevElation service responses commonly flow through `BlueFission\Services\Response::fill(...)`, `send()`, `deliver()`, or `message()`. Reactor expects the JSON payload to stay close to this shape:

```json
{
  "ok": true,
  "status": "OK",
  "statusCode": 200,
  "data": { "id": 1, "title": "Alpha" },
  "list": [{ "id": 1, "title": "Alpha" }],
  "id": 1,
  "query": "status=ready",
  "children": [],
  "errors": [],
  "meta": {}
}
```

Use `normalizeResponse(...)` or `BlueFissionResponse` on the frontend:

```js
import { BlueFissionResponse, normalizeResponse } from "@bluefission/reactor";

const normalized = normalizeResponse(payloadFromDevElation);
const response = new BlueFissionResponse(payloadFromDevElation);
```

`ok` is recomputed after errors are normalized. That means an endpoint can send `errors` as an array, object, or string and Reactor will expose a stable `errors` array.

## Service Clients And Gateways

DevElation has `Services\Request`, `Services\Gateway::process(...)`, and `Services\Client::get/post(...)`. Reactor mirrors that shape with `HttpRequest`, `HttpResponse`, `createGateway(...)`, and `createServiceClient(...)`.

Use request processors for the JavaScript-side equivalent of request preparation:

```js
const client = createServiceClient({
  requestProcessors: [
    (request) => request
      .withHeader("Accept", "application/json")
      .withHeader("X-Requested-With", "XMLHttpRequest")
  ],
  responseProcessors: [
    (response) => response.normalized(),
    (response) => new BlueFissionResponse(response)
  ]
});
```

This keeps fetch details, headers, CSRF, and response normalization in one place instead of spreading endpoint-specific parsing across screens.

## HTML And Parser Output

DevElation HTML and parsing output is already rendered when it comes from:

- `HTML\Template::render()`
- `HTML\Template::publish()`
- `Parsing\Parser::render()`
- `HTML\XML::outputXML(...)`

Pass those strings through `renderHtml(...)` as rendered output:

```js
import { renderHtml, renderHtmlPage } from "@bluefission/reactor";
import "@bluefission/reactor/html.css";

const body = renderHtml({ output: renderedTemplateFromPhp });
const page = renderHtmlPage(body, {
  title: "Rendered resource",
  density: "compact"
});
```

Use `{ text: value }` when the value is not already trusted rendered output. Reactor escapes text fields, table cells, form values, XML content, and element child strings by default.

## HTML Helper Mapping

Use these Reactor helpers when the frontend needs to rebuild the same general helper output from data rather than consume a finished PHP-rendered string.

| DevElation helper | Reactor helper |
| --- | --- |
| `HTML\HTML::format(...)` | `formatContent(...)` |
| `HTML\HTML::href(...)` | `normalizeHref(...)` |
| `HTML\HTML::baseHref(...)` | `renderBaseHref(...)` |
| `HTML\HTML::image(...)` | `renderImage(...)` |
| `HTML\HTML::file(...)` | `renderFileLink(...)` |
| `HTML\HTML::paginate(...)` | `renderPagination(...)` |
| `HTML\HTML::results(...)` | `renderResults(...)` |
| `HTML\HTML::barGraph(...)` | `renderBarGraph(...)` |
| `HTML\HTML::nl2li(...)` | `nl2li(...)` |
| `HTML\HTML::br2nl(...)` | `br2nl(...)` |
| `HTML\HTML::darkerColor(...)` | `darkenHexColor(...)` / `darkerColor(...)` |
| `HTML\Form::field(...)` | `renderFormField(...)` |
| `HTML\Form::dropdown(...)` | `renderDropdown(...)` |
| `HTML\Form::date(...)` | `renderDateField(...)` |
| `HTML\Form::splitDate(...)` | `splitDate(...)` |
| `HTML\Form::joinDate(...)` | `joinDateParts(...)` |
| `HTML\Form::open(...)` / `close()` | `renderFormOpen(...)` / `renderFormClose(...)` |
| `HTML\Form::draw(...)` | `renderForm(...)` |
| `HTML\Form::validation(...)` | `renderFormValidation(...)` |
| `HTML\Table::render()` | `renderTable(...)` |
| `HTML\XML::buildXML(...)` | `renderXml(...)` |

## Scoped Styling

For consistent frontend presentation, import `@bluefission/reactor/html.css` and wrap output with `renderHtmlPage(...)`. The stylesheet is opt-in:

- every rule is rooted at `.bf-reactor-html`
- helper hooks use the `bf-rx-*` prefix
- no global `body`, `table`, `form`, or button reset is shipped
- consumers can override CSS custom properties without forking the helper output

## Object And State Handoff

DevElation `Obj` exposes field assignment, `data()`, `toArray()`, and `toJson()`. Reactor uses `BehavioralObject` for the frontend equivalent:

```js
import { Events, States, createBehavioralObject } from "@bluefission/reactor";

const record = createBehavioralObject(response.data);

record.on(Events.CHANGE, ({ field, value }) => {
  console.log(field, value);
});

record.field("title", "Updated");
record.enter(States.SYNCED);
```

Use this for stateful frontend models that need evented updates without binding a screen to a specific rendering framework.

## Practical Checklist

- Return service payloads with `data`, `list`, `id`, `status`, `errors`, and `meta` where possible.
- Treat rendered PHP template/parser/XML output as trusted only when the backend owns that output path.
- Use `{ text }` for user-entered or unknown strings.
- Use `renderResults(...)` and `renderForm(...)` when the frontend receives records and field descriptors, not finished HTML.
- Use `renderHtmlPage(...)` and `@bluefission/reactor/html.css` when helper output needs a consistent frontend baseline.
- Keep request/response processors in `createServiceClient(...)` rather than duplicating endpoint parsing in screens.

See `examples/develation-integration.js` for an executable integration sketch.
