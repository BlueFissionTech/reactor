import { createSignal, isSignal } from "./signals.js";

export const Events = {
  LOAD: "OnLoad",
  CHANGE: "OnChange",
  MESSAGE: "OnMessageUpdate",
  CLEAR_DATA: "OnClearData",
  READ: "OnRead",
  CREATED: "OnCreated",
  UPDATED: "OnUpdated",
  SAVED: "OnSaved",
  DELETED: "OnDeleted",
  SENT: "OnSent",
  RECEIVED: "OnReceived",
  CONNECTED: "OnConnected",
  DISCONNECTED: "OnDisconnected",
  ERROR: "OnError",
  EXCEPTION: "OnException",
  ITEM_ADDED: "OnItemAdded",
  ACTION_PERFORMED: "OnActionPerformed"
};

export const States = {
  DRAFT: "IsDraft",
  IDLE: "IsIdle",
  BUSY: "IsBusy",
  LOADING: "IsLoading",
  SAVING: "IsSaving",
  READING: "IsReading",
  CONNECTING: "IsConnecting",
  CONNECTED: "IsConnected",
  DISCONNECTED: "IsDisconnected",
  OUT_OF_SYNC: "IsOutOfSync",
  SYNCED: "IsSynced",
  ERROR: "IsErrorState"
};

export class BehavioralObject {
  constructor(initialData = {}) {
    this._handlers = new Map();
    this._states = new Set([States.DRAFT]);
    this._signals = new Map();
    this.assign(initialData, { silent: true });
    this.trigger(Events.LOAD, this.snapshot());
  }

  when(eventName, handler) {
    return this.on(eventName, handler);
  }

  on(eventName, handler) {
    if (!this._handlers.has(eventName)) {
      this._handlers.set(eventName, new Set());
    }

    this._handlers.get(eventName).add(handler);

    return () => {
      this.off(eventName, handler);
    };
  }

  off(eventName, handler) {
    this._handlers.get(eventName)?.delete(handler);
    return this;
  }

  trigger(eventName, payload) {
    this._handlers.get(eventName)?.forEach((handler) => {
      handler(payload, this);
    });
    return this;
  }

  perform(eventName, payload) {
    this.trigger(Events.ACTION_PERFORMED, { eventName, payload });
    return this.trigger(eventName, payload);
  }

  enter(stateName, payload) {
    this._states.add(stateName);
    this.trigger(Events.CHANGE, {
      type: "state:enter",
      state: stateName,
      payload
    });
    return this;
  }

  leave(stateName, payload) {
    this._states.delete(stateName);
    this.trigger(Events.CHANGE, {
      type: "state:leave",
      state: stateName,
      payload
    });
    return this;
  }

  is(stateName) {
    return this._states.has(stateName);
  }

  signal(field) {
    if (!this._signals.has(field)) {
      this._signals.set(field, createSignal(null));
    }

    return this._signals.get(field);
  }

  field(field, value) {
    const signal = this.signal(field);

    if (arguments.length === 1) {
      return signal.value;
    }

    signal.value = value;
    this.trigger(Events.CHANGE, {
      type: "field",
      field,
      value
    });

    return this;
  }

  assign(data, options = {}) {
    Object.entries(data || {}).forEach(([field, value]) => {
      const signal = this.signal(field);
      signal.value = isSignal(value) ? value.value : value;
    });

    if (!options.silent) {
      this.trigger(Events.CHANGE, {
        type: "assign",
        data: this.snapshot()
      });
    }

    return this;
  }

  clear() {
    this._signals.forEach((signal) => {
      signal.value = null;
    });

    this.trigger(Events.CLEAR_DATA, this.snapshot());
    return this;
  }

  echo(other, eventNames = []) {
    const list = Array.isArray(eventNames) ? eventNames : [eventNames];
    const disposers = list.map((eventName) => other.on(eventName, (payload) => {
      this.trigger(eventName, payload);
    }));

    return () => {
      disposers.forEach((dispose) => dispose());
    };
  }

  snapshot() {
    const output = {};
    this._signals.forEach((signal, field) => {
      output[field] = signal.value;
    });
    return output;
  }

  toJSON() {
    return this.snapshot();
  }
}

export function createBehavioralObject(initialData = {}) {
  return new BehavioralObject(initialData);
}
