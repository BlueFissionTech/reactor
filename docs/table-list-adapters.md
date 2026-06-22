# Table And List Adapters

Table/list adapters provide a small contract for resource-backed list surfaces without owning a table plugin, DOM structure, or host route.

Use them when a module needs to coordinate:

- row lookup
- refresh and load state
- pagination
- search
- sort
- filters
- row selection

## Query Shape

`normalizeTableQuery(...)` returns:

- `page`
- `perPage`
- `search`
- `sort`
- `filters`

Sort entries use:

- `field`
- `direction`: `asc` or `desc`

Empty filters are removed so resource calls can avoid carrying meaningless values.

## Adapter Shape

`createTableListAdapter(options)` returns:

- `rows`
- `query`
- `loading`
- `error`
- `setRows(rows)`
- `rowFrom(target, context?)`
- `refresh(query?)`
- `select(target, context?)`

`rows`, `query`, `loading`, and `error` are signals.

## Ownership

Reactor owns query normalization, row lookup conventions, loading state, refresh orchestration, and selection handoff.

Hosts own the table renderer, column configuration, table plugin options, pagination widgets, route synchronization, permissions, and final data source.
