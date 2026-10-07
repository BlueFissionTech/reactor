import {
  CommandAuthorizationDecisions,
  CommandReceiptOutcomes,
  CommandWorkItemStates,
  createCommandReceipt,
  createCommandWorkItem
} from "../src/index.js";

const workItem = createCommandWorkItem({
  commandId: "resource.update",
  commandVersion: "1",
  workItemId: "work-12",
  label: "Update resource",
  description: "Apply reviewed changes to a resource.",
  state: CommandWorkItemStates.AWAITING_APPROVAL,
  schemas: {
    input: { name: "request", id: "resource.update.input", version: "1", cardinality: "one" },
    output: { name: "resource", id: "resource.update.output", version: "1", cardinality: "one" }
  },
  correlationId: "correlation-7",
  inputDigest: "sha256:input",
  inputPayloadRef: "payload:resource-5:update",
  idempotencyKey: "resource-5:update:7",
  requestedAt: "2030-01-01T00:00:00Z",
  deadlineAt: "2030-01-01T00:05:00Z",
  authorization: {
    decision: CommandAuthorizationDecisions.AWAITING_APPROVAL,
    scope: ["resource:write"],
    expiresAt: "2030-01-01T00:00:00Z"
  },
  controls: { approve: true, reject: true, cancel: true },
  explanation: "The host requires approval before execution."
});

const receipt = createCommandReceipt({
  commandId: workItem.commandId,
  commandVersion: workItem.commandVersion,
  workItemId: workItem.workItemId,
  state: CommandWorkItemStates.SUCCEEDED,
  outcome: CommandReceiptOutcomes.SUCCEEDED,
  effectStatus: "applied",
  observedAt: "2030-01-01T00:01:00Z",
  authorityCheck: {
    tenantId: "tenant-2",
    status: "current",
    checkedAt: "2030-01-01T00:00:30Z"
  },
  correlationId: workItem.correlationId,
  inputDigest: workItem.inputDigest,
  idempotencyKey: workItem.idempotencyKey,
  output: { id: "resource-5", updated: true },
  outcomeSummary: "The reviewed update completed.",
  terminalAt: "2030-01-01T00:01:00Z",
  readback: "The reviewed update completed."
});

console.log(JSON.stringify({ workItem, receipt }, null, 2));
