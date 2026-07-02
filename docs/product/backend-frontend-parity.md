# Backend Frontend Parity

This page tracks the first production subdomains implemented after the VaanForge domain foundation.

| Subdomain | Frontend Shell | Backend APIs | Data Source |
| --- | --- | --- | --- |
| `profile.vaanforge.com` | Account feature shell | `/api/v1/profile/*` | Users, profiles, sessions, billing, usage, API keys, audit logs |
| `settings.vaanforge.com` | Settings feature shell | `/api/v1/settings/*` | Settings service, workspaces, users, data requests |
| `plans.vaanforge.com` | Plans feature shell | `/api/v1/billing/plans` | Billing plan configuration service |
| `support.vaanforge.com` | Customer support shell | `/api/v1/support/*` | Support tickets, messages, attachments, announcements, knowledge articles |
| `admin.vaanforge.com/support` | Admin support shell | `/api/v1/admin/support/*` | Support tickets, internal notes, reports |
| `app.vaanforge.com` | Product home shell | `/api/v1/projects/*`, `/api/v1/dashboard/summary` | Projects, tasks, billing usage, dashboard data |
| `factory.vaanforge.com` | Factory workflow shell | `/api/v1/factory/*` | Factory projects, intake, questions, blueprints, task graph, files, QA, security, release, memory |
| `agents.vaanforge.com` | Agent control shell | `/api/v1/agents/*` | Agent runs, logs, outputs, handoffs, roles, brain configs |
| `developers.vaanforge.com` | Developer portal shell | `/api/v1/developer/*` | Developer apps, API keys, webhooks, SDKs, usage, logs |
| `marketplace.vaanforge.com` | Marketplace shell | `/api/v1/marketplace/*`, `/api/v1/admin/marketplace/*` | Marketplace apps, versions, categories, reviews, installs, permissions, revenue, payouts |
| `docs.vaanforge.com` | Docs shell | `/api/v1/docs/*`, `/api/v1/admin/docs/*` | Repository-backed or managed docs articles, versions, categories, search index |
| `status.vaanforge.com` | Status shell | `/api/v1/status/*`, `/api/v1/admin/status/*` | Status services, incidents, incident updates, subscribers, health checks |
| `legal.vaanforge.com` | Legal shell | `/api/v1/legal/pages/*`, `/api/v1/admin/legal/pages/*` | Versioned legal pages and acceptance logs |
| `releases.vaanforge.com` | Releases shell | `/api/v1/releases/*`, `/api/v1/admin/releases/*` | Release notes, release versions, changelog items |
| `enterprise.vaanforge.com` | Enterprise shell | `/api/v1/enterprise/*`, `/api/v1/admin/enterprise/*` | Enterprise leads, demo requests, solution pages, sales notes |
| `partners.vaanforge.com` | Partners shell | `/api/v1/partners/*`, `/api/v1/admin/partners/*` | Partner applications, partners, referrals, commissions, payouts, resources |
| `admin.vaanforge.com/providers` | Provider readiness center | `/api/v1/admin/providers`, `/api/v1/admin/providers/readiness`, `/api/v1/admin/providers/:provider/health-check` | Provider readiness records, environment flags, Parameter Store path checks, provider health checks |

The frontend feature shells call these APIs directly through the shared API client and show loading, empty, error, and live contract states. No profile, settings, billing, support, marketplace, status, partner, release, or enterprise values should be hardcoded in the frontend.

Prompt 5 public trust surfaces must never show fake ratings, fake uptime, fake revenue, fake installs, fake partner payouts, fake customer logos, or unsupported compliance claims.

## Prompt 6 validation and error parity

Backend errors are normalized through `backend/src/http/error-response.ts` and `backend/src/middlewares/error-response.middleware.ts`. Frontend requests are normalized through `frontend/src/services/apiClient.ts`.

Shared frontend form fields live in `frontend/src/app/components/forms/VaanForgeFields.tsx`; page states live in `frontend/src/app/components/states/VaanForgeStates.tsx`; toast behavior lives in `frontend/src/app/components/toast/vaanforgeToast.ts`.

Every form should use inline field errors for validation, page states for blocking errors, and toasts for confirmed request-level outcomes. Backend remains the source of truth for permissions, billing, plan limits, tenant ownership, file uploads, and webhooks.

## Prompt 7 real-data, usage, and audit parity

| Page route | Subdomain | Backend APIs | Auth | Permission | Plan | States | Audit events | Usage events |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/providers` | `admin.vaanforge.com` | `/api/v1/admin/providers*` | Admin | `settings:manage` | Admin plan | Loading, empty, error, permission denied | `ProviderHealthCheck` | None |
| `/marketplace/*` | `marketplace.vaanforge.com` | `/api/v1/marketplace/*` | Optional/User | `workspace:create`, `settings:manage` for mutations | Marketplace access | Loading, empty, error, plan limit | Marketplace install/publish/review actions | `template_use` for paid installs |
| `/factory/*` | `factory.vaanforge.com` | `/api/v1/factory/*` | User | `workspace:create` | AI credits/build limits | Loading, locked, error, plan limit | Factory and agent actions | `agent_run`, `ai_credit`, `build_minute`, `regeneration` |
| `/developers/*` | `developers.vaanforge.com` | `/api/v1/developer/*` | User | Developer access | API access | Loading, empty, error, permission denied | API key/webhook/app actions | API usage logs |
| `/legal/*` | `legal.vaanforge.com` | `/api/v1/legal/pages/*` | Public/Admin | `legal:manage` for publish | None | Loading, empty, error | Legal page publish/update | None |
| `/status/*` | `status.vaanforge.com` | `/api/v1/status/*` | Public/Admin | `audit:read` for admin incident changes | None | Loading, empty, error | Status incident/service actions | None |

No production page is complete unless the frontend route has a backend API, auth/permission behavior, useful loading/empty/error states, and documented audit/usage expectations where applicable.

## Prompt 8 lifecycle parity

| Page route | Subdomain | Backend APIs | Auth | Permission | States | Audit/analytics |
| --- | --- | --- | --- | --- | --- | --- |
| `/onboarding` | `app.vaanforge.com` | `/api/v1/onboarding`, `/api/v1/onboarding/start`, `/api/v1/onboarding/complete` | User | `profile:manage` for mutations | Resume, loading, complete, validation error | `SETTINGS_CHANGED` lifecycle metadata |
| `/app/tours` | `app.vaanforge.com` | `/api/v1/onboarding/tours` | User | `profile:manage` for updates | Available, completed, dismissed, replay | Product tour progress |
| `/app/command-palette` | `app.vaanforge.com` | `/api/v1/onboarding/command-palette` | User | `profile:manage` for command execution | Loading, empty, error | Command usage records |
| `/app/search` | `app.vaanforge.com` | `/api/v1/onboarding/search` | User | None for read | Grouped empty/results/error | Tenant-scoped search |
| `/app/notifications` | `app.vaanforge.com` | `/api/v1/notifications` | User | `profile:manage` for archive/read-all | Read, unread, archived, empty | Notification state |
| `/app/automation` | `app.vaanforge.com` | `/api/v1/automation/*` | User | `settings:manage` for rule creation | Active, paused, empty, validation error | `AUTOMATION_CHANGED` |
| `/app/analytics` | `app.vaanforge.com` | `/api/v1/onboarding/workspace-analytics` | User | None for read | Backend-driven meters, empty states | Usage, billing, support, project state |
| `/app/health` | `app.vaanforge.com` | `/api/v1/onboarding/product-health` | User | None for read | Scores, recommendations, provider warnings | Backend-generated next actions |

## Prompt 10 enterprise trust parity

| Page route | Subdomain | Backend APIs | Auth | Permission | States | Audit events |
| --- | --- | --- | --- | --- | --- | --- |
| `/security` | `admin.vaanforge.com` | `/api/v1/admin/security/overview`, `/api/v1/admin/security/events`, `/api/v1/admin/security/risk` | Admin | `audit:read` | Loading, empty, error, permission denied | Security event/report reads |
| `/security/reports` | `admin.vaanforge.com` | `/api/v1/admin/security/reports`, `/api/v1/admin/security/reports/generate` | Admin | `settings:manage` for generation | Generating, empty, report-ready, error | `SECURITY_ACTION` |
| `/data-privacy` | `settings.vaanforge.com` | `/api/v1/settings/data-privacy`, `/api/v1/settings/data-privacy/export`, `/api/v1/settings/data-privacy/delete-request` | User | `settings:manage` for requests | Pending, submitted, error, recovery | Data export/delete requests |
| `/privacy` | `admin.vaanforge.com` | `/api/v1/admin/privacy/export-requests`, `/api/v1/admin/privacy/delete-requests` | Admin | `audit:read`, `settings:manage` for decisions | Review queue, empty, error | `SECURITY_ACTION` |
| `/legal/*` | `legal.vaanforge.com` | `/api/v1/legal/accept`, `/api/v1/legal/acceptance-history`, `/api/v1/admin/legal/acceptance-logs` | User/Admin | `profile:manage`, `legal:manage` for admin logs | Accepted, history empty, error | `LEGAL_ACTION` |
| `/audit/exports` | `admin.vaanforge.com` | `/api/v1/audit-logs`, `/api/v1/audit-logs/export`, `/api/v1/admin/audit/exports` | Admin | `audit:read`, `reports:export` for export | Exporting, empty, error | `SECURITY_ACTION` |
| `/api-keys/:keyId/security` | `developers.vaanforge.com` | `/api/v1/developer/api-keys/:keyId/security`, `/api/v1/developer/api-keys/:keyId/revoke` | User | `api-keys:manage` | Active, restricted, revoked, error | `SECURITY_ACTION` |

Enterprise trust reports are evidence-backed readiness reports. They must not claim external compliance certification until KRAVIA PRIVATE LIMITED has legally obtained it.
