# Scripts

Developer helper scripts live here.

Useful root commands:

- `npm run phase:status` checks the phase tracker for incomplete phases.
- `npm run test:e2e` runs route smoke coverage, UI interaction contract checks, backend HTTP smoke coverage, onboarding product-flow contract checks, module lifecycle state contract checks, API auth/permission contract checks, API route catalog contract checks, frontend structure contract checks, backend structure contract checks, documentation requirements contract checks, build quality contract checks, final goal contract checks, role and permission matrix contract checks, CSRF bypass contract checks, CI workflow contract checks, environment documentation contract checks, database schema/migration contract checks, demo seed contract checks, provider readiness contract checks, production readiness documentation contract checks, file upload contract checks, background job contract checks, realtime contract checks, Vaanis architecture contract checks, commercial suite contract checks, audit coverage contract checks, phase documentation contract checks, domain configuration contract checks, pricing placeholder contract checks, dependency hygiene contract checks, QA documentation contract checks, and infrastructure contract checks.
- `npm run launch:readiness` runs the backend readiness gate and exits nonzero until every launch dependency is configured.
- `npm run db:migrate:deploy` applies reviewed Prisma migrations in the target database environment.
- `npm run seed:demo` creates local demo data for workspace, finance, reports, tasks, CRM, customer, support, HR, hiring, interviews, legal, compliance, registrations, creators, partners, communication, automation, settings, and intelligence.
