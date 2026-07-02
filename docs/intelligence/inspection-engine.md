# Inspection Engine

Automated inspections are triggered through `/api/v1/admin/intelligence/inspections/run`.

## Cadence

- daily
- weekly
- monthly

## Checks

- unused API keys
- unused workspaces
- inactive users
- expired webhooks
- large files
- storage growth
- failed jobs
- security warnings
- missing documentation
- open critical bugs

Inspection results include status, evidence, and recommended action.

