import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMAND_RECEIPT_CONTRACT,
  COMMAND_WORK_ITEM_CONTRACT,
  CommandAuthorizationDecisions,
  CommandReceiptOutcomes,
  CommandWorkItemStates,
  createCommandReceipt,
  createCommandWorkItem
} from "../src/ui/command-surface.js";

test("command work items preserve stable identity, schema, authorization, and control metadata", () => {
  const item = createCommandWorkItem({
    commandId: "resource.update",
    commandVersion: "1",
    workItemId: "work-12",
    implementationRefs: ["http:resource.update"],
    state: CommandWorkItemStates.AWAITING_APPROVAL,
    schemas: {
      input: { name: "request", schemaRef: "resource.update.input", version: "1", cardinality: "one" },
      output: { name: "resource", schemaRef: "resource.update.output", version: "1", cardinality: "one" }
    },
    subject: {
      actor: { id: "operator-4", type: "human", display: "Operator" },
      principal: "principal-4",
      tenant: "tenant-2",
      delegation: "delegation-8"
    },
    correlationId: "correlation-7",
    causationId: "causation-6",
    inputDigest: "sha256:input",
    idempotencyKey: "resource-5:update:7",
    authorization: {
      decision: CommandAuthorizationDecisions.AWAITING_APPROVAL,
      scope: "resource:write",
      approvalId: "approval-3",
      expiresAt: "2030-01-01T00:00:00Z",
      revocationCheckedAt: "2029-12-31T23:59:00Z",
      revocationStatus: "current",
      policyRefs: ["policy:resource-write"]
    },
    controls: { approve: true, cancel: { available: true, reason: "Host supports cancellation." } },
    progress: { current: 1, total: 4, message: "Validating input" },
    upstream: {
      schemaId: "annex.command_invocation",
      schemaVersion: "0.2.0",
      contractRef: "contract:resource.update:1",
      invocationId: "invocation-12"
    }
  });

  assert.equal(item.contractVersion, COMMAND_WORK_ITEM_CONTRACT);
  assert.equal(item.commandId, "resource.update");
  assert.equal(item.commandVersion, "1");
  assert.deepEqual(item.implementationRefs, ["http:resource.update"]);
  assert.equal(item.schemas.input.version, "1");
  assert.equal(item.schemas.output.id, "resource.update.output");
  assert.equal(item.schemas.output.cardinality, "one");
  assert.equal(item.subject.actor.type, "human");
  assert.equal(item.subject.principal.id, "principal-4");
  assert.deepEqual(item.authorization.scope, ["resource:write"]);
  assert.equal(item.controls.approve.available, true);
  assert.equal(item.controls.retry.available, false);
  assert.equal(item.progress.ratio, 0.25);
  assert.equal(item.upstream.schemaId, "annex.command_invocation");
  assert.equal(item.upstream.verified, false);
});

test("command work items never infer authority or controls", () => {
  const item = createCommandWorkItem({ commandId: "resource.update" });

  assert.equal(item.authorization.decision, CommandAuthorizationDecisions.UNKNOWN);
  assert.equal(item.controls.approve.available, false);
  assert.equal(item.controls.cancel.available, false);
  assert.equal(item.state, CommandWorkItemStates.QUEUED);
});

test("command work items present host-supplied allowed decisions", () => {
  const item = createCommandWorkItem({
    commandId: "resource.update",
    state: CommandWorkItemStates.RUNNING,
    authorization: {
      decision: CommandAuthorizationDecisions.ALLOWED,
      reason: "The host accepted the reviewed scope."
    }
  });

  assert.equal(item.authorization.decision, CommandAuthorizationDecisions.ALLOWED);
  assert.equal(item.authorization.reason, "The host accepted the reviewed scope.");
});

test("command receipts do not infer successful outcomes", () => {
  const receipt = createCommandReceipt({ commandId: "resource.update" });

  assert.equal(receipt.state, CommandWorkItemStates.FAILED);
  assert.equal(receipt.outcome, CommandReceiptOutcomes.UNKNOWN);
});

test("command receipts normalize reviewed terminal outcomes", () => {
  const cases = [
    [CommandReceiptOutcomes.SUCCEEDED, CommandWorkItemStates.SUCCEEDED],
    [CommandReceiptOutcomes.DENIED, CommandWorkItemStates.FAILED],
    [CommandReceiptOutcomes.DUPLICATE, CommandWorkItemStates.FAILED],
    [CommandReceiptOutcomes.STALE_APPROVAL, CommandWorkItemStates.FAILED],
    [CommandReceiptOutcomes.CRASHED, CommandWorkItemStates.RECOVERABLE],
    [CommandReceiptOutcomes.BUDGET_EXHAUSTED, CommandWorkItemStates.FAILED],
    [CommandReceiptOutcomes.CANCELLED, CommandWorkItemStates.CANCELLED],
    [CommandReceiptOutcomes.RECOVERABLE, CommandWorkItemStates.RECOVERABLE]
  ];

  for (const [outcome, state] of cases) {
    const receipt = createCommandReceipt({
      commandId: "resource.update",
      state,
      outcome,
      readback: { code: outcome, summary: `Command ended with ${outcome}` }
    });

    assert.equal(receipt.contractVersion, COMMAND_RECEIPT_CONTRACT);
    assert.equal(receipt.state, state);
    assert.equal(receipt.outcome, outcome);
    assert.equal(receipt.readback.code, outcome);
  }
});

test("command receipts retain cancellation, recovery, diagnostics, and evidence", () => {
  const receipt = createCommandReceipt({
    commandId: "resource.update",
    commandVersion: "1",
    workItemId: "work-12",
    receiptId: "receipt-12",
    state: CommandWorkItemStates.RECOVERABLE,
    outcome: CommandReceiptOutcomes.CRASHED,
    causationId: "causation-6",
    approvalRef: "approval-3",
    error: { code: "worker_crashed", message: "The command worker exited.", retryable: true, details: { exitCode: 1 } },
    diagnostics: [{ severity: "error", message: "Worker exited" }],
    evidenceRefs: ["log:command-12"],
    resultRefs: ["result:resource-5"],
    outputCounts: { resource: 1 },
    reasonCodes: ["worker_crashed"],
    provenanceRefs: ["trace:command-12"],
    resourceUsage: [{ metric: "runtime", value: 12, unit: "seconds" }],
    cost: { amount: 0, currency: "USD", basis: "observed" },
    cancellation: { requested: true, accepted: false, reason: "Worker unavailable." },
    recovery: { available: true, reference: "recovery-12", reason: "Checkpoint available." },
    readback: {
      summary: "Recovery is available.",
      statusRef: "status:command-12",
      visibility: "redacted_summary",
      updatedAt: "2030-01-01T00:01:00Z"
    },
    upstream: {
      schemaId: "annex.command_receipt",
      schemaVersion: "0.2.0",
      invocationId: "invocation-12",
      receiptId: "receipt-12"
    }
  });

  assert.equal(receipt.error.retryable, true);
  assert.equal(receipt.diagnostics[0].severity, "error");
  assert.deepEqual(receipt.evidenceRefs, ["log:command-12"]);
  assert.equal(receipt.cancellation.requested, true);
  assert.equal(receipt.recovery.reference, "recovery-12");
  assert.equal(receipt.outputCounts.resource, 1);
  assert.equal(receipt.readback.statusRef, "status:command-12");
  assert.equal(receipt.upstream.schemaVersion, "0.2.0");
});

test("command descriptors return immutable snapshots", () => {
  const item = createCommandWorkItem({ commandId: "resource.update", explanation: { details: ["Original"] } });
  const snapshot = item.describe();
  snapshot.explanation.details[0] = "Changed";

  assert.equal(item.explanation.details[0], "Original");
});
