# Start Here

VaanForge is being built as KRAVIA PVT LTD's production-grade enterprise AI software factory.

The first commercial release starts with two suites:

- Education Suite: Vidyaluma, VaanMeet, VFormix, Support, Billing, Reports.
- VMetron Suite: VMetron, VaanMeet, VFormix, Support, Billing, Reports, Promotions.

Current status:

- Repo foundation created.
- Simple prompt-approved folder structure created.
- Design tokens created.
- Frontend suite selector, pricing, onboarding, account, workspace activation, founder dashboard, notifications, finance, operations, CRM, customer portal, support, HR, hiring, interviews, legal, compliance, registrations, creator, partner, communication, automation, intelligence, settings, and suite dashboards created.
- Backend auth, role permission, workspace, notification, dashboard, finance, tasks, CRM, support, HR, hiring, interview, legal, compliance, government registration, creator, partner, communication, automation, intelligence, settings, plan, entitlement, audit, memory, realtime, and Prisma foundations created.
- Infrastructure and domain placeholders documented.

Do not hardcode domains or prices. Update configuration files instead.

## Verification

- Root build passes with `npm.cmd run build`.
- Root typecheck passes with `npm.cmd run typecheck`.
- Backend foundation tests pass with `npm.cmd test`.
- Route, UI, backend HTTP smoke, API security, role/permission, CSRF, CI, environment, database, provider readiness, production readiness, audit, phase, domain, pricing, dependency, documentation, and infrastructure contract checks pass with `npm.cmd run test:e2e`.
