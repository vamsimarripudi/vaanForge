# Backend Security Hardening

## Route Requirements

- Protected routes use `authMiddleware`.
- Mutations use `requirePermission(...)`.
- Tenant resources verify organization and workspace ownership.
- Webhooks use signature or internal-token verification.
- Sensitive actions create audit logs.

## Data Protection

- API keys and secrets are never returned after creation.
- Proof-ledger metadata masks secrets before persistence.
- Error responses remove stack traces, private paths, and secret terms.
- Prompt-risk scanning flags instruction override, exfiltration, and secret-request patterns.

## Current Sprint

The ML and proof-ledger routes were added with authentication, permissions, request validation, safe errors, and audit-backed proof events.
