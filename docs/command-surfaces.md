# Command Work-Item Surfaces

Command work-item surfaces let a host present the same command identity, authorization preview, progress, controls, and result across CLI, GUI, and agent adapters. The contracts are renderer-neutral and serializable.

Reactor defines two versioned contracts:

- `reactor.command-work-item/1` describes an active or queued command.
- `reactor.command-receipt/1` describes a terminal result or recoverable interruption.

## Work items

Use `createCommandWorkItem(...)` to normalize host-supplied data. Work items carry stable command and instance identifiers, input and output schema references, actor/tenant/delegation display references, correlation and input digest values, an idempotency key, authorization preview, explicit controls, progress, and explanations.

Actor, tenant, and delegation fields are presentation references. They should contain identifiers and safe display text rather than credentials or authoritative policy objects.

Controls default to unavailable. A browser or renderer must not infer privileges from a command state, visible button, actor label, or approval identifier. The host supplies the authorization decision and every available control.

## Receipts and readback

Use `createCommandReceipt(...)` for the host's terminal readback. Receipts carry explicit state and outcome values plus optional output, error, diagnostics, evidence references, cancellation data, and recovery data.

The outcome vocabulary covers successful execution, denial, duplicate detection, stale approval, worker crash, budget exhaustion, cancellation, and recoverable interruption. It describes what the host reported; Reactor does not retry or recover a command.

## Accessibility

Renderers should expose the work-item label as the accessible name, state and progress as live status, the explanation summary as supporting text, and each unavailable control's reason when it helps the operator. Terminal errors and readback should remain available after a command leaves the active queue.

## Ownership

- Reactor owns these descriptor shapes, state and outcome vocabulary, safe defaults, and accessible presentation guidance.
- Host applications own authorization, approval expiry, command registration, execution, idempotency enforcement, cancellation, recovery, and evidence access.
- Automata or Cogito may supply reviewed decision semantics where value-led agency is needed.
- Annex or Synematic may supply execution envelopes and lifecycle semantics. Reactor displays their normalized references without redefining those protocols.

The contracts can evolve additively under their current versions. Breaking field or semantic changes require a new contract version.
