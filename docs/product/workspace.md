# Workspace Setup

Workspace setup is a guided autosave wizard for identity, defaults, and integrations.

## Sections

- Workspace name
- Logo
- Timezone
- Default AI provider
- Notifications
- Team invitations
- Brand colors
- Project defaults
- Deployment defaults
- Integrations

## APIs

- `GET /api/v1/onboarding/workspace-setup`
- `PATCH /api/v1/onboarding/workspace-setup`

Sensitive changes are audited as `SETTINGS_CHANGED`.
