# Backend Architecture Audit - Sprint 3

Company: KRAVIA PRIVATE LIMITED  
Product: VaanForge  
Sprint type: Backend architecture refinement, performance, scalability, and reliability  
Date: 2026-06-29

## Scope

This audit reviewed the current backend implementation under `backend/src`, Prisma schema/migrations, middleware, infrastructure adapters, route registration, tests, and deployment/environment documentation. The sprint did not add a new product module or redesign business workflows.

## What Exists

### Backend Shape

- Express TypeScript API with centralized route registration in `backend/src/routes.ts`.
- Modular domains under `backend/src/modules`.
- Shared middleware for auth, CSRF, rate limiting, errors, and now request context.
- Prisma schema covering the commercial suite, VaanForge agents, billing, marketplace, cloud platform, factory, operations, developer platform, and enterprise controls.
- In-memory persistence for tests/development and Prisma schema/migrations for PostgreSQL production.
- Provider abstractions for AI, payments, storage, realtime, memory/queue, email, and SMS.
- Broad contract suite under `scripts/qa-*.js` plus backend smoke/module tests.

### Route Layer

- Route files are thin for most modules and generally call services directly after validation/auth checks.
- Security contract currently validates hundreds of API routes.
- Signed webhooks are separated from normal user-auth routes.

### Service Layer

- Business logic is concentrated in service classes, not frontend or controllers.
- Route handlers still perform some inline request parsing, but durable workflows largely live in services.
- Largest services identified by file size:

| Service | Size | Risk |
| --- | ---: | --- |
| `billing.service.ts` | 42,728 bytes | P1: subscription, wallet, invoices, payment attempts, webhooks, plan changes in one class |
| `factory.service.ts` | 34,093 bytes | P1: intake, questions, blueprint, design, build, QA, release, memory in one class |
| `builder.service.ts` | 28,935 bytes | P1: project lifecycle, requirements, blueprints, outputs, change requests |
| `marketplace.service.ts` | 27,932 bytes | P1: publisher, app, review, install, payout workflows |
| `operations.service.ts` | 26,676 bytes | P1: summary, fleet, health, commands, incidents, analytics |
| `cloud-platform.service.ts` | 24,607 bytes | P1: identity, gateway, events, storage, secrets, jobs, monitoring |

### Database Layer

- Prisma schema contains 185+ production models and strong coverage for newer VaanForge workflows.
- Agent, factory, billing, marketplace, developer, operations, and cloud models have tenant/status/time indexes.
- Many foundational business tables from the earlier product suite have fewer indexes than newer modules.
- The current runtime tests use in-memory persistence, so DB query latency was not directly benchmarked in this sprint.

### Middleware

- `authMiddleware` verifies KRAVIA session cookies and revocation.
- `csrfMiddleware` protects protected mutations and intentionally excludes public auth and signed webhook paths.
- `rateLimitMiddleware` uses the memory abstraction.
- `errorMiddleware` now includes request IDs, standardized fields, and production-safe messages.
- New `requestContextMiddleware` attaches `X-Request-ID`, request timing metadata, and slow/failing request logs.

### Jobs And Events

- `job.service.ts` is the central queue boundary for report exports, automation rules, VaanForge blueprint jobs, and execution jobs.
- Job records now include attempts, maximum attempts, idempotency keys, timestamps, and last error metadata.
- Event architecture exists in cloud platform and live agent workspace records, but event contracts are not centralized in one registry yet.

### Configuration

- `env.ts` centralizes runtime configuration.
- Production now fails fast when critical secrets remain local/placeholder or `FRONTEND_URL` is not HTTPS.
- `docs/infra/env-guide.md` was synchronized with the production validator.

## Fixes Completed In Sprint 3

### Observability

- Added `backend/src/middlewares/request-context.middleware.ts`.
- Added `X-Request-ID` response header.
- Added request ID, method, path, status, and latency logging for slow or failed requests.
- Ensured request context is applied before JSON parsing, so malformed JSON failures are traceable.

### Error Safety

- Updated `errorMiddleware` to include:
  - `code`
  - `recoverable`
  - `nextAction`
  - `requestId`
- Production responses no longer expose raw exception details.
- Development/test responses still expose detail for debugging.

### Guard Response Consistency

- Updated auth, CSRF, and rate-limit middleware to include compatible structured fields while preserving existing `error` messages.

### Environment Hardening

- Added production startup validation for:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `VFORMIX_AGENT_WEBHOOK_TOKEN`
  - HTTPS `FRONTEND_URL`

### Job Reliability

- Extended job records with:
  - attempts
  - maxAttempts
  - idempotencyKey
  - lastError
  - updatedAt
- Added retry handling around queue adapter enqueue.
- Failed enqueue attempts are logged with masked structured metadata.
- Updated `backend/src/infrastructure/jobs/README.md`.

### Documentation

- Updated:
  - `docs/02-architecture.md`
  - `docs/infra/env-guide.md`
  - `backend/src/infrastructure/jobs/README.md`
- Added this audit.

## Findings

### P0 - Blocking Production

- No new P0 issues remain after validation.
- Production startup now fails if critical secrets are placeholders.
- API security, CSRF, environment, database, jobs, and production-readiness contracts pass.

### P1 - Important Before Beta

- Refactor oversized services into focused collaborators:
  - Billing: `SubscriptionLifecycleService`, `InvoiceService`, `CreditWalletService`, `WebhookProcessor`, `UsageLimitService`.
  - Factory: `RequirementIntelligenceService`, `BlueprintWorkflowService`, `DesignWorkflowService`, `BuildWorkflowService`, `ReleaseWorkflowService`.
  - Marketplace: `PublisherService`, `ReviewWorkflowService`, `InstallService`, `MarketplaceBillingBridge`.
  - Operations: `IncidentService`, `FleetMetricsService`, `OperationsCommandService`, `BusinessMetricsService`.
  - Cloud Platform: `CloudIdentityService`, `CloudEventService`, `CloudJobService`, `CloudMonitoringService`.
- Introduce a centralized error class hierarchy for expected domain errors instead of broad `throw new Error(...)` usage.
- Add real benchmark/load-test scripts. No benchmark suite exists today.
- Add database query latency tests against PostgreSQL, not only in-memory store tests.
- Centralize event names and payload contracts into a typed event registry.

### P2 - Polish/Improvement

- Convert prompt/demo provider language in older modules into explicit provider-gated operational states.
- Add request ID propagation into audit logs for sensitive mutations.
- Add pagination helper utilities for modules that still manually slice arrays.
- Add a lightweight dependency graph check for circular dependencies.
- Add structured metrics emission beyond logs.

## Database Review

### Strengths

- Newer VaanForge modules include tenant and status indexes.
- Webhook events and payments include unique idempotency/provider IDs.
- Agent/factory/billing/marketplace tables are versioned where required.
- Audit/history models exist across sensitive workflows.

### Risks

- Older business-suite models have fewer composite tenant/status/date indexes than newer modules.
- In-memory tests cannot reveal PostgreSQL-specific query plans, lock contention, or migration performance.
- No benchmark script currently measures request latency, serialization cost, or database time.

### Recommended Schema Improvements

- Add tenant/date indexes to high-volume foundational tables after measuring real query plans.
- Add pagination indexes for audit/event/log tables that are searched by tenant and created date.
- Verify migration runtime on production-like data before public launch.

## API Performance Review

### Completed

- Added latency logging for slow requests.
- Preserved rate limiting at middleware level.
- Avoided caching billing, permission, and plan-limit data to prevent stale authorization decisions.

### Remaining Work

- Add API benchmarks for billing summary, builder projects, factory project detail, marketplace listings, operations summary, and developer usage.
- Measure response sizes for JSON-heavy admin endpoints and introduce pagination where payloads become large.

## Background Job Review

### Completed

- Added retry-safe job metadata and enqueue retry handling.
- Documented current job names.

### Remaining Work

- Replace local/in-memory queue execution with BullMQ or KRAVIA-approved Vaanis queue adapter for production volume.
- Add dead-letter queue records and worker timeout policies once real workers are introduced.

## Event Architecture Review

### Completed

- Identified existing event surfaces:
  - cloud event bus
  - live agent workspace events
  - notification realtime updates
  - job enqueue events

### Remaining Work

- Create a central event contract registry.
- Add event payload validation and versioning.
- Add replay/dead-letter contract tests for cloud and agent events.

## What Should Not Be Touched Casually

- Billing webhook signature verification and idempotency.
- Auth, CSRF, and route-security contracts.
- Plan/usage limit source of truth.
- Factory approval gates.
- Marketplace immutable app versioning.
- Agent execution validation gates.

## Validation Status

Validation was run after backend hardening changes. Final results are recorded in `docs/audits/backend-production-readiness-sprint-3.md`.
