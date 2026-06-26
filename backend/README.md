# Backend

TypeScript REST API for VM Nexus Ecosystem OS.

Current scope:

- `/api/v1/health`
- `/api/v1/plans`
- `/api/v1/entitlements/check`
- `/api/v1/audit`

The module layout is intentionally simple and readable. Business modules must use service abstractions for memory, queues, rate limits, pub/sub, presence, and realtime features.
