# Dashboard UI And jQuery Interop

## Short answer

Not fully.

Reactor currently documents and implements the extracted CRUD module pattern and the jQuery bridge that supports parts of the old dashboard world, but it does not yet fully document or re-home the entire historical `dashboard-ui` feature set.

## What `dashboard-ui` historically covered

In legacy dashboard code, `dashboard-ui` is not just one concern. It bundles several responsibilities:

- notices and dialogs
- menu click behavior
- hash-based navigation and panel loading
- tab and area management
- modal and rich text cleanup concerns
- session timeout and auto logout behavior
- direct jQuery DOM transitions

That means it is closer to a dashboard shell runtime than a small utility module.

## What Reactor currently covers

Reactor currently covers the parts of that ecosystem that were clean enough to extract first:

- resource and response behavior
- CRUD module lifecycle
- signal-backed record state
- evented object state
- record sets
- DOM binding
- template swapping
- portlet controls
- a jQuery compatibility bridge

The current bridge in `src/adapters/jquery.js` provides:

- delegated and direct event binding
- show and hide helpers
- fade-based screen swapping
- modal handoff
- DataTable reload support
- raw jQuery AJAX access when needed

That means Reactor already describes the modular relationship with jQuery as:

1. jQuery remains an integration dependency for legacy screens.
2. jQuery should sit behind a bridge or adapter when possible.
3. Core transport, state, and module logic should not require jQuery by default.

## What is documented versus what is still missing

### Documented now

- the extracted CRUD module pattern
- the existence of the jQuery bridge
- the intended adapter boundary between Reactor core and jQuery-heavy code

### Not documented well enough yet

- a feature-by-feature map of old `dashboard-ui` methods to future Reactor adapters
- navigation shell extraction plans in practical detail
- dialog and notice strategy beyond bridge-level compatibility
- tab management and panel orchestration plans
- how session timeout behavior should be represented once extracted

## Feature mapping

This is the current practical map:

- `DashboardUI.notice`
  partially represented by `createJQueryNotifier`
- `DashboardUI.alert`, `confirm`, `prompt`, `dialog`
  not yet extracted as a dedicated Reactor adapter
- `DashboardUI.navigate`, `goHome`, `menuClick`
  not yet extracted; belongs in a future dashboard shell adapter
- `DashboardUI.addTab`, `clearTabs`, `removeTab`, `removeArea`
  not yet extracted
- `DashboardUI` fade and visibility behavior
  partially represented by `createJQueryBridge`
- `DashboardUI` DataTable-centric refresh behavior
  partially represented by `createJQueryBridge.dataTableReload`
- `dashboard-ui/record-set.js`
  represented by `RecordSet` and `createRecordSet`
- `dashboard-ui/portlet-ui.js`
  represented by `createPortletController`
- CRUD-oriented module interactions that depended on `dashboard-ui`
  partially extracted into `createCrudPanelModule`

## Recommended interpretation

If you are reading Reactor today:

- treat jQuery as a supported compatibility dependency
- treat `dashboard-ui` as only partially mapped into Reactor
- treat the current CRUD adapter as the first extraction, not the finished dashboard architecture

That distinction matters. Without it, the library can sound more complete than it is.

## Next documentation step

The next useful improvement would be a method-by-method migration matrix from:

- `framework/resource/src/js/modules/dashboard-ui/dashboard-ui.js`

to:

- existing Reactor adapters
- planned Reactor adapters
- behaviors that should remain application-local
