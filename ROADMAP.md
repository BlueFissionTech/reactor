# Reactor Roadmap

## Near term

- Stabilize the package API and usage examples.
- Expand tests across CRUD resources, signals, DOM helpers, templates, record sets, and UI adapters.
- Harden the dashboard shell, form helpers, rich surface contracts, and CRUD validation slices after review.
- Add table, modal, and notification adapter slices surfaced by CRUD validation.
- Validate additional module composition paths while keeping examples domain-neutral.

## Mid term

- Extract reusable UI patterns from existing internal modules.
- Provide richer table/list, modal flow, and notification adapters.
- Replace document-ready global bootstrapping with explicit app startup patterns.
- Expand DevElation-aligned request and object semantics where that improves interop without coupling.
- Publish versioned packages for internal npm consumption.

## Long term

- Reduce the hard dependency on jQuery in app code.
- Introduce optional renderer integrations for more modern component models.
- Align more directly with BlueCore-generated modules and platform conventions.
- Offer migration guides from legacy copied modules to Reactor-based packages.
