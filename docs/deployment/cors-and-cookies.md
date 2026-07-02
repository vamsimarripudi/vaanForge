# VaanForge CORS and Cookie Policy

Owner: KRAVIA PRIVATE LIMITED

## CORS

Production CORS is domain-driven from [config/domains.ts](../../config/domains.ts) and backend runtime policy in `backend/src/config/vaanforge-domains.ts`.

Rules:

- No wildcard CORS in production.
- Only VaanForge domains marked `apiOriginAllowed` can call the browser API with credentials.
- Admin origins are identified separately for operations and security review.
- `api.vaanforge.com`, `webhooks.vaanforge.com`, `events.vaanforge.com`, `assets`, `cdn`, and upload ingress do not become browser origins by default.
- API-key and webhook integrations must use request authentication, not CORS.
- Razorpay and other provider webhooks must use signature verification.

Local development allows localhost ports used by Vite and backend smoke tests.

## Cookies

Session cookie:

- Name: `kravia_session`
- Production: `Secure`, `HttpOnly`, `SameSite=Lax`
- Domain: `.vaanforge.com` where cross-subdomain auth is required
- Purpose: authenticated VaanForge workspace/API session

CSRF cookie:

- Name: `kravia_csrf`
- Production: `Secure`, `SameSite=Lax`
- `HttpOnly=false` because the browser sends the value in `x-csrf-token`
- Required for unsafe session-authenticated browser mutations

Admin session policy:

- Admin and console surfaces require admin/super-admin permissions.
- Admin session options are stricter: `SameSite=Strict`, shorter max age, and `admin.vaanforge.com` domain scoping.
- Admin actions remain auditable even when sharing the same API service.

## SameSite Choice

`SameSite=Lax` is used for normal sessions to support navigation across VaanForge subdomains without opening cross-site POST exposure. Unsafe mutations still require CSRF tokens and RBAC.

## Webhooks

Webhook domains do not use browser cookies:

- `webhooks.vaanforge.com`: provider signature verification
- `events.vaanforge.com`: API key or signed event verification
- Failed signature verification must reject before business logic runs
