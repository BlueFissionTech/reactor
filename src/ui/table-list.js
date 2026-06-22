import { createSignal } from "../core/signals.js";

export function normalizeTableQuery(input = {}) {
  return {
    page: normalizePositiveInteger(input.page, 1),
    perPage: normalizePositiveInteger(input.perPage ?? input.limit, 25),
    search: input.search == null ? "" : String(input.search),
    sort: normalizeSort(input.sort),
    filters: normalizeFilters(input.filters || {})
  };
}

export function createTableListAdapter(options = {}) {
  const rows = createSignal(Array.isArray(options.rows) ? [...options.rows] : []);
  const query = createSignal(normalizeTableQuery(options.query || {}));
  const loading = createSignal(false);
  const error = createSignal(null);

  function setRows(nextRows = []) {
    rows.value = Array.isArray(nextRows) ? [...nextRows] : [];
    return rows.value;
  }

  function rowFrom(target, context = {}) {
    if (typeof options.getRow === "function") {
      return options.getRow(target, {
        ...context,
        rows: rows.value,
        query: query.value
      });
    }

    const id = target?.dataset?.id ?? target?.id ?? context.id;
    if (id == null) {
      return null;
    }

    return rows.value.find((row) => String(row.id ?? row.key) === String(id)) || null;
  }

  async function refresh(nextQuery = {}) {
    query.value = normalizeTableQuery({
      ...query.value,
      ...nextQuery
    });
    loading.value = true;
    error.value = null;
    callHook(options.setLoading, true);

    try {
      const result = typeof options.load === "function"
        ? await options.load({ query: query.value, rows: rows.value })
        : rows.value;

      if (Array.isArray(result)) {
        setRows(result);
      } else if (Array.isArray(result?.rows)) {
        setRows(result.rows);
      }

      callHook(options.onRefresh, { query: query.value, rows: rows.value, result });
      return result;
    } catch (failed) {
      error.value = failed;
      callHook(options.onError, failed);
      throw failed;
    } finally {
      loading.value = false;
      callHook(options.setLoading, false);
    }
  }

  function select(target, context = {}) {
    const row = rowFrom(target, context);
    callHook(options.onSelect, { row, target, context });
    return row;
  }

  return {
    rows,
    query,
    loading,
    error,
    setRows,
    rowFrom,
    refresh,
    select
  };
}

function normalizeSort(sort) {
  if (Array.isArray(sort)) {
    return sort.map(normalizeSortEntry).filter(Boolean);
  }

  const entry = normalizeSortEntry(sort);
  return entry ? [entry] : [];
}

function normalizeSortEntry(sort) {
  if (typeof sort === "string" && sort.trim()) {
    return {
      field: sort,
      direction: "asc"
    };
  }

  if (!isObject(sort) || !sort.field) {
    return null;
  }

  const direction = String(sort.direction || "asc").toLowerCase() === "desc"
    ? "desc"
    : "asc";

  return {
    field: String(sort.field),
    direction
  };
}

function normalizeFilters(filters) {
  const output = {};

  for (const [key, value] of Object.entries(filters)) {
    if (value == null || value === "") {
      continue;
    }

    output[key] = value;
  }

  return output;
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function callHook(hook, payload) {
  if (typeof hook === "function") {
    hook(payload);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
