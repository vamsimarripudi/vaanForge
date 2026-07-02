# Agent Handoff Contracts

Every handoff must include enough context for the receiving agent or human reviewer to continue safely.

## Required Fields

- `handoffId`
- `runId`
- `fromAgent`
- `toAgent`
- `projectId`
- `summary`
- `evidence`
- `openRisks`
- `nextAction`
- `requiredApproval`
- `createdAt`
- `createdBy`

## Rules

- One primary owner per task.
- Conflicts must be logged with reason and resolution.
- Human overrides are allowed only with audit logs.
- Handoffs must never include secrets, raw provider keys, private local file paths, or unredacted customer-sensitive data.

