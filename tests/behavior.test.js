import test from "node:test";
import assert from "node:assert/strict";

import { Events, States, createBehavioralObject } from "../src/core/behavior.js";

test("behavioral objects expose DevElation-style events, state, and fields", () => {
  const object = createBehavioralObject({ name: "Initial" });
  const changes = [];
  const actions = [];

  object.on(Events.CHANGE, (payload) => changes.push(payload));
  object.on(Events.ACTION_PERFORMED, (payload) => actions.push(payload));

  object.field("name", "Updated");
  object.enter(States.BUSY, { source: "test" });
  object.perform(Events.SAVED, { id: 9 });

  assert.equal(object.field("name"), "Updated");
  assert.equal(object.is(States.DRAFT), true);
  assert.equal(object.is(States.BUSY), true);
  assert.deepEqual(object.snapshot(), { name: "Updated" });
  assert.deepEqual(changes.map((change) => change.type), ["field", "state:enter"]);
  assert.deepEqual(actions, [{ eventName: Events.SAVED, payload: { id: 9 } }]);
});

test("behavioral objects can echo selected events from another object", () => {
  const source = createBehavioralObject();
  const target = createBehavioralObject();
  const received = [];
  const dispose = target.echo(source, Events.MESSAGE);

  target.on(Events.MESSAGE, (payload) => received.push(payload));

  source.trigger(Events.MESSAGE, { text: "synced" });
  dispose();
  source.trigger(Events.MESSAGE, { text: "ignored" });

  assert.deepEqual(received, [{ text: "synced" }]);
});
