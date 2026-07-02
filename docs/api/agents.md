# Agent APIs

Agent APIs cover blueprint generation, coding execution, admin monitoring, live workspace, team workflows, deployment, memory, and templates.

## Main Groups

- `/api/v1/vaanforge/*`
- `/api/v1/admin/agent/*`

## Expectations

- Every run has a unique run ID.
- Status transitions are stored.
- Outputs are persisted.
- Errors include reason, evidence, and next action.
- Admin actions are audited.

