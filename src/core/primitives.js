export function isNil(value) {
  return value == null;
}

export function isScalar(value) {
  return ["string", "number", "boolean", "bigint"].includes(typeof value);
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isEmpty(value, options = {}) {
  if (isNil(value)) {
    return true;
  }

  if (typeof value === "string") {
    return options.trimString === false ? value.length === 0 : value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
}

export function hasValue(value, options = {}) {
  return !isEmpty(value, options);
}

export function toText(value, fallback = "") {
  return isNil(value) ? fallback : String(value);
}

export function toNumber(value, fallback = 0, options = {}) {
  const numeric = typeof value === "number" ? value : Number(value);
  const resolved = Number.isFinite(numeric) ? numeric : fallback;
  return clampNumber(resolved, options.min, options.max);
}

export function toInteger(value, fallback = 0, options = {}) {
  const numeric = typeof value === "number"
    ? Math.trunc(value)
    : Number.parseInt(value, 10);
  const resolved = Number.isFinite(numeric) ? numeric : fallback;
  return clampNumber(resolved, options.min, options.max);
}

export function clampNumber(value, min, max) {
  let numeric = Number.isFinite(Number(value)) ? Number(value) : 0;

  if (Number.isFinite(Number(min))) {
    numeric = Math.max(Number(min), numeric);
  }

  if (Number.isFinite(Number(max))) {
    numeric = Math.min(Number(max), numeric);
  }

  return numeric;
}

export function toList(value, options = {}) {
  if (isNil(value)) {
    return [];
  }

  if (Array.isArray(value)) {
    return options.clone === false ? value : [...value];
  }

  if (typeof value === "string" && options.split) {
    const separator = options.split === true ? "," : options.split;
    return value.split(separator)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (value instanceof Set) {
    return Array.from(value.values());
  }

  if (value instanceof Map) {
    return Array.from(value.entries());
  }

  if (typeof value !== "string" && typeof value?.[Symbol.iterator] === "function") {
    return Array.from(value);
  }

  return [value];
}

export function firstItem(value, fallback = null) {
  const list = toList(value);
  return list.length > 0 ? list[0] : fallback;
}

export function lastItem(value, fallback = null) {
  const list = toList(value);
  return list.length > 0 ? list[list.length - 1] : fallback;
}

export function objectEntries(value) {
  return isPlainObject(value) ? Object.entries(value) : [];
}

export function getPath(source, path, fallback = undefined) {
  const segments = normalizePath(path);
  let cursor = source;

  for (const segment of segments) {
    if (isNil(cursor) || !(segment in Object(cursor))) {
      return fallback;
    }

    cursor = cursor[segment];
  }

  return isNil(cursor) ? fallback : cursor;
}

export function setPath(source, path, value) {
  const segments = normalizePath(path);

  if (segments.length === 0) {
    return value;
  }

  const root = cloneContainer(source, segments[0]);
  let cursor = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const key = segments[index];
    const nextKey = segments[index + 1];
    const nextValue = cursor[key];
    const cloned = cloneContainer(nextValue, nextKey);
    cursor[key] = cloned;
    cursor = cloned;
  }

  cursor[segments[segments.length - 1]] = value;
  return root;
}

export function pick(source, keys = []) {
  const output = {};

  for (const key of toList(keys)) {
    if (source != null && Object.prototype.hasOwnProperty.call(Object(source), key)) {
      output[key] = source[key];
    }
  }

  return output;
}

export function omit(source, keys = []) {
  const omitted = new Set(toList(keys).map(String));
  const output = {};

  for (const [key, value] of objectEntries(source)) {
    if (!omitted.has(String(key))) {
      output[key] = value;
    }
  }

  return output;
}

export function dasherize(value) {
  return toText(value).replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

export function joinClassNames(...classes) {
  return classes
    .flatMap((className) => className === false || isNil(className) ? [] : toList(className, { split: /\s+/ }))
    .map((className) => toText(className).trim())
    .filter(Boolean)
    .filter((className, index, list) => list.indexOf(className) === index)
    .join(" ");
}

export const Value = Object.freeze({
  isNil,
  isScalar,
  isEmpty,
  hasValue
});

export const Arr = Object.freeze({
  toList,
  firstItem,
  lastItem
});

export const Obj = Object.freeze({
  isPlainObject,
  objectEntries,
  getPath,
  setPath,
  pick,
  omit
});

export const Str = Object.freeze({
  toText,
  dasherize,
  joinClassNames
});

export const Num = Object.freeze({
  toNumber,
  toInteger,
  clampNumber
});

export const Primitive = Object.freeze({
  Value,
  Arr,
  Obj,
  Str,
  Num
});

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path.map((segment) => String(segment)).filter((segment) => segment.length > 0);
  }

  return toText(path)
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function cloneContainer(value, nextKey) {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (isPlainObject(value)) {
    return { ...value };
  }

  return isArrayIndex(nextKey) ? [] : {};
}

function isArrayIndex(value) {
  return String(Number.parseInt(value, 10)) === String(value);
}
