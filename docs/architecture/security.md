# Security Architecture

Security controls are distributed across middleware, route contracts, services, tests, and documentation.

## Enforcement Points

- `authMiddleware`
- `requirePermission(...)`
- CSRF middleware
- Signed webhook middleware
- Rate limiting middleware
- Secret masking helpers
- Prompt-injection checks
- Tenant-aware service lookups
- Audit service writes

## Contracts

- `scripts/qa-api-security.js`
- `scripts/qa-csrf-security.js`
- `scripts/qa-audit-contract.js`
- `scripts/qa-env-contract.js`
- `scripts/qa-production-readiness-contract.js`

