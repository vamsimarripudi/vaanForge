# Security

Security is built into VaanForge as a system property, not a final checklist.

## Controls

- Auth middleware for protected APIs.
- RBAC and permission checks for sensitive mutations.
- Super-admin controls for emergency operations.
- CSRF protection for browser mutations.
- Signed webhook verification for external/internal callbacks.
- Rate limiting on public, auth, developer, marketplace, and control routes.
- Secret masking in logs and stored evidence.
- Prompt injection scanning for requirements, memory, plugins, marketplace submissions, and form input.
- Tenant isolation for customer, workspace, billing, project, and marketplace data.
- Audit logs for sensitive actions.

## Validation

Security expectations are enforced by contracts such as `scripts/qa-api-security.js`, `scripts/qa-csrf-security.js`, and `scripts/qa-audit-contract.js`.

