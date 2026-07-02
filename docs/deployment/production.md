# Production Deployment

VaanForge production deployment requires backend, frontend, database, queue, storage, billing, and observability readiness.

## Required Checks

- environment validation passes
- database migrations are applied
- secrets are present and masked in logs
- frontend build passes
- backend build passes
- health endpoints respond
- queue worker health is visible
- billing webhook signature verification is configured
- rollback guide is available

## Safety Rules

- Never deploy when build or migration checks fail.
- Never mark deployment live before health checks pass.
- Every deployment needs a release ID and rollback metadata.
- Production actions require audit logs and appropriate permissions.

