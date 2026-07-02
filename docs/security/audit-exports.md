# Audit Exports

Audit exports provide enterprise customers and admins with searchable exportable records of sensitive actions.

## APIs

- `GET /api/v1/audit-logs`
- `POST /api/v1/audit-logs/export`
- `GET /api/v1/admin/audit/exports`

## Supported Formats

- CSV
- JSON

## Filters

- actor
- action
- target
- result
- organization
- workspace
- date range
- risk level where available

## Security

Exports require authenticated access and export permission. Export creation writes an audit log. Secrets and raw provider credentials must never appear in audit metadata.
