# VaanForge Subdomain Routing

Owner: KRAVIA PRIVATE LIMITED

## Routing Policy

Each subdomain has one primary responsibility. Avoid routing unrelated products through the same hostname.
Frontend subdomain shells, route guards, redirects, metadata, and navigation are defined in `frontend/src/app/domainShells.tsx` and documented in [navigation-architecture.md](../product/navigation-architecture.md).

| Subdomain | Primary route family | Backend API family | Auth |
| --- | --- | --- | --- |
| `vaanforge.com` | `/`, `/pricing`, `/docs`, `/legal/*` | `/api/v1/billing/plans` safe public metadata | Optional |
| `www.vaanforge.com` | Canonical alias to root | Same as root | Optional |
| `app.vaanforge.com` | `/builder`, `/builder/projects/*` | `/api/v1/projects`, `/api/v1/factory/*` | User |
| `auth.vaanforge.com` | `/login`, `/register`, `/forgot-password`, `/verify-email` | `/api/v1/auth/*` | Public auth |
| `profile.vaanforge.com` | `/profile` | `/api/v1/auth/me`, `/api/v1/auth/sessions` | User |
| `settings.vaanforge.com` | `/settings` | Workspace, users, roles, permissions | Owner/Admin |
| `plans.vaanforge.com` | `/pricing`, `/builder/billing/plans` | `/api/v1/billing/*` | Optional/User |
| `support.vaanforge.com` | Support tickets and help | Support APIs | User |
| `admin.vaanforge.com` | `/admin/*` | Admin APIs | Admin |
| `docs.vaanforge.com` | `/docs`, developer docs | `/api/v1/docs/*`, `/api/v1/admin/docs/*` | Public/Admin |
| `status.vaanforge.com` | Status and incidents | `/api/v1/status/*`, `/api/v1/admin/status/*` | Public/Admin |
| `developers.vaanforge.com` | `/developers/*` | Developer app, key, webhook APIs | Developer/User |
| `marketplace.vaanforge.com` | `/marketplace/*` | `/api/v1/marketplace/*`, `/api/v1/admin/marketplace/*` | Optional/User/Admin |
| `api.vaanforge.com` | API only | `/api/v1/*` | Session/API key |
| `assets.vaanforge.com` | Public immutable assets | None by browser CORS | Public |
| `cdn.vaanforge.com` | CDN assets | None by browser CORS | Public |
| `uploads.vaanforge.com` | Signed upload ingress | File upload APIs | User |
| `files.vaanforge.com` | Signed downloads/previews | File APIs | User |
| `webhooks.vaanforge.com` | Provider callbacks | `/api/v1/webhooks/*` | Signature |
| `events.vaanforge.com` | Event ingestion | Events APIs | API key |
| `billing.vaanforge.com` | Billing dashboard | Billing APIs | User/Billing admin |
| `checkout.vaanforge.com` | Checkout and payment status | Checkout APIs | User |
| `console.vaanforge.com` | Platform command center | Operations APIs | Super admin |
| `factory.vaanforge.com` | Factory workspace | Factory APIs | User |
| `agents.vaanforge.com` | Agent monitoring | Agent APIs | User/Admin |
| `deploy.vaanforge.com` | Deployment controls | Deployment APIs | Deployment admin |
| `releases.vaanforge.com` | Release reports | `/api/v1/releases/*`, `/api/v1/admin/releases/*` | Public/Admin |
| `legal.vaanforge.com` | Legal policy pages | `/api/v1/legal/pages/*`, `/api/v1/admin/legal/pages/*` | Public/Admin |
| `feedback.vaanforge.com` | Feedback capture | Feedback APIs | User |
| `learn.vaanforge.com` | Learning content | Content APIs | Public |
| `blog.vaanforge.com` | Product/engineering articles | Content APIs | Public |
| `partners.vaanforge.com` | Partner portal | `/api/v1/partners/*`, `/api/v1/admin/partners/*` | Public/Partner/Admin |
| `enterprise.vaanforge.com` | Enterprise sales/security | `/api/v1/enterprise/*`, `/api/v1/admin/enterprise/*` | Public/Admin |

## Prompt 5 Public Trust Rules

- Marketplace browsing is public-safe; installs, publisher actions, review decisions, suspend, and publish require permissions.
- Docs, legal pages, releases, enterprise solution pages, partner resources, and status reads may be public only when they expose safe managed content.
- Status must not publish uptime percentages until automated monitoring evidence exists.
- Partner revenue, marketplace ratings, marketplace installs, customer logos, and compliance claims must come from real records.

## Redirect Behavior

- Protected shell without a session redirects to `auth.vaanforge.com/login`.
- Auth shell with an active session redirects to `app.vaanforge.com`.
- Billing-locked shell redirects to `plans.vaanforge.com/upgrade`.
- Admin shell requires `admin` or `super_admin`.
- Console shell requires `super_admin`.
- Permission denied renders a state page instead of a blank screen.
- Plan limit reached renders the plan-limit state with an upgrade action.
- API, webhook, event, upload, and asset ingress domains are not normal browser application pages.
