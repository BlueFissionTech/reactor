export const COMMAND_WORK_ITEM_CONTRACT = "reactor.command-work-item/1";
export const COMMAND_RECEIPT_CONTRACT = "reactor.command-receipt/1";

export const CommandWorkItemStates = Object.freeze({
  QUEUED: "queued",
  AWAITING_APPROVAL: "awaiting_approval",
  BLOCKED: "blocked",
  RUNNING: "running",
  CANCELLING: "cancelling",
  CANCELLED: "cancelled",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  RECOVERABLE: "recoverable"
});

export const CommandAuthorizationDecisions = Object.freeze({
  UNKNOWN: "unknown",
  ALLOWED: "allowed",
  DENIED: "denied",
  AWAITING_APPROVAL: "awaiting_approval",
  STALE: "stale"
});

export const CommandReceiptOutcomes = Object.freeze({
  UNKNOWN: "unknown",
  SUCCEEDED: "succeeded",
  DENIED: "denied",
  DUPLICATE: "duplicate",
  STALE_APPROVAL: "stale_approval",
  CRASHED: "crashed",
  BUDGET_EXHAUSTED: "budget_exhausted",
  CANCELLED: "cancelled",
  RECOVERABLE: "recoverable"
});

export function createCommandWorkItem(definition = {}) {
  const source = asObject(definition);
  const item = {
    contractVersion: source.contractVersion || COMMAND_WORK_ITEM_CONTRACT,
    commandId: String(source.commandId || ""),
    workItemId: String(source.workItemId || ""),
    label: String(source.label || ""),
    description: String(source.description || ""),
    state: normalizeValue(source.state, Object.values(CommandWorkItemStates), CommandWorkItemStates.QUEUED),
    schemas: {
      input: normalizeSchemaReference(source.schemas?.input || source.inputSchema),
      output: normalizeSchemaReference(source.schemas?.output || source.outputSchema)
    },
    subject: {
      actor: normalizeReference(source.subject?.actor || source.actor),
      tenant: normalizeReference(source.subject?.tenant || source.tenant),
      delegation: normalizeReference(source.subject?.delegation || source.delegation)
    },
    correlationId: String(source.correlationId || ""),
    inputDigest: String(source.inputDigest || ""),
    idempotencyKey: String(source.idempotencyKey || ""),
    authorization: normalizeAuthorization(source.authorization),
    controls: normalizeControls(source.controls),
    progress: normalizeProgress(source.progress),
    explanation: normalizeExplanation(source.explanation),
    meta: cloneObject(source.meta)
  };

  return createDescriptor(item);
}

export function createCommandReceipt(definition = {}) {
  const source = asObject(definition);
  const receipt = {
    contractVersion: source.contractVersion || COMMAND_RECEIPT_CONTRACT,
    commandId: String(source.commandId || ""),
    workItemId: String(source.workItemId || ""),
    state: normalizeValue(source.state, terminalStates(), CommandWorkItemStates.FAILED),
    outcome: normalizeValue(source.outcome, Object.values(CommandReceiptOutcomes), CommandReceiptOutcomes.UNKNOWN),
    correlationId: String(source.correlationId || ""),
    inputDigest: String(source.inputDigest || ""),
    idempotencyKey: String(source.idempotencyKey || ""),
    output: cloneValue(source.output ?? null),
    error: normalizeError(source.error),
    diagnostics: normalizeList(source.diagnostics),
    evidenceRefs: normalizeStringList(source.evidenceRefs || source.evidence_refs),
    cancellation: {
      requested: Boolean(source.cancellation?.requested),
      accepted: Boolean(source.cancellation?.accepted),
      reason: String(source.cancellation?.reason || "")
    },
    recovery: {
      available: Boolean(source.recovery?.available),
      reference: String(source.recovery?.reference || ""),
      reason: String(source.recovery?.reason || "")
    },
    terminalAt: String(source.terminalAt || ""),
    readback: normalizeExplanation(source.readback),
    meta: cloneObject(source.meta)
  };

  return createDescriptor(receipt);
}

function normalizeAuthorization(value = {}) {
  const source = asObject(value);

  return {
    decision: normalizeValue(source.decision, Object.values(CommandAuthorizationDecisions), CommandAuthorizationDecisions.UNKNOWN),
    reason: String(source.reason || ""),
    scope: normalizeStringList(source.scope),
    approvalId: String(source.approvalId || ""),
    expiresAt: String(source.expiresAt || "")
  };
}

function normalizeControls(value = {}) {
  const source = asObject(value);

  return Object.fromEntries(["approve", "reject", "cancel", "recover", "retry"].map((name) => {
    const control = source[name];
    const normalized = typeof control === "boolean" ? { available: control } : asObject(control);

    return [name, {
      available: Boolean(normalized.available),
      reason: String(normalized.reason || "")
    }];
  }));
}

function normalizeProgress(value = {}) {
  const source = asObject(value);
  const current = finiteNumber(source.current, 0);
  const total = finiteNumber(source.total, 0);

  return {
    current,
    total,
    ratio: total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0,
    message: String(source.message || "")
  };
}

function normalizeSchemaReference(value = {}) {
  const source = typeof value === "string" ? { id: value } : asObject(value);

  return {
    id: String(source.id || ""),
    version: String(source.version || ""),
    mediaType: String(source.mediaType || "application/schema+json")
  };
}

function normalizeReference(value = {}) {
  const source = typeof value === "string" ? { id: value } : asObject(value);

  return {
    id: String(source.id || ""),
    type: String(source.type || ""),
    display: String(source.display || "")
  };
}

function normalizeExplanation(value = {}) {
  const source = typeof value === "string" ? { summary: value } : asObject(value);

  return {
    code: String(source.code || ""),
    summary: String(source.summary || ""),
    details: normalizeStringList(source.details)
  };
}

function normalizeError(value) {
  if (!value) {
    return null;
  }

  const source = typeof value === "string" ? { message: value } : asObject(value);

  return {
    code: String(source.code || ""),
    message: String(source.message || ""),
    retryable: Boolean(source.retryable),
    details: cloneObject(source.details)
  };
}

function createDescriptor(value) {
  return {
    ...value,
    describe() {
      return cloneValue(value);
    },
    toJSON() {
      return cloneValue(value);
    }
  };
}

function terminalStates() {
  return [
    CommandWorkItemStates.CANCELLED,
    CommandWorkItemStates.SUCCEEDED,
    CommandWorkItemStates.FAILED,
    CommandWorkItemStates.RECOVERABLE
  ];
}

function normalizeValue(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map(cloneValue) : [];
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map(String);
  if (value == null || value === "") return [];
  return [String(value)];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cloneObject(value) {
  return cloneValue(asObject(value));
}

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }
  return value;
}
