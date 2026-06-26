# VaanForge AI Agent

VaanForge receives validated VFormix requirement JSON and generates a production blueprint for the VMNexus ecosystem.

## API

- `POST /api/v1/vaanforge/runs` creates a run from requirement JSON.
- `GET /api/v1/vaanforge/runs` lists runs for the current organization.
- `GET /api/v1/vaanforge/runs/:runId` reads input, outputs, status, errors, activity history, next action, and audit logs.
- `GET /api/v1/vaanforge/runs/:runId/requirements` reads the validated input.
- `GET /api/v1/vaanforge/runs/:runId/plans` reads generated PRD, architecture, folder, database, API, UI, sprint, and Codex prompt outputs.
- `GET /api/v1/vaanforge/runs/:runId/audit-logs` reads run-local audit logs.
- `/api/v1/vaanforge/admin/...` mirrors monitoring endpoints for admin dashboards.

## Workflow

Runs move through `pending`, `analyzing`, `planned`, `completed`, or `failed`.
Every phase writes activity history and audit logs. The service validates the current phase before advancing.

## Required Input

Required fields include product identity, source, owner, priority, due date, business context, core features, accepted VMNexus architecture, design system, routes, and permissions.
