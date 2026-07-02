# VaanForge DNS Checklist

Owner: KRAVIA PRIVATE LIMITED

| Domain | Record | Target | SSL | Environment notes | Owner | Service | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `vaanforge.com` | A/ALIAS | Frontend edge | Required | Root app | Platform | Frontend edge | Active |
| `www.vaanforge.com` | CNAME | `vaanforge.com` | Required | Canonical alias | Platform | Frontend edge | Active |
| `app.vaanforge.com` | CNAME | Frontend edge | Required | Builder workspace | Product | Frontend edge | Active |
| `auth.vaanforge.com` | CNAME | Frontend edge | Required | Auth flows | Security | Frontend edge | Active |
| `profile.vaanforge.com` | CNAME | Frontend edge | Required | Account profile | Product | Frontend edge | Planned |
| `settings.vaanforge.com` | CNAME | Frontend edge | Required | Workspace settings | Product | Frontend edge | Planned |
| `plans.vaanforge.com` | CNAME | Frontend edge | Required | Pricing and plans | Billing | Frontend edge | Active |
| `support.vaanforge.com` | CNAME | Frontend edge | Required | Customer support | Support | Frontend edge | Planned |
| `admin.vaanforge.com` | CNAME | Operations console | Required | Admin only | Security | Operations console | Active |
| `docs.vaanforge.com` | CNAME | Frontend edge | Required | Public docs | Developer Experience | Frontend edge | Active |
| `status.vaanforge.com` | CNAME | Status service | Required | Public uptime | Operations | Frontend edge | Planned |
| `developers.vaanforge.com` | CNAME | Frontend edge | Required | Developer platform | Developer Experience | Frontend edge | Active |
| `marketplace.vaanforge.com` | CNAME | Frontend edge | Required | App marketplace | Marketplace | Frontend edge | Active |
| `api.vaanforge.com` | CNAME | Backend API | Required | `/api/v1` ingress | Platform | Backend API | Active |
| `assets.vaanforge.com` | CNAME | CDN | Required | Public static assets | Platform | Object storage/CDN | Planned |
| `cdn.vaanforge.com` | CNAME | CDN | Required | Optimized CDN | Platform | Object storage/CDN | Planned |
| `uploads.vaanforge.com` | CNAME | Upload gateway | Required | Signed uploads | Platform | Object storage/CDN | Planned |
| `files.vaanforge.com` | CNAME | File gateway | Required | Authorized downloads | Platform | Object storage/CDN | Planned |
| `webhooks.vaanforge.com` | CNAME | Webhook ingress | Required | Signature verified | Platform | Webhook ingress | Active |
| `events.vaanforge.com` | CNAME | Event ingress | Required | API-key events | Platform | Event ingress | Planned |
| `billing.vaanforge.com` | CNAME | Frontend edge | Required | Billing dashboard | Billing | Frontend edge | Active |
| `checkout.vaanforge.com` | CNAME | Frontend edge | Required | Checkout handoff | Billing | Frontend edge | Active |
| `console.vaanforge.com` | CNAME | Operations console | Required | Super-admin only | Operations | Operations console | Planned |
| `factory.vaanforge.com` | CNAME | Frontend edge | Required | Software factory | Product | Frontend edge | Active |
| `agents.vaanforge.com` | CNAME | Frontend edge | Required | Agent monitoring | Product | Frontend edge | Planned |
| `deploy.vaanforge.com` | CNAME | Operations console | Required | Deployment controls | DevOps | Operations console | Planned |
| `releases.vaanforge.com` | CNAME | Frontend edge | Required | Release evidence | Product | Frontend edge | Planned |
| `legal.vaanforge.com` | CNAME | Frontend edge | Required | Legal pages | Legal | Frontend edge | Active |
| `feedback.vaanforge.com` | CNAME | Frontend edge | Required | Feedback intake | Product | Frontend edge | Future |
| `learn.vaanforge.com` | CNAME | Frontend edge | Required | Learning content | Developer Experience | Frontend edge | Future |
| `blog.vaanforge.com` | CNAME | Frontend edge | Required | Product content | Marketing | Frontend edge | Future |
| `partners.vaanforge.com` | CNAME | Frontend edge | Required | Partner portal | Partnerships | Frontend edge | Planned |
| `enterprise.vaanforge.com` | CNAME | Frontend edge | Required | Enterprise sales | Sales | Frontend edge | Planned |

Staging should use the same subdomain shape under a staging root. Development should use localhost with explicit ports only.
