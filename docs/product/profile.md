# Profile Subdomain

`profile.vaanforge.com` is the user-owned account surface for VaanForge.

## Purpose

Profile keeps personal account data separate from workspace administration. It exposes identity, sessions, login history, usage, billing summary, API key summary, notifications, and activity.

## Routes

- `/`
- `/overview`
- `/personal-info`
- `/security`
- `/sessions`
- `/usage`
- `/plan`
- `/api-keys`
- `/notifications`
- `/activity`

## Backend Contracts

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `POST /api/v1/profile/avatar`
- `POST /api/v1/profile/change-password`
- `GET /api/v1/profile/sessions`
- `DELETE /api/v1/profile/sessions/:sessionId`
- `GET /api/v1/profile/login-history`
- `GET /api/v1/profile/usage-summary`
- `GET /api/v1/profile/billing-summary`
- `GET /api/v1/profile/api-keys-summary`
- `GET /api/v1/profile/activity`

## Security

All profile routes require `authMiddleware`. Mutations require `profile:manage`. API key summaries never expose full secrets.

