# Command Work-Item Surfaces

Command work-item surfaces let a host present the same command identity, authorization preview, progress, controls, and result across CLI, GUI, and agent adapters. The contracts are renderer-neutral and serializable.

Reactor defines two versioned contracts:

- `reactor.command-work-item/1` describes an active or queued command.
- `reactor.command-receipt/1` describes a terminal result or recoverable interruption.

## Work items

Use `createCommandWorkItem(...)` to normalize host-supplied data. Work items carry stable command and instance identifiers, input and output schema references, actor/tenant/delegation display references, correlation and input digest values, an idempotency key, authorization preview, explicit controls, progress, and explanations.

Keep `commandId` and `commandVersion` stable across surfaces. Provider bindings belong in `implementationRefs`; they must not replace the shared command identity. Each schema reference can carry `name` and explicit `cardinality` (`zero_or_one`, `one`, `zero_or_more`, or `one_or_more`). An empty cardinality is unknown and must not be presented as a successful compatibility claim.

Actor, tenant, and delegation fields are presentation references. They should contain identifiers and safe display text rather than credentials or authoritative policy objects.

Controls default to unavailable. A browser or renderer must not infer privileges from a command state, visible button, actor label, or approval identifier. The host supplies the authorization decision and every available control.

## Receipts and readback

Use `createCommandReceipt(...)` for the host's terminal readback. Receipts carry explicit state and outcome values plus optional output, error, diagnostics, evidence references, cancellation data, and recovery data.

The outcome vocabulary covers successful execution, denial, duplicate detection, stale approval, worker crash, budget exhaustion, cancellation, and recoverable interruption. It describes what the host reported; Reactor does not retry or recover a command.

## Provisional upstream mapping

The `upstream` block records a source schema reference for presentation and traceability. It defaults to `verified: false`; a schema name or version does not prove signature validity, admission, authorization, or compatibility.

Annex issue [#29](https://github.com/BlueFissionTech/annex/issues/29) and draft PR [#30](https://github.com/BlueFissionTech/annex/pull/30) propose these exact schemas:

- `annex.command_contract` `0.2.0`: `command_id`/`command_version` map to `commandId`/`commandVersion`; provider-local `implementation_refs` map to `implementationRefs`; channel `schema_ref`, `name`, and `cardinality` map to Reactor schema references.
- `annex.command_invocation` `0.2.0`: `invocation_id`, `contract_ref`, `correlation_id`, `causation_id`, `input.digest`, `idempotency_key`, authority display references, and approval evidence map to the corresponding work-item fields.
- `annex.command_receipt` `0.2.0`: `receipt_id`, `invocation_id`, state, lineage, result and provenance references, output counts, reason codes, resource/cost evidence, recovery, and readback map to receipt presentation fields.

That Annex proposal is unsigned review material until its owner accepts and lands it. Reactor does not copy signatures or treat `upstream.verified` as an authorization decision.

The existing `synematic.chat.command` `1.0.0` mapping is provisional and limited to chat adapter lifecycle fields: command/arguments/result, correlation/causation, idempotency, and received/completed/failed/retry-requested state. [Synematic #65](https://github.com/BlueFissionTech/synematic/issues/65) owns the portable denial, cancellation/recovery, approval freshness, output-cardinality, durable-receipt, cost, and host-authorization contract. Reactor therefore makes no cross-surface Synematic compatibility claim.

## Accessibility

Renderers should expose the work-item label as the accessible name, state and progress as live status, the explanation summary as supporting text, and each unavailable control's reason when it helps the operator. Terminal errors and readback should remain available after a command leaves the active queue.

## Ownership

- Reactor owns these descriptor shapes, state and outcome vocabulary, safe defaults, and accessible presentation guidance.
- Host applications own authorization, approval expiry, command registration, execution, idempotency enforcement, cancellation, recovery, and evidence access.
- Automata or Cogito may supply reviewed decision semantics where value-led agency is needed.
- Annex or Synematic may supply execution envelopes and lifecycle semantics. Reactor displays their normalized references without redefining those protocols.

The contracts can evolve additively under their current versions. Breaking field or semantic changes require a new contract version.
