# Primitive Helpers

Reactor primitive helpers are the shared frontend vocabulary for common value, list, object, string, and number normalization.

They are intentionally small. They do not replace DevElation primitives on the PHP side, and they do not create a browser-side clone of those classes. They give JavaScript code the same practical habits:

- normalize unknown inputs before branching
- prefer predictable return shapes
- avoid mutating caller-owned objects
- keep reusable coercion logic out of feature modules

## Imports

Use named helpers when a module only needs one behavior:

```js
import { getPath, joinClassNames, toList, toNumber } from "@bluefission/reactor/primitives";
```

The root package export also exposes the same helpers:

```js
import { Obj, Arr, Str, Num, Primitive } from "@bluefission/reactor";
```

The grouped exports are convenience namespaces:

- `Value`
- `Arr`
- `Obj`
- `Str`
- `Num`
- `Primitive`

## Value Helpers

- `isNil(value)` checks for `null` or `undefined`.
- `isScalar(value)` checks for string, number, boolean, or bigint values.
- `isEmpty(value, options?)` treats nil values, empty strings, empty arrays, empty maps, empty sets, and empty plain objects as empty.
- `hasValue(value, options?)` is the inverse of `isEmpty(...)`.

Strings are trimmed by default for emptiness checks. Pass `{ trimString: false }` when whitespace should count.

## Array/List Helpers

- `toList(value, options?)` returns a predictable array.
- `firstItem(value, fallback?)` returns the first normalized item.
- `lastItem(value, fallback?)` returns the last normalized item.

`toList(...)` accepts arrays, scalars, sets, maps, and iterable objects. Arrays are cloned by default; pass `{ clone: false }` only when preserving reference identity is intentional.

String splitting is opt-in:

```js
const tags = toList("alpha, beta", { split: true });
```

## Object Helpers

- `isPlainObject(value)` checks for object records while excluding arrays.
- `objectEntries(value)` returns safe object entries or an empty array.
- `getPath(source, path, fallback?)` reads a dotted path or segment array.
- `setPath(source, path, value)` returns a copied object or array with the nested value set.
- `pick(source, keys)` copies selected top-level keys.
- `omit(source, keys)` copies all top-level keys except the provided keys.

`setPath(...)` is mutation-free:

```js
const source = { profile: { name: "Ada" } };
const next = setPath(source, "profile.name", "Grace");

source.profile.name; // "Ada"
next.profile.name; // "Grace"
```

## String Helpers

- `toText(value, fallback?)` converts nil values to a fallback and all other values to strings.
- `dasherize(value)` converts camel-case characters to dash-case.
- `joinClassNames(...classes)` flattens class values, removes blanks, and deduplicates names.

## Number Helpers

- `toNumber(value, fallback?, options?)` converts finite numeric input and supports `{ min, max }`.
- `toInteger(value, fallback?, options?)` parses integer input and supports `{ min, max }`.
- `clampNumber(value, min?, max?)` applies numeric bounds.

These helpers return predictable numbers instead of leaking `NaN` into render, query, or state calculations.

## When To Use Them

Use primitive helpers when code is normalizing inputs from:

- service responses
- parsed or rendered output envelopes
- DOM datasets and form fields
- resource query state
- module configuration
- event payloads

Do not use them to hide unclear domain behavior. If a field needs business validation, keep that rule close to the feature that owns it.
