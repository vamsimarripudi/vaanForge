# Developer Portal

`developers.vaanforge.com` is the developer integration surface for apps, API keys, webhooks, SDK metadata, usage, and logs.

## Contracts

- `POST /api/v1/developer/apps`
- `GET /api/v1/developer/apps`
- `GET /api/v1/developer/apps/:appId`
- `PATCH /api/v1/developer/apps/:appId`
- `DELETE /api/v1/developer/apps/:appId`
- `POST /api/v1/developer/api-keys`
- `GET /api/v1/developer/api-keys`
- `DELETE /api/v1/developer/api-keys/:keyId`
- `POST /api/v1/developer/webhooks`
- `GET /api/v1/developer/webhooks`
- `PATCH /api/v1/developer/webhooks/:webhookId`
- `DELETE /api/v1/developer/webhooks/:webhookId`
- `POST /api/v1/developer/webhooks/:webhookId/test`
- `GET /api/v1/developer/usage`
- `GET /api/v1/developer/logs`

API keys are hashed at rest. Full keys and webhook signing secrets are only returned at creation or test time.

