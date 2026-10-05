# Reactor Specification

## Purpose

Reactor provides the shared frontend foundation for Blue Fission internal products. It should absorb reusable frontend patterns while reducing duplication, clarifying conventions, and making internal projects easier to compose.

## Primary users

- Blue Fission developers building admin dashboards or internal SaaS interfaces
- internal applications that currently depend on copied frontend module code
- BlueCore-backed projects that need a predictable frontend contract
- Legacy jQuery-first apps that need a migration path rather than a rewrite

## User stories

- As an internal app developer, I can call Blue Fission APIs with a reusable client instead of redefining CRUD wrappers per project.
- As a dashboard developer, I can normalize DevElation-style responses without writing custom parsing logic in each module.
- As a maintainer, I can build modules with explicit lifecycle methods instead of relying on document-ready side effects.
- As a project team working in legacy jQuery screens, I can adopt Reactor incrementally without removing jQuery first.
- As a future platform maintainer, I can replace or supplement jQuery with a more modern layer without rewriting transport and response handling.

## Acceptance criteria

- The repo documents its purpose, scope, architecture, and roadmap.
- The package exports a coherent public API from `src/index.js`.
- The package exports first-class primitive helpers for value, array/list, object, string, and number normalization.
- The library includes a response normalizer that understands Blue Fission payload shapes such as `data`, `status`, `list`, `id`, `query`, and `children`.
- The library includes a transport layer with fetch-based requests and CRUD resource helpers.
- The library includes a lightweight reactive primitive for state and DOM binding.
- The library includes a reusable binding contract descriptor for frontend state, event, selector, and lifecycle handoffs.
- The library includes a reusable dashboard shell adapter for panel activation, route state, menu state, notices, and dialogs.
- The library includes async form helpers for validation, submission state, and transport-backed persistence.
- The library includes reusable surface contract descriptors for media, dialogue, scene, overlay, panel, notification, choice, and command surfaces.
- The library includes versioned command work-item and receipt descriptors for host-supplied identity, schema, authorization preview, progress, controls, terminal outcomes, and readback without granting browser-side authority.
- The library includes an HTML helper group that covers reusable formatting, element, table, form, pagination, media/file, graph, XML-like node, and rendered-output normalization needs.
- The HTML helper group accepts rendered strings from parsing/runtime flows and structured payloads with `html`, `output`, `rendered`, `renderedOutput`, `rendered_output`, `markdown`, `text`, `records`, `rows`, `fields`, `items`, `nodes`, `fragments`, `blocks`, or `children`.
- The HTML helper group includes an optional scoped style template for generated pages. It must only style content inside the Reactor HTML root, use stable `bf-rx-*` hooks, and avoid global element resets or app-specific layout assumptions.
- The library includes a module lifecycle abstraction suitable for dashboard and admin modules.
- The browser socket client exposes explicit lifecycle states, authenticated bootstrap hooks, opt-in reconnect and heartbeat policies, FIFO pre-open queueing, and deterministic teardown without owning application envelope semantics.
- The library includes a jQuery interoperability layer so existing apps can adopt it immediately.
- The design explicitly treats jQuery as a compatibility layer, not the long-term core.

## Non-goals for v0.1

- Recreating every existing dashboard widget or screen helper
- Providing a full framework-specific renderer
- Shipping a compiled browser bundle
- Replacing all current product-specific modules in one pass

## Integration rules

- Prefer npm package consumption.
- Publish the package publicly under the `@bluefission` scope with MIT licensing, immutable versions, reviewed release tags, and provenance-backed automation.
- Allow direct ESM inclusion for internal repos that are not yet package-driven.
- Keep payload conventions compatible with Blue Fission APIs.
- Avoid hard-coding one backend framework beyond the current Blue Fission response contract.

## Initial modules

- Response normalization
- Primitive helpers
- Transport and CRUD resources
- Module lifecycle
- Binding contract descriptors
- Dashboard shell adapter
- Async form helpers
- Surface contract descriptors
- Command work-item and receipt descriptors
- Signals and computed state
- DOM binding
- HTML helper rendering and output normalization
- jQuery bridge
- Blue Fission app bootstrap
- CRUD panel adapter for repeated admin module flows
