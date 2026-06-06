import test from "node:test";
import assert from "node:assert/strict";

import { computed, createSignal, isSignal } from "../src/core/signals.js";

test("signals publish values immediately and unsubscribe cleanly", () => {
  const signal = createSignal("idle");
  const values = [];
  const unsubscribe = signal.subscribe((value) => {
    values.push(value);
  });

  signal.value = "busy";
  signal.publish("manual");
  unsubscribe();
  signal.value = "done";

  assert.equal(isSignal(signal), true);
  assert.equal(isSignal({ value: "idle" }), false);
  assert.deepEqual(values, ["idle", "busy", "manual"]);
});

test("computed signals update from signal dependencies only", () => {
  const first = createSignal(1);
  const second = createSignal(2);
  const total = computed(() => first.value + second.value, [
    first,
    { value: 100 },
    second
  ]);
  const values = [];

  total.subscribe((value) => {
    values.push(value);
  });

  first.value = 3;
  second.value = 4;

  assert.equal(total.value, 7);
  assert.deepEqual(values, [3, 5, 7]);
});
