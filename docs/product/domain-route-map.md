# VaanForge Domain Route Ownership Map

Owner: KRAVIA PRIVATE LIMITED

Subdomain page shells, metadata, guard behavior, shared states, and navigation are implemented in `frontend/src/app/domainShells.tsx`. This map remains the ownership reference for which frontend route families, API families, roles, auth requirements, plan requirements, and support owners belong to each subdomain.

| Subdomain | Frontend routes | Backend APIs | User role | Auth | Plan | Support owner |
| --- | --- | --- | --- | --- | --- | --- |
| `vaanforge.com` | `/`, `/pricing`, `/docs`, `/legal/*` | Public pricing/legal metadata | Anonymous/customer | Optional | Free+ | Product |
| `www.vaanforge.com` | Same as root | Same as root | Anonymous | Optional | Free+ | Product |
| `app.vaanforge.com` | `/builder`, `/builder/projects/*` | `/api/v1/projects`, `/api/v1/factory/*` | Customer/workspace member | Required | Free+ | Product |
| `auth.vaanforge.com` | `/login`, `/register`, `/forgot-password`, `/verify-email` | `/api/v1/auth/*` | Anonymous/user | Public auth | Free+ | Security |
| `profile.vaanforge.com` | `/profile` | `/api/v1/auth/me`, sessions | User | Required | Free+ | Support |
| `settings.vaanforge.com` | `/settings` | Workspace/users/roles APIs | Owner/admin | Required | Creator+ | Product |
| `plans.vaanforge.com` | `/pricing`, `/builder/billing/plans` | `/api/v1/billing/plans` | Anonymous/customer | Optional | Free+ | Billing |
| `support.vaanforge.com` | Help and tickets | Support APIs | Customer/support | Required | Free+ | Support |
| `admin.vaanforge.com` | `/admin/*` | `/api/v1/admin/*` | Admin/super-admin | Required | Internal | Security |
| `docs.vaanforge.com` | `/docs`, `/developers/docs` | Docs metadata | Anonymous/developer | Optional | Free+ | Developer Experience |
| `status.vaanforge.com` | Status pages | Operations status | Anonymous | Optional | Free+ | Operations |
| `developers.vaanforge.com` | `/developers/*` | Developer apps, API keys, webhooks | Developer | Required | Professional+ | Developer Experience |
| `marketplace.vaanforge.com` | `/marketplace/*` | Marketplace APIs | Anonymous/customer/publisher | Optional | Free+ | Marketplace |
| `api.vaanforge.com` | API only | `/api/v1/*` | User/service/developer | Session/API key | Plan-gated | Platform |
| `assets.vaanforge.com` | Asset URLs | Storage metadata where needed | Anonymous | None | Free+ | Platform |
| `cdn.vaanforge.com` | CDN URLs | None | Anonymous | None | Free+ | Platform |
| `uploads.vaanforge.com` | Upload handoff | `/api/v1/files/upload` | Customer | Required | Storage-gated | Platform |
| `files.vaanforge.com` | File previews/downloads | `/api/v1/files/*` | Customer/workspace member | Required | Storage-gated | Platform |
| `webhooks.vaanforge.com` | None | `/api/v1/webhooks/*` | Provider/service | Signature | Internal | Platform |
| `events.vaanforge.com` | None | Event ingestion APIs | Service/developer | API key/signature | Professional+ | Platform |
| `billing.vaanforge.com` | `/builder/billing/*` | Billing APIs | Customer/billing admin | Required | Free+ | Billing |
| `checkout.vaanforge.com` | Checkout status pages | Checkout APIs | Customer | Required | Paid plans | Billing |
| `console.vaanforge.com` | Operations console | Operations APIs | Super-admin | Required | Internal | Operations |
| `factory.vaanforge.com` | Factory project pages | Factory APIs | Customer/workspace member | Required | Free+ | Product |
| `agents.vaanforge.com` | Agent run pages | Agent APIs | Customer/admin | Required | Creator+ | Product |
| `deploy.vaanforge.com` | Deployment controls | Deployment APIs | Deployment admin | Required | Business+ | DevOps |
| `releases.vaanforge.com` | Release reports | Release APIs | Customer/member | Required | Creator+ | Product |
| `legal.vaanforge.com` | Legal policy pages | Public policy APIs | Anonymous | None | Free+ | Legal |
| `feedback.vaanforge.com` | Feedback forms | Feedback APIs | Customer | Required | Free+ | Product |
| `learn.vaanforge.com` | Learning content | Content APIs | Anonymous/customer | Optional | Free+ | Developer Experience |
| `blog.vaanforge.com` | Blog content | Content APIs | Anonymous | None | Free+ | Marketing |
| `partners.vaanforge.com` | Partner/publisher pages | Partner APIs | Partner/publisher | Required | Partner | Partnerships |
| `enterprise.vaanforge.com` | Enterprise contact/security | Enterprise APIs | Anonymous/enterprise | Optional | Enterprise | Sales |
