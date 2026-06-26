# Architecture

The project intentionally uses a simple root structure:

- `frontend/` for the Next.js app.
- `backend/` for REST APIs and business logic.
- `shared/` for shared types and config.
- `design-system/` for tokens.
- `docs/` for documentation.
- `daily-notes/` for work tracking.
- `infrastructure/` for deployment assets.

## Key Decisions

- REST APIs are built first under `/api/v1`.
- Domains are centralized in `shared/config/domains.ts`.
- Plans are configured separately for frontend and backend until shared package build wiring is completed.
- Redis is only a temporary development adapter behind `memory.service.ts`.
- Vaanis is represented as a placeholder adapter so business modules can switch later without rewrites.
- Realtime and meeting creation go through `realtime.service.ts`; VaanRTC and SFU adapters are placeholders for VM-owned realtime engines.

## Suite Rule

Every feature must respect suite type, active plan, product entitlement, usage limit, and role permission.
