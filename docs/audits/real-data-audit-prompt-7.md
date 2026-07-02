# Real Data Audit - Prompt 7

Project: VaanForge  
Company: KRAVIA PRIVATE LIMITED  
Date: 2026-07-02

## Summary

VaanForge is now largely backend-driven across the official subdomain shells. The remaining production boundary is provider readiness: external providers must be configured and health-checked by admins before production use. The frontend must continue to treat backend APIs as the source of truth for dashboards, billing, usage, support, marketplace, status, legal, releases, enterprise, and partner data.

## Subdomain Findings

| Subdomain | Data source | Fake/static risk | Action |
| --- | --- | --- | --- |
| `app.vaanforge.com` | Projects, dashboard, billing usage APIs | Low | Keep project counts and usage API-backed. |
| `factory.vaanforge.com` | Factory services and billing usage checks | Low | Expensive actions must continue writing usage events. |
| `agents.vaanforge.com` | Agent runs, roles, brains, logs, outputs | Low | No static agent output should be introduced. |
| `profile.vaanforge.com` | Profile, sessions, usage, billing, API key APIs | Low | Continue masking API key material. |
| `settings.vaanforge.com` | Settings, workspace, team, billing, usage APIs | Medium | Provider setup should move to admin providers center. |
| `plans.vaanforge.com` | Billing plan APIs | Low | Pricing remains backend source of truth. |
| `support.vaanforge.com` | Support tickets, messages, KB, announcements | Low | Empty states are correct when no tickets exist. |
| `admin.vaanforge.com` | Admin APIs | Medium | Provider readiness added under `/api/v1/admin/providers`. |
| `developers.vaanforge.com` | Developer apps, API keys, webhooks, usage logs | Low | API keys remain hashed and one-time secret display only. |
| `marketplace.vaanforge.com` | Marketplace apps, reviews, installs, revenue events | Low | No fake ratings or installs. |
| `docs.vaanforge.com` | Repository docs or managed docs records | Low | Docs can seed from real repository markdown. |
| `status.vaanforge.com` | Status services/incidents/health checks | Low | No uptime percentage until monitoring evidence exists. |
| `legal.vaanforge.com` | Versioned legal page records | Medium | System seeds drafts only; admin publish required. |
| `releases.vaanforge.com` | Release notes/changelog records | Low | Release seed is derived from repository release files when present. |
| `enterprise.vaanforge.com` | Enterprise lead/demo and solution records | Low | No fake logos or unsupported compliance claims. |
| `partners.vaanforge.com` | Partner applications, partners, referrals, commissions | Low | No fake commissions or payouts. |

## Fixed In Prompt 7

- Added provider readiness admin APIs.
- Added Parameter Store production enforcement.
- Added provider health status taxonomy.
- Extended usage events with user, workspace, action, unit, plan, credits, metadata, and idempotency key fields.
- Added duplicate usage event prevention for idempotency keys.
- Added provider health audit logs.
- Changed seeded legal pages to draft-only records.

## Remaining Controls

- Production must set `PARAMETER_STORE_ENABLED=true`.
- Optional providers may remain `not_configured`; required production providers must be `healthy` or explicitly blocked.
- Admin provider health checks should be run before launch and after credential rotation.

## Priority

- P0: Missing production required secrets or Parameter Store disabled in production.
- P1: Provider readiness not reviewed before beta.
- P2: Optional provider setup such as Sentry, Analytics, Figma asset sync.
