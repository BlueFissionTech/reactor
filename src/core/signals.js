export class Signal {
  constructor(value) {
    this._value = value;
    this._subscribers = new Set();
  }

  get value() {
    return this._value;
  }

  set value(nextValue) {
    this._value = nextValue;
    this.publish(nextValue);
  }

  subscribe(callback, options = {}) {
    this._subscribers.add(callback);

    if (options.immediate !== false) {
      callback(this._value);
    }

    return () => {
      this._subscribers.delete(callback);
    };
  }

  publish(value = this._value) {
    for (const subscriber of this._subscribers) {
      subscriber(value);
    }
  }
}

export function createSignal(value) {
  return new Signal(value);
}

export function isSignal(value) {
  return value instanceof Signal;
}

export function computed(getter, dependencies = []) {
  const output = createSignal(getter());

  for (const dependency of dependencies) {
    if (!isSignal(dependency)) {
      continue;
    }

    dependency.subscribe(() => {
      output.value = getter();
    }, { immediate: false });
  }

  return output;
}
