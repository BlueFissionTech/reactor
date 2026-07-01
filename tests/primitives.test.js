import test from "node:test";
import assert from "node:assert/strict";

import {
  Arr,
  Num,
  Obj,
  Primitive,
  Str,
  Value,
  clampNumber,
  dasherize,
  firstItem,
  getPath,
  hasValue,
  isEmpty,
  isNil,
  isPlainObject,
  isScalar,
  joinClassNames,
  lastItem,
  objectEntries,
  omit,
  pick,
  setPath,
  toInteger,
  toList,
  toNumber,
  toText
} from "../src/core/primitives.js";
import {
  Arr as ArrFromIndex,
  Obj as ObjFromIndex,
  Primitive as PrimitiveFromIndex,
  joinClassNames as joinClassNamesFromIndex
} from "../src/index.js";
import {
  buildResourceQuery,
  normalizedPayload,
  primitiveSummary,
  rawPayload
} from "../examples/primitives.js";

test("value helpers classify nil, scalar, empty, and present values", () => {
  assert.equal(isNil(null), true);
  assert.equal(isNil(undefined), true);
  assert.equal(isNil(0), false);
  assert.equal(isScalar("ready"), true);
  assert.equal(isScalar(10n), true);
  assert.equal(isScalar({}), false);
  assert.equal(isEmpty("  "), true);
  assert.equal(isEmpty("  ", { trimString: false }), false);
  assert.equal(isEmpty([]), true);
  assert.equal(isEmpty(new Set()), true);
  assert.equal(isEmpty({}), true);
  assert.equal(hasValue({ id: 1 }), true);
  assert.equal(Value.hasValue("ready"), true);
});

test("list helpers normalize arrays, sets, maps, iterables, and split strings", () => {
  const source = ["a", "b"];
  const cloned = toList(source);

  assert.deepEqual(cloned, ["a", "b"]);
  assert.notEqual(cloned, source);
  assert.equal(toList(source, { clone: false }), source);
  assert.deepEqual(toList(new Set(["a", "b"])), ["a", "b"]);
  assert.deepEqual(toList(new Map([["id", 1]])), [["id", 1]]);
  assert.deepEqual(toList("alpha, beta", { split: true }), ["alpha", "beta"]);
  assert.deepEqual(toList("alpha|beta", { split: "|" }), ["alpha", "beta"]);
  assert.deepEqual(toList(null), []);
  assert.equal(firstItem(["first", "last"]), "first");
  assert.equal(lastItem(["first", "last"]), "last");
  assert.equal(Arr.firstItem([], "fallback"), "fallback");
});

test("object helpers read and copy records without mutating callers", () => {
  const source = {
    id: 7,
    profile: {
      name: "Ada",
      role: "engineer"
    },
    flags: ["active"]
  };

  const next = setPath(source, "profile.name", "Grace");
  const withArray = setPath(source, ["flags", 1], "reviewer");

  assert.equal(isPlainObject(source), true);
  assert.deepEqual(objectEntries({ id: 1 }), [["id", 1]]);
  assert.deepEqual(objectEntries(null), []);
  assert.equal(getPath(source, "profile.name"), "Ada");
  assert.equal(getPath(source, "profile.missing", "fallback"), "fallback");
  assert.equal(source.profile.name, "Ada");
  assert.equal(next.profile.name, "Grace");
  assert.notEqual(next.profile, source.profile);
  assert.deepEqual(withArray.flags, ["active", "reviewer"]);
  assert.deepEqual(source.flags, ["active"]);
  assert.deepEqual(pick(source, ["id", "missing"]), { id: 7 });
  assert.deepEqual(omit(source, ["flags"]), {
    id: 7,
    profile: {
      name: "Ada",
      role: "engineer"
    }
  });
  assert.equal(Obj.getPath(next, "profile.name"), "Grace");
});

test("string and number helpers keep rendering and query state predictable", () => {
  assert.equal(toText(null, "fallback"), "fallback");
  assert.equal(toText(42), "42");
  assert.equal(dasherize("backgroundColor"), "background-color");
  assert.equal(joinClassNames("one two", ["two", "three"], null, false), "one two three");
  assert.equal(Str.joinClassNames("a", "a", "b"), "a b");
  assert.equal(toNumber("4.5"), 4.5);
  assert.equal(toNumber("bad", 9), 9);
  assert.equal(toNumber(12, 0, { max: 10 }), 10);
  assert.equal(toInteger("12px", 1), 12);
  assert.equal(toInteger("bad", 1, { min: 3 }), 3);
  assert.equal(clampNumber(5, 10, 20), 10);
  assert.equal(Num.clampNumber(30, 10, 20), 20);
});

test("primitive grouped exports and root index exports expose the first-class surface", () => {
  assert.equal(Primitive.Value, Value);
  assert.equal(Primitive.Arr, Arr);
  assert.equal(Primitive.Obj, Obj);
  assert.equal(Primitive.Str, Str);
  assert.equal(Primitive.Num, Num);
  assert.equal(PrimitiveFromIndex.Arr, ArrFromIndex);
  assert.equal(ObjFromIndex.getPath({ ready: true }, "ready"), true);
  assert.equal(joinClassNamesFromIndex("one", "one two"), "one two");
});

test("primitive example normalizes payloads and query inputs", () => {
  assert.deepEqual(rawPayload.user.roles, "admin, editor");
  assert.deepEqual(normalizedPayload.user.roles, ["admin", "editor"]);
  assert.deepEqual(primitiveSummary.roles, ["admin", "editor"]);
  assert.equal(primitiveSummary.page, 2);
  assert.equal(primitiveSummary.perPage, 25);
  assert.equal(primitiveSummary.className, "resource-row is-active");
  assert.equal(primitiveSummary.hasProfile, true);

  assert.deepEqual(buildResourceQuery({
    page: "0",
    limit: "250",
    search: 42,
    filters: {
      status: "open",
      debug: true
    }
  }), {
    page: 1,
    perPage: 100,
    search: "42",
    filters: {
      status: "open"
    }
  });
});
