# QA

Verification commands:

```bash
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:e2e
npm.cmd run phase:status
npm.cmd run build
```

Current QA coverage:

- TypeScript checks for frontend and backend.
- Backend foundation test covering plans, entitlements, auth, workspace, finance, tasks, CRM, support, HR, legal, compliance, creators, partners, communication, automation, settings, intelligence, and audit.
- Backend HTTP smoke test covering Express middleware, cookies, CSRF, auth, onboarding API, workspace activation, billing summary/trial, finance summary/analytics/export, PDF route aliases for organizations/users/revenue/expenses/P&L/GST/cash-flow and CRM/tasks/HR/document groups, task project/work-item/work-allocation list/create/update, CRM lead/customer/sales-operations/customer-portal list/create/update, support ticket/message list/create/update, HR/hiring/interview, legal agreement/operating-system list/create/update, compliance/registration/operating-system, creator profile/campaign/promotions/creator-portal list/create, partner list/collaboration-os create, communication list/operating-system create, automation rule/operating-system list/create, settings/operating-system, notifications, file upload, Reports OS, report export/download, intelligence operating-system, audit, founder and suite dashboard, and readiness routes.
- Production build for frontend and backend.
- Phase status gate for the 48-phase tracker.
- Route smoke coverage through `scripts/qa-route-smoke.js`, including the PDF-required public website, Business Planning OS, Client Portal, Promotions & Marketing OS, Education Suite, VMetron Suite, shared billing, reports, account, settings, support, and admin routes.
- UI interaction coverage through `scripts/qa-ui-interactions.js`, including suite dashboard live summaries, protected notifications, pricing plan catalog visibility, pricing entitlement/trial/checkout, finance entry/export, operations project/task lists and task lifecycle, CRM lead/customer lists and lead stage updates, Customer Portal OS, support ticket/message visibility and lifecycle, support SLA/escalation/knowledge-base operations, HR Team OS operations, HR candidate stage, hiring, interview scoring, legal agreement list/status, compliance item status, registration status, creator profile and campaign lists, Creator Portal OS, Reports OS, Automation OS, Intelligence OS, Settings OS, partner, communication, automation record lists, intelligence latest snapshot visibility, audit visibility, and settings workflows.
- Onboarding product-flow coverage through `scripts/qa-onboarding-contract.js`.
- Module loading/empty/error/success state coverage through `scripts/qa-state-contract.js`.
- API auth/permission coverage through `scripts/qa-api-security.js`.
- API route catalog coverage through `scripts/qa-api-route-catalog.js`.
- Frontend structure coverage through `scripts/qa-frontend-structure-contract.js`.
- Backend structure coverage through `scripts/qa-backend-structure-contract.js`.
- Documentation requirements coverage through `scripts/qa-docs-requirements-contract.js`.
- Build quality coverage through `scripts/qa-build-quality-contract.js`.
- Final goal coverage through `scripts/qa-final-goal-contract.js`.
- Role and permission matrix coverage through `scripts/qa-roles-contract.js`.
- CSRF bypass coverage through `scripts/qa-csrf-security.js`.
- CI workflow coverage through `scripts/qa-ci-contract.js`.
- Environment documentation coverage through `scripts/qa-env-contract.js`.
- Database schema/migration coverage through `scripts/qa-database-contract.js`.
- Demo seed coverage through `scripts/qa-seed-contract.js`.
- Provider readiness coverage through `scripts/qa-provider-readiness.js`.
- Production readiness documentation coverage through `scripts/qa-production-readiness-contract.js`.
- File upload coverage through `scripts/qa-file-upload-contract.js`.
- Background job coverage through `scripts/qa-jobs-contract.js`.
- Realtime coverage through `scripts/qa-realtime-contract.js`.
- Vaanis architecture coverage through `scripts/qa-vaanis-architecture-contract.js`.
- Commercial suite coverage through `scripts/qa-commercial-suite-contract.js`.
- Audit coverage through `scripts/qa-audit-contract.js`.
- Phase documentation coverage through `scripts/qa-phase-contract.js`.
- Domain configuration coverage through `scripts/qa-domain-contract.js`.
- Pricing placeholder coverage through `scripts/qa-pricing-contract.js`.
- Dependency hygiene coverage through `scripts/qa-dependency-contract.js`.
- QA documentation coverage through `scripts/qa-documentation-contract.js`.
- Infrastructure coverage through `scripts/qa-infrastructure-contract.js`.

Future QA:

- Add browser-driven interaction tests for visual form submissions and protected flows after a browser runner is installed.
- Add database-backed integration tests after Prisma persistence is wired.
