# Persistence

VM Nexus OS currently supports two explicit persistence modes.

## Memory Mode

`PERSISTENCE_MODE=memory`

Memory mode is for local demos, route smoke checks, and phase validation. It uses `backend/src/database/in-memory-store.ts`, so data is lost when the backend process restarts. Do not put real customer, financial, HR, legal, or compliance data into memory mode.

## PostgreSQL Mode

`PERSISTENCE_MODE=postgres`

PostgreSQL is the production target. The schema lives in `backend/prisma/schema.prisma`, and `DATABASE_URL` must point to the production database before launch.

Production switch checklist:

- Set `PERSISTENCE_MODE=postgres`.
- Set `DATABASE_URL` to the production PostgreSQL connection string.
- Run `npm run prisma:generate --workspace backend`.
- Run reviewed migrations with `npm run db:migrate:deploy`.
- Replace placeholder provider values for payments, email, SMS, and storage.
- Replace `JWT_SECRET` with a strong production secret.
- Check `GET /api/v1/system/readiness` and resolve every warning or failure before real launch.
- Run `npm run launch:readiness` in the target deployment environment and require a zero exit code before traffic is cut over.

The route returns `ready`, `limited`, or `not-ready`. `limited` means the app can run for development or controlled demos, but at least one launch dependency is still a placeholder.

## Repository Migration Pattern

Repository contracts live in `backend/src/database/repositories/repository-contracts.ts`.

When moving a module from memory to PostgreSQL:

- Keep the existing service API stable.
- Add a Prisma repository implementation for that module.
- Keep a memory repository for local demos.
- Select the implementation from `PERSISTENCE_MODE`.
- Add tests that prove the service works through the repository contract.

Current repository migration status:

- Automation: repository-backed with memory and Prisma implementations for automation rules.
- Auth: repository-backed with memory and Prisma implementations for registration, login, public users, and organization assignment.
- Communication: repository-backed with memory and Prisma implementations for messages and announcements.
- CRM: repository-backed with memory and Prisma implementations for leads, customers, and lead stages.
- Compliance: repository-backed with memory and Prisma implementations for compliance items, government registrations, and status updates.
- Creators: repository-backed with memory and Prisma implementations for creator profiles and campaigns.
- Finance: repository-backed with memory and Prisma implementations for revenue, expenses, and report exports.
- HR: repository-backed with memory and Prisma implementations for departments, employees, candidates, interviews, and interview scoring.
- Intelligence: repository-backed with memory and Prisma implementations for generated deterministic snapshots.
- Legal: repository-backed with memory and Prisma implementations for agreements and document status.
- Partners: repository-backed with memory and Prisma implementations for partner records and revenue share.
- Settings: repository-backed with memory and Prisma implementations.
- Support: repository-backed with memory and Prisma implementations for tickets, messages, and ticket status.
- Tasks: repository-backed with memory and Prisma implementations for projects, tasks, assignment, and status updates.
- Workspaces: repository-backed with memory and Prisma implementations for organizations, workspaces, subscriptions, entitlements, and activation notifications.
- Remaining modules: none in the current business-module set; future modules should follow the same repository pattern.

If Prisma Client has not been generated, memory mode still works. PostgreSQL mode requires a complete Prisma install, generated client, and deployed migrations before the first request touches a Prisma-backed repository. Local generation has been verified with `npm run prisma:generate --workspace backend`.
