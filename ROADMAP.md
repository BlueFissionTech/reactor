# Reactor Roadmap

## Near term

- Stabilize the package API and usage examples.
- Expand tests across CRUD resources, signals, DOM helpers, templates, record sets, and UI adapters.
- Add a dashboard shell adapter for reusable navigation patterns.
- Add richer form and HTML helpers for Blue Fission validation and submission flows.
- Validate the CRUD adapter against one real module migration without baking downstream layout into Reactor.
- Validate general module composition against a real internal migration while keeping examples domain-neutral.

## Mid term

- Extract reusable UI patterns from existing internal modules.
- Provide adapters for DataTables, modal flows, and notifications.
- Replace document-ready global bootstrapping with explicit app startup patterns.
- Expand DevElation-aligned request and object semantics where that improves interop without coupling.
- Publish versioned packages for internal npm consumption.

## Long term

- Reduce the hard dependency on jQuery in app code.
- Introduce optional renderer integrations for more modern component models.
- Align more directly with BlueCore-generated modules and platform conventions.
- Offer migration guides from legacy copied modules to Reactor-based packages.
