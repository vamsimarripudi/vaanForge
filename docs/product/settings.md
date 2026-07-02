# Settings Subdomain

`settings.vaanforge.com` is the user and workspace control center.

## Scope

Settings covers account preferences, workspace identity, team management, billing, usage, API keys, AI preferences, notifications, security, data privacy, integrations, developer settings, and support entry points.

## Backend Contracts

- `GET/PATCH /api/v1/settings/account`
- `GET/PATCH /api/v1/settings/workspace`
- `GET /api/v1/settings/team`
- `POST /api/v1/settings/team/invite`
- `PATCH/DELETE /api/v1/settings/team/:memberId`
- `GET /api/v1/settings/billing`
- `GET /api/v1/settings/usage`
- `GET /api/v1/settings/limits`
- `GET /api/v1/settings/invoices`
- `GET /api/v1/settings/api-keys`
- `GET/PATCH /api/v1/settings/ai-preferences`
- `GET/PATCH /api/v1/settings/notifications`
- `GET/PATCH /api/v1/settings/security`
- `GET /api/v1/settings/data-privacy`
- `POST /api/v1/settings/data-privacy/export`
- `POST /api/v1/settings/data-privacy/delete-request`
- `GET/PATCH /api/v1/settings/integrations`

## Rules

Every sensitive mutation is audited. Workspace and team changes require `settings:manage`. Data export and deletion requests are stored as reviewable records.

