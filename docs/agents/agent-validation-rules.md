# Agent Validation Rules

Agent outputs are accepted only when they satisfy both schema and workflow validation.

## Common Checks

- structured JSON/markdown output exists
- output schema validates
- confidence score is present
- next action is present
- owner/status/priority/due date are tracked when workflow-related
- audit event is written for sensitive actions
- plan and usage limits are checked before paid actions
- no secrets or sensitive data are stored in memory

## Execution Checks

Generated code cannot be marked completed unless:

- lint passes
- type-check passes
- unit/integration/E2E checks pass where configured
- build passes
- route security checks pass
- security review passes

