# Reactor Specification

## Purpose

Reactor provides the shared frontend foundation for Blue Fission internal products. It should absorb the reusable parts of current Opus and addon JavaScript while reducing duplication, clarifying conventions, and making internal projects easier to compose.

## Primary users

- Blue Fission developers building admin dashboards or internal SaaS interfaces
- Opus applications that currently depend on copied `resource/src/js/modules/*` code
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
- The library includes a response normalizer that understands Blue Fission payload shapes such as `data`, `status`, `list`, `id`, `query`, and `children`.
- The library includes a transport layer with fetch-based requests and CRUD resource helpers.
- The library includes a lightweight reactive primitive for state and DOM binding.
- The library includes a module lifecycle abstraction suitable for Opus-style dashboard modules.
- The library includes a jQuery interoperability layer so existing apps can adopt it immediately.
- The design explicitly treats jQuery as a compatibility layer, not the long-term core.

## Non-goals for v0.1

- Recreating every existing dashboard widget or screen helper
- Providing a full framework-specific renderer
- Shipping a compiled browser bundle
- Replacing all current Opus modules in one pass

## Integration rules

- Prefer npm package consumption.
- Allow direct ESM inclusion for internal repos that are not yet package-driven.
- Keep payload conventions compatible with BlueCore and Opus APIs.
- Avoid hard-coding one backend framework beyond the current Blue Fission response contract.

## Initial modules

- Response normalization
- Transport and CRUD resources
- Module lifecycle
- Signals and computed state
- DOM binding
- jQuery bridge
- Blue Fission app bootstrap
- Opus CRUD panel adapter for repeated admin module flows
