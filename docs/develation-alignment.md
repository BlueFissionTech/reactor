# DevElation Alignment

Reactor is not coupled to DevElation, but it should align with the parts of DevElation that already express stable backend and object ideas well.

## Areas reviewed

The comparison for this pass was based on:

- `src/Services/Request.php`
- `src/Services/Response.php`
- `src/Services/Client.php`
- `src/Services/Gateway.php`
- `src/Net/Request.php`
- `src/Net/Response.php`
- `src/HTML/Template.php`
- `src/HTML/Form.php`
- `src/HTML/Table.php`
- `src/HTML/HTML.php`
- `src/HTML/XML.php`
- `src/Parsing/Parser.php`
- `src/Obj.php`
- behavioral event and state helpers

## Current Reactor analogs

### Primitive helpers

DevElation concepts:

- `Arr`
- `Obj`
- `Str`
- `Num`
- value normalization helpers

Reactor analogs:

- `Value`
- `Arr`
- `Obj`
- `Str`
- `Num`
- `Primitive`
- named helpers such as `toList(...)`, `getPath(...)`, `setPath(...)`, `joinClassNames(...)`, `toNumber(...)`, and `toInteger(...)`

These helpers make primitive normalization first-class in Reactor without making Reactor's browser code depend on PHP classes or server-side runtime behavior.

### Request and response objects

DevElation concepts:

- `Services\Request`
- `Services\Response`
- `Net\Request`
- `Net\Response`

Reactor analogs:

- `HttpRequest`
- `HttpResponse`
- `normalizeResponse(...)`
- `BlueFissionResponse`

This gives Reactor explicit request and response objects instead of only opaque fetch options.

### Client and gateway flow

DevElation concepts:

- `Services\Client`
- `Services\Gateway`

Reactor analogs:

- `createHttpClient(...)`
- `createGateway(...)`
- `createServiceClient(...)`

This is the clearest alignment point today. The Reactor service layer supports processor pipelines without forcing Blue Fission-specific transport rules into every request.

### HTML helpers

DevElation concepts:

- `HTML\Template`
- `HTML\Form`
- `HTML\Table`
- `HTML\HTML`
- `HTML\XML`
- `Parsing\Parser::render()`

Reactor analogs:

- `Template`
- `renderHtml(...)`
- `renderHtmlPage(...)`
- `HtmlThemeClasses`
- `normalizeRenderedOutput(...)`
- `renderElement(...)`
- `renderAttributes(...)`
- `renderTable(...)`
- `renderResults(...)`
- `renderPagination(...)`
- `renderForm(...)`
- `renderFormOpen(...)`
- `renderFormClose(...)`
- `renderFormField(...)`
- `renderDropdown(...)`
- `renderDateField(...)`
- `splitDate(...)`
- `joinDateParts(...)`
- `formatContent(...)`
- `escapeHtml(...)`
- `normalizeHref(...)`
- `renderBaseHref(...)`
- `renderImage(...)`
- `renderFileLink(...)`
- `renderList(...)`
- `renderBarGraph(...)`
- `nl2li(...)`
- `br2nl(...)`
- `darkenHexColor(...)`
- `renderXml(...)`

These are intentionally lightweight. They represent the upstream helper concepts without becoming a browser-side port of the PHP classes or their server/file-system assumptions.

Compatibility rules:

- Rendered strings from `Parsing\Parser::render()` and Vibrato `Reader::output()` can be passed directly to `renderHtml(...)`.
- Structured rendered output may use `html`, `output`, `rendered`, `renderedOutput`, `rendered_output`, `markdown`, `text`, `records`, `rows`, `fields`, `items`, `nodes`, `fragments`, `blocks`, or `children`.
- `{ text }`, table cells, form values, element child strings, and XML content are escaped by default.
- `{ html }` and rendered output fields are treated as caller-owned HTML because those fields explicitly represent finished output.
- `renderHtmlPage(...)` and `src/html/theme.css` provide an optional page-level style scope for helper output. Styling is rooted at `.bf-reactor-html` and `bf-rx-*` classes so applications can opt in without importing global CSS behavior.

### Evented objects

DevElation concepts:

- `Obj`
- event behaviors
- state behaviors

Reactor analogs:

- `BehavioralObject`
- `Events`
- `States`
- `createBehavioralObject(...)`

This is the main JavaScript-side mirror for the DevElation object/event model.

It is designed to work well with:

- DOM bindings
- signals
- record sets
- module lifecycle hooks

## Practical guidance

Use the layers like this:

- use `createTransport(...)` or `createBlueFissionApi(...)` when you just need resource CRUD
- use `Value`, `Arr`, `Obj`, `Str`, and `Num` helpers when normalizing JavaScript-side inputs, query state, class names, and object paths
- use `createServiceClient(...)` when you want request and response pipelines closer to DevElation service objects
- use `BehavioralObject` when the model should emit events and carry explicit state
- use `Template`, `renderHtml(...)`, `renderTable(...)`, `renderForm(...)`, and `renderFormField(...)` for server-friendly HTML decoration without adopting a full frontend framework

For concrete payloads, helper mapping, scoped styling, and service-client examples, see `docs/develation-integration.md`, `docs/primitives.md`, `examples/primitives.js`, and `examples/develation-integration.js`.

## Suggestions for DevElation

Reactor can already align better with DevElation if DevElation also meets it halfway in a few places:

1. Standardize one normalized response envelope across service and net layers so JS clients do not need endpoint-specific coercion.
2. Make gateway and client processors easier to mirror across PHP and JS by documenting request and response mutation stages explicitly.
3. Keep text-bearing HTML helpers escaping-first by default while documenting rendered-output fields as an explicit trust boundary.
4. Publish event and state constant sets in a more transportable form so frontend and backend object models can share semantics without hard coupling.

Those changes would improve DevElation itself while also making Reactor integration cleaner.

## Boundary

Reactor is not meant to become a direct JavaScript port of DevElation. The goal is:

- shared concepts
- compatible mental models
- portable contracts
- low coupling

That keeps both libraries useful on their own while still making Blue Fission projects easier to compose end to end.
