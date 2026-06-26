# VM Nexus Ecosystem OS

Production-oriented operating ecosystem for VM nexus Pvt Ltd, founded by Vamsi Marripudi.

The build follows the attached Mega Prompt and its follow-up rules. The current commercial starting point is:

- Education Suite for schools, colleges, training institutes, and educational organizations.
- VMetron Suite for events, communities, creators, colleges running events, and companies running webinars.

## Start Here

1. Read [docs/START-HERE.md](docs/START-HERE.md).
2. Review the roadmap in [docs/PHASE-TRACKER.md](docs/PHASE-TRACKER.md).
3. Configure domains in [shared/config/domains.ts](shared/config/domains.ts).
4. Configure environment variables using [docs/infra/env-guide.md](docs/infra/env-guide.md).
5. Run checks:

```bash
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:e2e
npm.cmd run phase:status
npm.cmd run build
```

Production cutover also requires `npm.cmd run db:migrate:deploy` and `npm.cmd run launch:readiness` in the target environment.

## Folder Map

- `frontend/` - Next.js, TypeScript, Tailwind-first frontend.
- `backend/` - TypeScript API with module boundaries, Prisma schema, audit logs, and adapters.
- `design-system/` - VM Nexus design tokens and usage notes.
- `shared/` - Shared types, constants, and domain configuration.
- `docs/` - Non-technical and developer documentation.
- `daily-notes/` - Implementation tracking.
- `infrastructure/` - Docker, Nginx, deployment, and environment placeholders.
- `scripts/` - Developer helper scripts.
