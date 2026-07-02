# Backend API Catalog

Canonical APIs are exposed under `/api/v1`.

Key groups:

- `/auth`
- `/projects`
- `/factory`
- `/billing`
- `/marketplace`
- `/developer`
- `/memory`
- `/knowledge`
- `/ml`
- `/proof-records`
- `/analytics`
- `/operations`

Protected routes require `authMiddleware`. Mutations require `requirePermission(...)` unless handled by signed webhook middleware.

