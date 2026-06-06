const DEFAULT_OWNERSHIP = {
  reactor: [],
  host: [],
  upstream: []
};

export const SurfaceFamilies = {
  MEDIA: "media",
  DIALOGUE: "dialogue",
  SCENE: "scene",
  OVERLAY: "overlay",
  PANEL: "panel",
  NOTIFICATION: "notification",
  CHOICE: "choice",
  COMMAND: "command"
};

export const SurfaceUpdateSources = {
  SCRIPTED: "scripted",
  REACTIVE: "reactive",
  SYSTEM: "system"
};

export function createSurfaceContract(definition = {}) {
  const source = definition && typeof definition === "object" ? definition : {};
  const contract = {
    name: source.name || "surface",
    family: source.family || SurfaceFamilies.PANEL,
    description: source.description || "",
    components: normalizeComponents(source.components),
    states: normalizeEntries(source.states),
    events: normalizeEntries(source.events),
    bindings: normalizeEntries(source.bindings),
    updateRules: normalizeUpdateRules(source.updateRules),
    pulses: normalizePulses(source.pulses),
    ownership: normalizeOwnership(source.ownership),
    meta: source.meta && typeof source.meta === "object" ? { ...source.meta } : {}
  };

  return {
    ...contract,
    component(name) {
      return findByName(contract.components, name);
    },
    state(name) {
      return findByName(contract.states, name);
    },
    event(name) {
      return findByName(contract.events, name);
    },
    binding(name) {
      return findByName(contract.bindings, name);
    },
    updateRule(name) {
      return findByName(contract.updateRules, name);
    },
    pulse(name) {
      return findByName(contract.pulses, name);
    },
    describe() {
      return cloneContract(contract);
    },
    toJSON() {
      return cloneContract(contract);
    }
  };
}

export function createSurfaceManifest(contracts = []) {
  const items = contracts.map((contract) => {
    return typeof contract?.describe === "function"
      ? contract
      : createSurfaceContract(contract);
  });

  return {
    list() {
      return items.map((contract) => contract.describe());
    },
    get(name) {
      return items.find((contract) => contract.name === name) || null;
    },
    families() {
      return [...new Set(items.map((contract) => contract.family))];
    },
    describe() {
      return {
        surfaces: items.map((contract) => contract.describe())
      };
    },
    toJSON() {
      return this.describe();
    }
  };
}

export function createSurfacePulse(definition = {}) {
  const source = definition && typeof definition === "object" ? definition : {};
  const updateSource = source.source || SurfaceUpdateSources.REACTIVE;

  return {
    name: source.name || source.action || "pulse",
    surface: source.surface || "",
    source: updateSource,
    action: source.action || "update",
    target: source.target || "",
    payload: cloneValue(source.payload ?? {}),
    deterministic: source.deterministic ?? updateSource === SurfaceUpdateSources.SCRIPTED,
    timing: normalizeTiming(source.timing),
    meta: source.meta && typeof source.meta === "object" ? { ...source.meta } : {}
  };
}

function normalizeComponents(components = []) {
  if (Array.isArray(components)) {
    return components.map(normalizeComponent);
  }

  if (components && typeof components === "object") {
    return Object.entries(components).map(([name, value]) => normalizeComponent({
      ...coerceEntryValue(value),
      name
    }));
  }

  return [];
}

function normalizeComponent(component = {}) {
  const normalized = {
    name: component?.name || "",
    family: component?.family || "",
    responsibility: component?.responsibility || "",
    states: normalizeEntries(component?.states),
    events: normalizeEntries(component?.events),
    bindings: normalizeEntries(component?.bindings)
  };

  for (const [key, value] of Object.entries(component || {})) {
    if (!(key in normalized)) {
      normalized[key] = value;
    }
  }

  return normalized;
}

function normalizeEntries(entries = []) {
  if (Array.isArray(entries)) {
    return entries.map(normalizeEntry);
  }

  if (entries && typeof entries === "object") {
    return Object.entries(entries).map(([name, value]) => normalizeEntry({
      ...coerceEntryValue(value),
      name
    }));
  }

  return [];
}

function normalizeEntry(entry) {
  if (typeof entry === "string") {
    return {
      name: entry,
      type: "unknown",
      description: ""
    };
  }

  return {
    name: entry?.name || "",
    type: entry?.type || "unknown",
    description: entry?.description || "",
    ...copyExtra(entry, ["name", "type", "description"])
  };
}

function normalizeUpdateRules(rules = []) {
  return normalizeEntries(rules).map((rule) => ({
    source: SurfaceUpdateSources.REACTIVE,
    trigger: "",
    deterministic: false,
    lane: "default",
    priority: 0,
    ...rule
  }));
}

function normalizePulses(pulses = []) {
  if (!Array.isArray(pulses)) {
    return [];
  }

  return pulses.map(createSurfacePulse);
}

function normalizeTiming(timing = {}) {
  const source = timing && typeof timing === "object" ? timing : {};

  return {
    delay: Number(source.delay || 0),
    duration: Number(source.duration || 0),
    lane: source.lane || "default"
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

function copyExtra(entry, knownKeys) {
  const output = {};

  for (const [key, value] of Object.entries(entry || {})) {
    if (!knownKeys.includes(key)) {
      output[key] = value;
    }
  }

  return output;
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

function findByName(items, name) {
  return items.find((item) => item.name === name) || null;
}

function cloneContract(contract) {
  return {
    name: contract.name,
    family: contract.family,
    description: contract.description,
    components: cloneValue(contract.components),
    states: contract.states.map((entry) => ({ ...entry })),
    events: contract.events.map((entry) => ({ ...entry })),
    bindings: contract.bindings.map((entry) => ({ ...entry })),
    updateRules: contract.updateRules.map((entry) => ({ ...entry })),
    pulses: contract.pulses.map((pulse) => ({
      ...pulse,
      payload: cloneValue(pulse.payload),
      timing: { ...pulse.timing },
      meta: { ...pulse.meta }
    })),
    ownership: {
      reactor: [...contract.ownership.reactor],
      host: [...contract.ownership.host],
      upstream: [...contract.ownership.upstream]
    },
    meta: { ...contract.meta }
  };
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }

  return value;
}
