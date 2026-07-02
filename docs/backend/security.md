# Backend Security

Security controls:

- Session authentication via `authMiddleware`
- RBAC via `requirePermission`
- CSRF middleware for browser mutations
- Request IDs and correlation-friendly errors
- Razorpay webhook signature verification
- Internal VFormix webhook signature verification
- Secret masking in proof, queue, and ML metadata
- Memory secret scanning before storage
- Tenant filtering by `organizationId`

Open production tasks:

- Add external tracing exporter.
- Add file malware scanner adapter.
- Add expanded tenant boundary test suite for all canonical resources.

