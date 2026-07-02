# API Authentication

VaanForge APIs use authenticated session context for browser workflows and scoped API keys for developer gateway workflows.

## Browser APIs

- Protected routes require `authMiddleware`.
- Mutations use CSRF protection unless explicitly signed webhook routes.
- Sensitive mutations require `requirePermission(...)`.

## Developer Gateway

- API keys are hashed at rest.
- Keys can be rotated and revoked.
- Usage is logged.
- Rate limits are enforced.

