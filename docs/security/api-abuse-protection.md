# API Abuse Protection

VaanForge protects API access through scoped keys, key status, rate limits, replay-aware webhooks, and audit trails.

## APIs

- `GET /api/v1/developer/api-keys/:keyId/security`
- `PATCH /api/v1/developer/api-keys/:keyId/security`
- `POST /api/v1/developer/api-keys/:keyId/revoke`

## Controls

- API keys are hashed at rest.
- Full key secrets are visible only once at creation.
- Scopes are enforced server-side.
- IP allowlists can restrict keys.
- Revoke marks the key unusable without deleting audit history.
- Suspicious access creates security events.

## Webhook Replay

Provider event IDs are tracked. Duplicate provider event IDs are treated as replay indicators and produce a security event.
