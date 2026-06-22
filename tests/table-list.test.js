import test from "node:test";
import assert from "node:assert/strict";

import {
  createTableListAdapter,
  normalizeTableQuery
} from "../src/ui/table-list.js";

test("table queries normalize pagination, search, sort, and filters", () => {
  assert.deepEqual(normalizeTableQuery({
    page: "2",
    perPage: "50",
    search: 123,
    sort: [
      "title",
      {
        field: "created_at",
        direction: "DESC"
      },
      {
        direction: "desc"
      }
    ],
    filters: {
      status: "active",
      empty: "",
      missing: null
    }
  }), {
    page: 2,
    perPage: 50,
    search: "123",
    sort: [
      {
        field: "title",
        direction: "asc"
      },
      {
        field: "created_at",
        direction: "desc"
      }
    ],
    filters: {
      status: "active"
    }
  });
});

test("table list adapters load rows, expose loading state, and resolve selected rows", async () => {
  const calls = [];
  const adapter = createTableListAdapter({
    rows: [
      {
        id: 1,
        title: "Initial"
      }
    ],
    async load({ query }) {
      calls.push(["load", query.page, query.search]);
      return {
        rows: [
          {
            id: 7,
            title: "Loaded"
          }
        ]
      };
    },
    setLoading(value) {
      calls.push(["loading", value]);
    },
    onSelect({ row }) {
      calls.push(["select", row.title]);
    }
  });

  await adapter.refresh({
    page: 3,
    search: "open"
  });
  const row = adapter.select({
    dataset: {
      id: "7"
    }
  });

  assert.equal(adapter.loading.value, false);
  assert.equal(adapter.error.value, null);
  assert.deepEqual(adapter.rows.value, [
    {
      id: 7,
      title: "Loaded"
    }
  ]);
  assert.deepEqual(row, {
    id: 7,
    title: "Loaded"
  });
  assert.deepEqual(calls, [
    ["loading", true],
    ["load", 3, "open"],
    ["loading", false],
    ["select", "Loaded"]
  ]);
});

test("table list adapters surface refresh errors", async () => {
  const errors = [];
  const failure = new Error("load failed");
  const adapter = createTableListAdapter({
    async load() {
      throw failure;
    },
    onError(error) {
      errors.push(error.message);
    }
  });

  await assert.rejects(() => adapter.refresh(), /load failed/);

  assert.equal(adapter.loading.value, false);
  assert.equal(adapter.error.value, failure);
  assert.deepEqual(errors, ["load failed"]);
});
