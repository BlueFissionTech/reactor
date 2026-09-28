# Reactor Roadmap

## Completed foundation

- Published the reviewed MIT-licensed `0.1.0` baseline through trusted npm publishing.
- Added reusable dashboard shell, form, table/list, dialog, notification, surface contract, and CRUD adapter slices.
- Documented method-level dashboard utility ownership and the browser socket lifecycle contract.

## Near term

- Stabilize the package API and usage examples.
- Fold repeated low-level helper logic into the first-class primitive surface as related modules mature.
- Expand tests across CRUD resources, signals, DOM helpers, templates, record sets, and UI adapters.
- Harden the dashboard shell, form helpers, rich surface contracts, and CRUD validation slices after review.
- Validate additional module composition paths while keeping examples domain-neutral.
- Use the dashboard utility ownership map to keep future adapter extraction small and testable.
- Validate the production socket lifecycle contract across representative browser application adapters.
- Close or explicitly accept the evidence gaps documented in `docs/releasing.md` before adopting another release version.

## Mid term

- Extract reusable UI patterns from existing internal modules.
- Provide richer table/list, modal flow, and notification adapters.
- Replace document-ready global bootstrapping with explicit app startup patterns.
- Expand DevElation-aligned request and object semantics where that improves interop without coupling.
- Maintain versioned public npm releases for exact internal and external consumption.

## Long term

- Reduce the hard dependency on jQuery in app code.
- Introduce optional renderer integrations for more modern component models.
- Align more directly with BlueCore-generated modules and platform conventions.
- Offer migration guides from legacy copied modules to Reactor-based packages.

## Boundaries

Reactor remains a general frontend library. A full application shell, product-specific workflows, backend policy, and a mandatory renderer are intentional non-goals. Shared adapters should be added only when repeated frontend needs can be expressed through stable, reusable contracts.
