# Backend Architecture

The backend is an Express TypeScript API organized by feature modules.

## Responsibilities

- Route registration under `/api/v1`.
- Authentication, permission checks, CSRF exceptions, and rate limiting.
- Agent planning, execution, deployment, memory, operations, billing, developer, and marketplace services.
- Prisma schema and migrations for production persistence.
- In-memory store for local/demo smoke paths.

## Route Security Convention

Protected routes include `authMiddleware`. Mutations include `requirePermission(...)` unless they are signed webhooks or documented self-service allowlist routes.

