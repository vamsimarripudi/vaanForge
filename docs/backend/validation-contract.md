# Backend Validation Contract

Every VaanForge mutation must validate request body, route params, query strings, ownership context, permissions, and plan limits before business logic runs.

## Validation sources

- Zod schemas in route/service modules
- Auth middleware for session validation
- Permission guard for RBAC
- Billing plan service for plan and usage limits
- File service for size and MIME validation
- Webhook middleware for signature checks

## Error behavior

Validation failures use `VALIDATION_ERROR` with field errors where possible. Legacy route errors are normalized by the API boundary into the standard error envelope.
