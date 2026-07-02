# Agents Subdomain

`agents.vaanforge.com` is the operational surface for agent runs, roles, brains, outputs, logs, and handoffs.

## Contracts

- `POST /api/v1/agents/runs`
- `GET /api/v1/agents/runs`
- `GET /api/v1/agents/runs/:runId`
- `POST /api/v1/agents/runs/:runId/pause`
- `POST /api/v1/agents/runs/:runId/resume`
- `POST /api/v1/agents/runs/:runId/cancel`
- `GET /api/v1/agents/runs/:runId/events`
- `GET /api/v1/agents/runs/:runId/logs`
- `GET /api/v1/agents/runs/:runId/outputs`
- `GET /api/v1/agents/runs/:runId/handoffs`
- `GET /api/v1/agents/roles`
- `POST /api/v1/agents/roles`
- `PATCH /api/v1/agents/roles/:roleId`
- `GET /api/v1/agents/brains`
- `GET /api/v1/agents/brains/:brainId`
- `PATCH /api/v1/agents/brains/:brainId`

Agent role and brain records are persisted through the existing agent team system.

