# Reactor Roadmap

## Near term

- Stabilize the package API and usage examples.
- Add tests for response normalization, CRUD resources, and signals.
- Add a dashboard shell adapter for Opus navigation patterns.
- Add form helpers for Blue Fission validation and submission flows.
- Validate the Opus CRUD adapter against one real module migration in `framework`.

## Mid term

- Extract reusable UI patterns from existing Opus modules.
- Provide adapters for DataTables, modal flows, and notifications.
- Replace document-ready global bootstrapping with explicit app startup patterns.
- Publish versioned packages for internal npm consumption.

## Long term

- Reduce the hard dependency on jQuery in app code.
- Introduce optional renderer integrations for more modern component models.
- Align more directly with BlueCore-generated modules and Opus platform conventions.
- Offer migration guides from legacy copied modules to Reactor-based packages.
