# Security

Security baseline:

- Cookie-style session authentication foundation created.
- Session tokens are HMAC-signed for local development.
- Session tokens include issued-at and expiry timestamps.
- Session tokens include unique session IDs.
- Logout revokes the current session ID for the remaining token lifetime.
- Session cookie lifetime is controlled by `SESSION_TTL_SECONDS`.
- Password reset tokens are random, hashed at rest, expiring, and one-time use.
- Password reset emails go through the email provider abstraction; local development uses an in-memory outbox.
- SMS notifications go through the SMS provider abstraction; local development uses an in-memory outbox.
- Role-based permission guard foundation created.
- API rate limiting middleware created.
- Signed CSRF helper endpoint created.
- CSRF enforcement middleware protects authenticated mutating API routes.
- CSRF QA verifies that public mutation exceptions stay limited to registration, login, and password reset.
- API security contract QA checks public-route allowlists, authenticated routes, and mutating route permission guards.
- Session and CSRF cookies use secure flags automatically in production.
- Audit routes are permission-protected.
- Audit logs for financial, legal, billing, entitlement, and security actions.
- Audit coverage QA verifies sensitive finance, legal, compliance, billing, entitlement, workspace, settings, automation, HR, and task mutations keep audit records.
- No hardcoded secrets.
- Environment variables documented in `docs/infra/env-guide.md`.

The current scaffold contains placeholders. It must not be represented as security-complete production software until production email/SMS delivery, production-grade distributed session revocation storage, production secret handling, external adapter hardening, and provider-specific security reviews are completed.
