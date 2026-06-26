# KRAVIA Developer Platform

The KRAVIA Developer Platform (KDP) is the public integration layer for VaanForge and the KRAVIA AI ecosystem. It gives external developers and enterprise customers a controlled API boundary, developer credentials, SDK metadata, webhooks, plugin registration, CLI access, and usage analytics.

## Portal

Frontend routes:

- `/developers`
- `/developers/apps`
- `/developers/api-keys`
- `/developers/docs`
- `/developers/sdk`
- `/developers/webhooks`
- `/developers/plugins`
- `/developers/usage`

## Backend APIs

Authenticated developer APIs:

- `GET /api/v1/developers/dashboard`
- `GET /api/v1/developers/apps`
- `POST /api/v1/developers/apps`
- `GET /api/v1/developers/api-keys`
- `POST /api/v1/developers/api-keys`
- `POST /api/v1/developers/api-keys/:keyId/rotate`
- `POST /api/v1/developers/api-keys/:keyId/revoke`
- `GET /api/v1/developers/sdk`
- `GET /api/v1/developers/docs`
- `GET /api/v1/developers/plugins`
- `POST /api/v1/developers/plugins`
- `GET /api/v1/developers/webhooks`
- `POST /api/v1/developers/webhooks`
- `GET /api/v1/developers/usage`

Versioned gateway:

- `GET /api/v1/gateway/v1/catalog`
- `POST /api/v1/gateway/v1/events`

Gateway calls require `x-kdp-api-key` and always return a standard envelope with `success`, `apiVersion`, `requestId`, and `data`.

## Data Models

- `developer_accounts`
- `developer_apps`
- `api_keys`
- `oauth_clients`
- `sdk_versions`
- `plugin_registry`
- `webhook_endpoints`
- `api_usage_logs`
- `api_rate_limits`

## Security

- API keys are hashed at rest and returned only once during creation or rotation.
- OAuth client secrets are stored hashed and redacted from API responses.
- Webhook signing secrets are stored hashed and returned only once during creation.
- Plugin manifests are scanned for prompt-injection phrases before registration.
- Gateway requests are versioned, rate-limited, validated, and logged.
- Developer actions are audited through the existing global audit service.

## SDKs

KDP exposes SDK metadata for:

- TypeScript
- Flutter
- Kotlin
- Swift
- Python
- Java
- Go

The SDK metadata is derived from the same versioned API specification used by the developer docs and gateway.

## CLI

Run the CLI through the workspace:

```powershell
npm.cmd run kdp -- help
npm.cmd run kdp -- init
npm.cmd run kdp -- status
```

Set `KRAVIA_API_BASE_URL` and `KRAVIA_API_KEY` for gateway-backed commands.

## Validation

The KDP automated test covers developer account setup, OAuth app creation, hashed API keys, gateway logging, key rotation/revocation, plugin review, webhook signing, SDK metadata, and usage analytics.

Run:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```
