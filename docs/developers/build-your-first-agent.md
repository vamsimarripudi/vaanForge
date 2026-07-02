# Build Your First Agent

VaanForge agents should be scoped, auditable, and reviewable.

## Minimal Agent Design

- Define responsibility.
- Define inputs and validation rules.
- Define outputs and storage shape.
- Define permissions.
- Define failure states.
- Define audit events.
- Add tests for success, validation failure, and permission failure.

## Do Not

- Store secrets in agent memory.
- Skip validation before execution.
- Mark completed without passing required checks.
- Hide failed validation evidence.

