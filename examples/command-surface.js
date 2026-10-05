import {
  CommandAuthorizationDecisions,
  CommandReceiptOutcomes,
  CommandWorkItemStates,
  createCommandReceipt,
  createCommandWorkItem
} from "../src/index.js";

const workItem = createCommandWorkItem({
  commandId: "resource.update",
  workItemId: "work-12",
  label: "Update resource",
  description: "Apply reviewed changes to a resource.",
  state: CommandWorkItemStates.AWAITING_APPROVAL,
  schemas: {
    input: { id: "resource.update.input", version: "1" },
    output: { id: "resource.update.output", version: "1" }
  },
  correlationId: "correlation-7",
  inputDigest: "sha256:input",
  idempotencyKey: "resource-5:update:7",
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
  workItemId: workItem.workItemId,
  state: CommandWorkItemStates.SUCCEEDED,
  outcome: CommandReceiptOutcomes.SUCCEEDED,
  correlationId: workItem.correlationId,
  inputDigest: workItem.inputDigest,
  idempotencyKey: workItem.idempotencyKey,
  output: { id: "resource-5", updated: true },
  terminalAt: "2030-01-01T00:01:00Z",
  readback: "The reviewed update completed."
});

console.log(JSON.stringify({ workItem, receipt }, null, 2));
