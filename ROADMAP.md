# Reactor Roadmap

## Near term

- Stabilize the package API and usage examples.
- Add tests for response normalization, CRUD resources, and signals.
- Add a dashboard shell adapter for Opus navigation patterns.
- Add richer form and HTML helpers for Blue Fission validation and submission flows.
- Validate the Opus CRUD adapter against one real module migration in `framework`.
- Validate the students-style addon and dashboard pattern against a real `control-hub` migration.

## Mid term

- Extract reusable UI patterns from existing Opus modules.
- Provide adapters for DataTables, modal flows, and notifications.
- Replace document-ready global bootstrapping with explicit app startup patterns.
- Expand DevElation-aligned request and object semantics where that improves interop without coupling.
- Publish versioned packages for internal npm consumption.

## Long term

- Reduce the hard dependency on jQuery in app code.
- Introduce optional renderer integrations for more modern component models.
- Align more directly with BlueCore-generated modules and Opus platform conventions.
- Offer migration guides from legacy copied modules to Reactor-based packages.
