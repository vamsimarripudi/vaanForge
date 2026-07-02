# API Keys

VaanForge API keys allow controlled external automation for user and developer workflows.

## Contracts

- `POST /api/v1/api-keys`
- `GET /api/v1/api-keys`
- `GET /api/v1/api-keys/:keyId`
- `POST /api/v1/api-keys/:keyId/rotate`
- `DELETE /api/v1/api-keys/:keyId`
- `GET /api/v1/api-keys/:keyId/usage`

## Security Model

- Full secret is visible only once at creation.
- Secrets are hashed at rest.
- Rotation creates a new key and marks the previous key as rotated.
- Revocation marks the key as revoked.
- Usage logs are tenant-scoped.
- Create, rotate, and revoke actions are audited.

