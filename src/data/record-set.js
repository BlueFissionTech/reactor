import { BehavioralObject, Events, States } from "../core/behavior.js";

export class RecordSet extends BehavioralObject {
  constructor(records = [], options = {}) {
    super();
    this.records = Array.isArray(records) ? [...records] : [];
    this.index = options.index ?? 0;
    this.page = options.page ?? 1;
    this.perPage = options.perPage ?? 50;
    this.fetcher = options.fetcher;
    this.idKey = options.idKey ?? "id";
    this.total = this.records.length;
    this.enter(States.IDLE);
  }

  async fetch(page = this.page, perPage = this.perPage) {
    if (typeof this.fetcher !== "function") {
      return this.list();
    }

    this.enter(States.READING, { page, perPage });

    try {
      const result = await this.fetcher({ page, perPage, recordSet: this });
      const list = Array.isArray(result)
        ? result
        : result?.list ?? result?.data ?? [];

      this.records = Array.isArray(list) ? [...list] : [];
      this.page = page;
      this.perPage = perPage;
      this.total = result?.total ?? this.records.length;
      this.leave(States.READING);
      this.enter(States.SYNCED);
      this.trigger(Events.RECEIVED, this.snapshot());
      return this.list();
    } catch (error) {
      this.leave(States.READING);
      this.enter(States.ERROR);
      this.trigger(Events.ERROR, error);
      throw error;
    }
  }

  add(record) {
    this.records.push(record);
    this.total = this.records.length;
    this.trigger(Events.ITEM_ADDED, record);
    this.trigger(Events.CHANGE, this.snapshot());
    return record;
  }

  remove(idOrIndex = this.index) {
    const index = this.resolveIndex(idOrIndex);
    if (index < 0) {
      return null;
    }

    const [removed] = this.records.splice(index, 1);
    this.total = this.records.length;
    this.index = Math.max(0, Math.min(this.index, this.records.length - 1));
    this.trigger(Events.DELETED, removed);
    this.trigger(Events.CHANGE, this.snapshot());
    return removed;
  }

  update(record, matcher = null) {
    const index = matcher == null ? this.resolveIndex(this.index) : this.resolveIndex(matcher);
    if (index < 0) {
      return null;
    }

    this.records[index] = {
      ...this.records[index],
      ...record
    };
    this.trigger(Events.UPDATED, this.records[index]);
    this.trigger(Events.CHANGE, this.snapshot());
    return this.records[index];
  }

  get(idOrIndex = this.index) {
    const index = this.resolveIndex(idOrIndex);
    return index >= 0 ? this.records[index] : null;
  }

  current() {
    return this.get(this.index);
  }

  select(idOrIndex) {
    const index = this.resolveIndex(idOrIndex);
    if (index >= 0) {
      this.index = index;
      this.trigger(Events.CHANGE, {
        type: "select",
        index,
        record: this.current()
      });
    }

    return this.current();
  }

  list() {
    return [...this.records];
  }

  snapshot() {
    return {
      records: this.list(),
      current: this.current(),
      index: this.index,
      total: this.total,
      page: this.page,
      perPage: this.perPage
    };
  }

  resolveIndex(idOrIndex) {
    if (typeof idOrIndex === "number" && idOrIndex >= 0 && idOrIndex < this.records.length) {
      return idOrIndex;
    }

    return this.records.findIndex((record) => record?.[this.idKey] === idOrIndex);
  }
}

export function createRecordSet(records = [], options = {}) {
  return new RecordSet(records, options);
}
