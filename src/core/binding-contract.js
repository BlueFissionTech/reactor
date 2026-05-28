const DEFAULT_OWNERSHIP = {
  reactor: [],
  application: [],
  upstream: []
};

export function createBindingContract(definition = {}) {
  const source = definition && typeof definition === "object" ? definition : {};
  const contract = {
    name: source.name || "binding",
    description: source.description || "",
    inputs: normalizeEntries(source.inputs),
    outputs: normalizeEntries(source.outputs),
    events: normalizeEntries(source.events),
    states: normalizeEntries(source.states),
    lifecycle: normalizeEntries(source.lifecycle),
    selectors: normalizeEntries(source.selectors),
    ownership: normalizeOwnership(source.ownership),
    meta: source.meta && typeof source.meta === "object" ? { ...source.meta } : {}
  };

  return {
    ...contract,
    input(name) {
      return findEntry(contract.inputs, name);
    },
    output(name) {
      return findEntry(contract.outputs, name);
    },
    event(name) {
      return findEntry(contract.events, name);
    },
    state(name) {
      return findEntry(contract.states, name);
    },
    lifecycleStep(name) {
      return findEntry(contract.lifecycle, name);
    },
    describe() {
      return cloneContract(contract);
    },
    toJSON() {
      return cloneContract(contract);
    }
  };
}

export function createBindingManifest(contracts = []) {
  const items = contracts.map((contract) => {
    return typeof contract?.describe === "function"
      ? contract
      : createBindingContract(contract);
  });

  return {
    list() {
      return items.map((contract) => contract.describe());
    },
    get(name) {
      return items.find((contract) => contract.name === name) || null;
    },
    names() {
      return items.map((contract) => contract.name);
    },
    describe() {
      return {
        contracts: items.map((contract) => contract.describe())
      };
    },
    toJSON() {
      return this.describe();
    }
  };
}

function normalizeEntries(entries = []) {
  if (Array.isArray(entries)) {
    return entries.map(normalizeEntry);
  }

  if (entries && typeof entries === "object") {
    return Object.entries(entries).map(([name, value]) => normalizeEntry({ ...coerceEntryValue(value), name }));
  }

  return [];
}

function normalizeEntry(entry) {
  if (typeof entry === "string") {
    return {
      name: entry,
      type: "unknown",
      required: false,
      description: ""
    };
  }

  const normalized = {
    name: entry?.name || "",
    type: entry?.type || "unknown",
    required: Boolean(entry?.required),
    description: entry?.description || ""
  };

  for (const [key, value] of Object.entries(entry || {})) {
    if (!(key in normalized)) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function coerceEntryValue(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return {
      type: value
    };
  }

  return {
    description: String(value ?? "")
  };
}

function normalizeOwnership(ownership = {}) {
  const source = ownership && typeof ownership === "object" ? ownership : {};
  const normalized = { ...DEFAULT_OWNERSHIP };

  for (const key of Object.keys(normalized)) {
    normalized[key] = normalizeStringList(source[key]);
  }

  return normalized;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (value == null || value === "") {
    return [];
  }

  return [String(value)];
}

function findEntry(entries, name) {
  return entries.find((entry) => entry.name === name) || null;
}

function cloneContract(contract) {
  return {
    name: contract.name,
    description: contract.description,
    inputs: contract.inputs.map((entry) => ({ ...entry })),
    outputs: contract.outputs.map((entry) => ({ ...entry })),
    events: contract.events.map((entry) => ({ ...entry })),
    states: contract.states.map((entry) => ({ ...entry })),
    lifecycle: contract.lifecycle.map((entry) => ({ ...entry })),
    selectors: contract.selectors.map((entry) => ({ ...entry })),
    ownership: {
      reactor: [...contract.ownership.reactor],
      application: [...contract.ownership.application],
      upstream: [...contract.ownership.upstream]
    },
    meta: { ...contract.meta }
  };
}
