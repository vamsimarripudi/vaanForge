# Repository Contracts

These contracts define the handoff from the current memory-backed services to durable Prisma-backed repositories.

Production repository work should follow this order:

- Move one module at a time behind a repository implementation.
- Keep service method names stable so frontend routes and tests remain unchanged.
- Add a memory implementation for local demos and a Prisma implementation for `PERSISTENCE_MODE=postgres`.
- Extend `/api/v1/system/readiness` when a module becomes durable.
- Add migration and seed coverage before moving real data.
