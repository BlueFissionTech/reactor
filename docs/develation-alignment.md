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
- `src/Obj.php`
- behavioral event and state helpers

## Current Reactor analogs

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

Reactor analogs:

- `Template`
- `renderFormField(...)`
- `renderTable(...)`
- `formatContent(...)`
- `escapeHtml(...)`

These are intentionally lightweight right now. They are helpers and decorators, not a full HTML object model.

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
- use `createServiceClient(...)` when you want request and response pipelines closer to DevElation service objects
- use `BehavioralObject` when the model should emit events and carry explicit state
- use `Template`, `renderTable(...)`, and `renderFormField(...)` for server-friendly HTML decoration without adopting a full frontend framework

## Suggestions for DevElation

Reactor can already align better with DevElation if DevElation also meets it halfway in a few places:

1. Standardize one normalized response envelope across service and net layers so JS clients do not need endpoint-specific coercion.
2. Make gateway and client processors easier to mirror across PHP and JS by documenting request and response mutation stages explicitly.
3. Keep HTML helpers escaping-first by default so template and table rendering have the same safety posture on both sides.
4. Publish event and state constant sets in a more transportable form so frontend and backend object models can share semantics without hard coupling.

Those changes would improve DevElation itself while also making Reactor integration cleaner.

## Boundary

Reactor is not meant to become a direct JavaScript port of DevElation. The goal is:

- shared concepts
- compatible mental models
- portable contracts
- low coupling

That keeps both libraries useful on their own while still making Blue Fission projects easier to compose end to end.
