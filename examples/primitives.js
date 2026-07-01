import {
  Arr,
  Num,
  Obj,
  Str,
  Value,
  getPath,
  setPath,
  toList
} from "../src/index.js";

export const rawPayload = {
  user: {
    profile: {
      name: "Ada Lovelace"
    },
    roles: "admin, editor"
  },
  meta: {
    page: "2",
    perPage: "25"
  }
};

export const normalizedPayload = setPath(rawPayload, "user.roles", toList(rawPayload.user.roles, {
  split: true
}));

export const primitiveSummary = {
  name: getPath(normalizedPayload, "user.profile.name", "Unknown"),
  roles: Arr.toList(getPath(normalizedPayload, "user.roles")),
  page: Num.toInteger(getPath(normalizedPayload, "meta.page"), 1, { min: 1 }),
  perPage: Num.toInteger(getPath(normalizedPayload, "meta.perPage"), 25, { min: 1, max: 100 }),
  className: Str.joinClassNames("resource-row", ["is-active", "resource-row"]),
  hasProfile: Value.hasValue(Obj.getPath(normalizedPayload, "user.profile"))
};

export function buildResourceQuery(input = {}) {
  return {
    page: Num.toInteger(input.page, 1, { min: 1 }),
    perPage: Num.toInteger(input.perPage ?? input.limit, 25, { min: 1, max: 100 }),
    search: Str.toText(input.search).trim(),
    filters: Obj.omit(input.filters, ["debug"])
  };
}
