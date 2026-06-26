# VaanForge AI Agent

VaanForge is KRAVIA's AI product-building platform. It receives structured requirements, turns them into approved blueprints, generates implementation tasks and code, validates the result, supports human review, manages deployment, and gives admins a command center for operating the full agent fleet.

The product is built for the VMNexus ecosystem and supports VFormix, VMetron, VaanMeet, VidyaLuma, customer builder projects, internal admin workflows, billing, deployment, memory, and enterprise operations.

## What It Does

- Converts VFormix and builder portal requirements into production-ready project blueprints.
- Generates PRDs, architecture plans, folder structures, database plans, API plans, UI plans, sprint roadmaps, and Codex-ready implementation prompts.
- Runs a coding execution workflow with task graphs, file tracking, validations, repair cycles, and execution reports.
- Provides admin dashboards for run monitoring, approvals, diff review, live workspace control, team-agent collaboration, deployment, memory, billing, and enterprise operations.
- Stores every run, output, validation, approval, error, repair, incident, audit event, and next action for accountability.
- Keeps provider integration abstract so OpenAI, local models, and future VaanAI providers can be swapped behind the same interface.

## Product Modules

- **Blueprint Agent** - turns structured requirements into stored product and technical plans.
- **Coding Execution Agent** - converts approved blueprints into tracked files, validations, commits, and repair attempts.
- **Visual Agent Dashboard** - lets admins review runs, generated plans, files, diffs, logs, and approvals.
- **Template Marketplace** - stores reusable approved app templates with versioning and quality gates.
- **VFormix Integration** - maps form submissions into agent-ready requirements and links submissions to runs.
- **Live Agent Workspace** - streams live run state, evidence, approvals, and human instructions.
- **Multi-Agent Team System** - coordinates specialist agents for product, architecture, UI, backend, frontend, QA, security, DevOps, and docs.
- **Deployment Agent** - checks readiness, manages releases, verifies health, and records rollback evidence.
- **Memory + Knowledge Base** - stores reviewed lessons, patterns, fixes, and retrieval rationale.
- **Customer Builder Portal** - lets customers create projects, approve blueprints, track progress, review outputs, and request changes.
- **Billing + Credits** - manages plans, subscriptions, usage limits, credit wallets, invoices, and Razorpay webhooks.
- **Enterprise Operations Center** - monitors system health, agent fleet, products, incidents, audit logs, analytics, queues, deployments, and emergency controls.
- **KRAVIA Developer Platform** - gives external developers versioned APIs, API keys, OAuth-ready apps, SDK metadata, webhooks, plugins, CLI access, and usage analytics.

## Repository Layout

- `frontend/` - Next.js admin dashboards, customer builder portal, billing pages, public launch pages, and operations command center.
- `backend/` - Express TypeScript API, VaanForge agent services, Prisma schema, persistence models, validation, billing, deployment, operations, and integrations.
- `shared/` - shared roles, permissions, domain configuration, and cross-workspace types.
- `design-system/` - design tokens used by the VMNexus/KRAVIA interfaces.
- `docs/` - architecture, API, deployment, QA, launch, security, and product documentation.
- `infrastructure/` - Docker, Nginx, and environment/deployment scaffolding.
- `scripts/` - QA, readiness, contract, and phase validation helpers.

The two deployable app folders are `frontend/` and `backend/`. Keep the root workspace files, `shared/`, and `design-system/` with them because both deployables depend on the workspace.

## Main Routes

### Admin

- `/admin/agent`
- `/admin/agent/runs`
- `/admin/agent/templates`
- `/admin/agent/marketplace`
- `/admin/agent/workspace`
- `/admin/agent/team`
- `/admin/agent/deployments`
- `/admin/agent/memory`
- `/admin/agent/billing`
- `/admin/operations`
- `/developers`

### Builder

- `/builder`
- `/builder/projects`
- `/builder/projects/new`
- `/builder/billing`
- `/builder/settings/workspace`
- `/builder/settings/team`
- `/builder/settings/security`
- `/builder/settings/data`

### Public

- `/`
- `/pricing`
- `/docs`
- `/help`

## API Surface

The backend is mounted under `/api/v1`. Key API groups include:

- `/api/v1/vaanforge/*`
- `/api/v1/admin/agent/*`
- `/api/v1/admin/operations/*`
- `/api/v1/developers/*`
- `/api/v1/gateway/v1/*`
- `/api/v1/admin/vformix/*`
- `/api/v1/builder/*`
- `/api/v1/builder/billing/*`
- `/api/v1/public/*`
- `/api/v1/webhooks/razorpay`

All admin and builder APIs use authenticated session context and role-based permissions. Emergency operations controls require Super Admin authorization in the backend service.

## Local Development

Use Node.js 20 or later.

```powershell
npm install
npm.cmd run dev:frontend
npm.cmd run dev:backend
```

Frontend build:

```powershell
npm.cmd run build --workspace frontend
```

Backend build:

```powershell
npm.cmd run build --workspace backend
```

Use `.env.example` as the starting point for environment variables. Do not commit real secrets.

## Validation

Run the full validation set before deploy:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Production release environments should also run:

```powershell
npm.cmd run db:migrate:deploy
npm.cmd run launch:readiness
```

## Deployment Notes

See [DEPLOYMENT.md](DEPLOYMENT.md) for the two-folder deployment layout.

- Frontend deploy target: `frontend/`
- Backend deploy target: `backend/`
- Database migrations: `backend/prisma/migrations/`
- Environment source: `.env.example`

## Engineering Rules

- No static fake success states.
- No dummy metrics in production dashboards.
- Every workflow tracks owner, status, priority, due date, audit history, activity history, and next action.
- Every generated file, validation result, error, repair attempt, deployment action, billing action, approval, and emergency command is tracked.
- Provider API keys and secrets must never be exposed in logs, dashboards, memory, or customer-facing outputs.
- No phase or deployment is considered complete unless type-check, lint, tests, and build pass.
