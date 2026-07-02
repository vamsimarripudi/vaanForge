# VaanForge Platform Inventory

Project: VaanForge  
Company: KRAVIA PRIVATE LIMITED  
Sprint: Platform Completion and Enterprise Readiness  
Inventory Date: 2026-07-02

## Inventory Method

This inventory was produced from the repository state, package scripts, frontend route maps, backend module folders, Prisma schema, provider readiness catalog, documentation tree, and QA contract suite. It does not assume external provider credentials are configured in the local environment.

## Executive Inventory Summary

| Area | Implemented | Partially Implemented | Missing | Deprecated | Duplicate | Production Ready |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Root workspaces | 4 workspaces: frontend, backend, shared, design-system | 0 | 0 | 0 | 0 | Yes |
| Frontend app surfaces | 6 primary app files plus route aliases and subdomain shells | Some screens share `Workspace.tsx` | 0 known from route smoke | 0 | Some UI consolidation remains | Yes, with refactor backlog |
| Backend modules | 49 module folders under `backend/src/modules` | Some use in-memory service abstractions for local/test mode | 0 known from contracts | 0 | One timestamped legacy admin dashboard module name remains | Yes for code contracts |
| Backend API contracts | 1600 routes covered by API security contract | Runtime provider calls depend on env configuration | 0 known from route catalog | 0 | Alias routes exist intentionally for compatibility | Yes |
| Database schema | 185 Prisma models, 61 enums, 23 migrations | Production persistence depends on `PERSISTENCE_MODE=postgres` | 0 known from schema contract | 0 | Some legacy suite models coexist with VaanForge models | Yes with production DB config |
| Background jobs and queues | Report exports, automation jobs, cloud jobs, deployment/AI/build job records | Queue provider readiness depends on Redis | 0 known from jobs contract | 0 | 0 | Yes with Redis configured |
| Providers | 14 provider definitions in readiness catalog | Optional AI/Sentry/analytics/Figma providers may be not configured | 0 | 0 | 0 | Required providers gated |
| Environment variables | 59 env variables covered by env contract | Production secrets externalized to Parameter Store gate | 0 known | 0 | 0 | Yes with Parameter Store |
| Documentation | 193 documentation files | Some docs describe readiness gates rather than live certifications | 0 known from docs contract | 0 | 0 | Yes |
| Tests and QA | 33 E2E scripts plus backend test suite | Browser visual regression remains future hardening | 0 known from scripts | 0 | 0 | Yes |

## Repository Structure

| Path | Purpose | Status | Production Ready |
| --- | --- | --- | --- |
| `frontend/` | Vite React customer, public, admin, billing, marketplace, developer, support, and shell UI | Implemented | Yes |
| `backend/` | TypeScript API, modules, guards, middleware, services, Prisma schema, tests | Implemented | Yes |
| `shared/` | Shared package workspace | Implemented | Yes |
| `design-system/` | Design system package workspace | Implemented | Yes |
| `docs/` | Product, backend, frontend, security, operations, release, audit, deployment docs | Implemented | Yes |
| `scripts/` | QA contracts, route smoke, dependency, infra, docs, pricing, security, domain checks | Implemented | Yes |
| `config/` | Domain/platform config | Implemented | Yes |
| `infrastructure/` | Docker, Nginx, deployment assets | Implemented | Yes |
| `.github/` | CI workflows | Implemented | Yes |
| `packages/` and `apps/` | Additional workspace/package structure | Implemented | Yes |

## Frontend Routes and Pages

Frontend routing is centralized in `frontend/src/app/App.tsx` and shell/domain behavior in `frontend/src/app/domainShells.tsx`.

| Route Family | Evidence | Status | Production Ready |
| --- | --- | --- | --- |
| Public pages | `/`, `/pricing`, `/docs`, `/help`, `/contact`, `/about`, roadmap/trust/legal routes | Implemented | Yes |
| Auth pages | `/login`, `/register`, `/forgot-password`, `/verify-email` | Implemented | Yes |
| Builder/project pages | `/builder/projects`, `/builder/projects/new`, project detail and project workflow aliases | Implemented | Yes |
| Factory workflow | chat, intake, questions, blueprint, design, tasks, agents, files, diffs, QA, security, deployment, release, docs, memory | Implemented | Yes, workflow-locked by backend state |
| Billing | billing, plans, checkout, success/failure, subscription, invoices, usage, credits | Implemented | Yes |
| Marketplace | browse, detail, installed | Implemented | Yes, backend-backed records required |
| Developer | apps, API keys, webhooks, docs, usage, key security | Implemented | Yes |
| Admin | factory, agents, billing, marketplace, operations, audit, security, privacy, monitoring, alerts, releases, customer success, business ops, engineering, intelligence | Implemented | Yes |
| Legal | terms, privacy, cookies, refund, payment, data usage, acceptable use, plan limits | Implemented | Yes |
| Subdomain shells | 33 official domains, 9 guards, 9 shared states | Implemented | Yes |

## Components and UI Foundation

| Item | Status | Notes | Production Ready |
| --- | --- | --- | --- |
| Top navigation | Implemented | Simplified to primary product actions | Yes |
| Sidebar/mobile drawer | Implemented | Empty history state is honest and non-static | Yes |
| Page states | Implemented | Loading, empty, error, permission, plan-limit states documented and contract-checked | Yes |
| Pricing cards and checkout | Implemented | Backend-driven plan and checkout data | Yes |
| Project/build views | Implemented | Use backend APIs rather than static sample rows | Yes |
| Motion/focus | Implemented | Reduced-motion and focus-visible defaults in theme | Yes |
| Design docs | Implemented | Design, motion, page-state, responsive, and Figma asset docs created | Yes |

## Backend Modules

| Module Group | Representative Modules | Status | Production Ready |
| --- | --- | --- | --- |
| Identity/account | `auth`, `account`, `users`, `roles`, `workspaces`, `settings` | Implemented | Yes |
| Product core | `builder`, `factory`, `vaanforge`, `runs`, `tasks`, `onboarding` | Implemented | Yes |
| Agent platform | `vaanforge`, `agent-admin-dashboard-*`, `vformix-agent`, `ml`, `proof-ledger` | Implemented | Yes |
| Commercial | `billing`, `plans`, `entitlements`, `marketplace`, `developer-platform` | Implemented | Yes |
| Trust/support | `support`, `security`, `trust`, `audit`, `legal`, `public-trust`, `notifications` | Implemented | Yes |
| Operations | `operations`, `readiness`, `providers`, `cloud-platform`, `platform-intelligence`, `intelligence` | Implemented | Yes |
| Business/admin | `business-operations`, `crm`, `finance`, `enterprise`, `partners`, `engineering-operations` | Implemented | Yes |
| Legacy suite compatibility | `communication`, `compliance`, `creators`, `hr`, `reports`, `aliases` | Implemented | Yes |

## APIs

| API Area | Status | Validation Evidence | Production Ready |
| --- | --- | --- | --- |
| Authentication/session APIs | Implemented | Backend tests and API smoke | Yes |
| Profile/settings APIs | Implemented | Account subdomain tests | Yes |
| Projects/factory/agent APIs | Implemented | Factory, product subdomain, VaanForge execution tests | Yes |
| Billing/plans/usage/payment APIs | Implemented | Pricing, checkout, builder billing tests | Yes with Razorpay credentials |
| Marketplace/developer APIs | Implemented | Marketplace and developer platform tests | Yes |
| Support/admin support APIs | Implemented | API smoke and support tests | Yes |
| Operations/monitoring/readiness APIs | Implemented | Operations, release readiness, provider readiness contracts | Yes |
| Security/privacy/audit APIs | Implemented | Enterprise trust and audit contracts | Yes |
| ML/proof ledger APIs | Implemented | Code quality upgrade tests | Yes, heuristic/local providers documented |

Security contract evidence: `scripts/qa-api-security.js` passed for 1600 routes.

## Database Inventory

| Area | Status | Production Ready |
| --- | --- | --- |
| Prisma schema | 185 models and 61 enums | Yes |
| Migrations | 23 migration files | Yes |
| Tenant fields | Covered by schema and security tests | Yes |
| Billing records | Plans, subscriptions, invoices, payments, usage, credits, Razorpay events | Yes |
| Agent/factory records | Runs, tasks, events, files, diffs, validations, security reviews, releases, memory | Yes |
| Operations/business records | Incidents, health checks, metrics, CRM, finance, engineering, intelligence | Yes |
| Proof ledger | Local proof metadata model and provider interface | Yes |

## Background Jobs, Queues, Workers, Scheduled Tasks

| Area | Status | Production Ready |
| --- | --- | --- |
| Cloud jobs | AI, build, deploy, health check job records | Yes with Redis/worker deployment |
| Report exports | Queue/export service covered by tests | Yes |
| Automation jobs | Automation rules and queue actions covered by API smoke | Yes |
| Notification jobs | Notification and messaging records exist | Yes with email provider configured |
| Intelligence inspections | Inspection and repair workflows covered by platform intelligence tests | Yes |
| Dead-letter/retry metadata | Documented through queue/job contracts | Yes |

## Provider Inventory

| Provider | Required In Production | Status | Action Required |
| --- | --- | --- | --- |
| OpenAI | No | Optional, cataloged | Configure if enabled for model routing |
| Gemini | No | Optional, cataloged | Configure if enabled |
| Claude | No | Optional, cataloged | Configure if enabled |
| Groq/Together | No | Optional, cataloged | Configure at least one if fast inference is enabled |
| Hugging Face | No | Optional, cataloged | Configure for embeddings/model workflows if enabled |
| Razorpay | Yes | Cataloged and signature/idempotency tested | Load key ID, secret, webhook secret from Parameter Store |
| AWS | Yes | Cataloged | Configure region/IAM role |
| S3 | Yes | Cataloged | Configure endpoint and bucket |
| SES | No | Optional, cataloged | Configure for production email delivery |
| PostgreSQL | Yes | Cataloged | Use production `DATABASE_URL` and `PERSISTENCE_MODE=postgres` |
| Redis | Yes | Cataloged | Configure `REDIS_URL` and memory adapter |
| Sentry | No | Optional, cataloged | Configure DSN before enabling monitoring |
| Analytics | No | Optional, cataloged | Configure write key before product analytics |
| Figma assets | No | Optional, cataloged | Configure only when asset sync is enabled |

## Environment Variables

Environment validation is implemented in `backend/src/config/env.ts` and covered by `scripts/qa-env-contract.js`. Production requires Parameter Store unless `ALLOW_LOCAL_ENV_IN_PRODUCTION=true` is explicitly set for a controlled break-glass deployment.

## Documentation Inventory

| Documentation Area | Status | Production Ready |
| --- | --- | --- |
| Product docs | Implemented | Yes |
| Backend/API docs | Implemented | Yes |
| Security/legal docs | Implemented | Yes, no fake certification claims |
| Deployment/operations docs | Implemented | Yes |
| Engineering/intelligence/business docs | Implemented | Yes |
| Audit/release docs | Implemented | Yes |
| QA docs | Implemented and synced with 33 E2E scripts | Yes |

## Tests and QA Contracts

| Test Group | Status | Production Ready |
| --- | --- | --- |
| Frontend lint/type/build | Implemented | Yes |
| Backend type/build/tests | Implemented | Yes |
| API smoke | Implemented | Yes |
| Security contracts | Implemented | Yes |
| Database/env/provider contracts | Implemented | Yes |
| Pricing/billing contracts | Implemented | Yes |
| Domain/subdomain contracts | Implemented | Yes |
| UI finalization contract | Implemented | Yes |
| Infrastructure contract | Implemented | Yes |

## Deprecated, Duplicate, and Cleanup Items

| Item | Classification | Recommendation |
| --- | --- | --- |
| `backend/src/modules/agent-admin-dashboard-1782436101128` | Duplicate/legacy naming | Keep for compatibility now; rename in a controlled migration only. |
| Large `frontend/src/app/Workspace.tsx` | Partially implemented architecture cleanup | Split into feature modules after launch freeze; current validation passes. |
| In-memory store | Local/test persistence abstraction | Keep for deterministic test/dev mode; production must use PostgreSQL. |
| Alias routes | Compatibility layer | Keep while API catalog and external integrations depend on them. |

## Production Readiness Conclusion

No P0 code blockers were found during inventory. Enterprise launch remains gated by deployment-time provider credentials, production database/Redis/S3/Razorpay configuration, and operational monitoring setup. Those gates are intentionally represented by provider readiness and environment validation instead of fake success states.
