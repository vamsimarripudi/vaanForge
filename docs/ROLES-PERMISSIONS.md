# Roles And Permissions

Permission groups are defined in `shared/src/roles.ts`.

Future implementation should store role assignments in PostgreSQL and cache permission checks through `memory.service.ts`.

Restricted areas must never be exposed only through frontend hiding. Backend permission checks are mandatory.

`scripts/qa-roles-contract.js` verifies that core roles, permission groups, role mappings, backend route permission literals, and the roles API contract stay aligned.

Settings includes a role setup panel that loads `/api/v1/roles`, previews permissions, and runs CSRF-protected `/api/v1/roles/check` permission checks.
