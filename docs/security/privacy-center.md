# Data Privacy Center

The privacy center gives users and admins controlled workflows for exports, deletion requests, retention visibility, and policy history.

## User APIs

- `GET /api/v1/settings/data-privacy`
- `POST /api/v1/settings/data-privacy/export`
- `POST /api/v1/settings/data-privacy/delete-request`

## Admin APIs

- `GET /api/v1/admin/privacy/export-requests`
- `GET /api/v1/admin/privacy/delete-requests`
- `PATCH /api/v1/admin/privacy/delete-requests/:requestId`

## Rules

- Export and deletion requests are database-backed.
- Workspace-level deletion is not immediate; admin review is required.
- Every request has status, due date, next action, and activity history.
- Every admin decision is audited.
- Sensitive data must be minimized in exports.

## Status Flow

`pending -> completed / rejected`

Rejected requests must include a safe explanation for the customer. Completed requests must leave an audit trail.
