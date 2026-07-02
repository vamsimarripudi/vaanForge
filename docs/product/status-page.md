# VaanForge Status Page

The status subdomain publishes service state and incidents without fake uptime or invented monitoring data.

## Services

Tracked services include API, Auth, AI Providers, Factory, Agents, Billing, Marketplace, Deployments, Files/Storage, Email, Webhooks, Docs, and Support.

## Data model

- `status_services`
- `status_incidents`
- `status_incident_updates`
- `status_subscribers`
- `status_health_checks`

## APIs

- `GET /api/v1/status`
- `GET /api/v1/status/services`
- `GET /api/v1/status/incidents`
- `GET /api/v1/status/incidents/:incidentId`
- `GET /api/v1/status/history`
- `POST /api/v1/status/subscribe`
- `POST /api/v1/admin/status/incidents`
- `PATCH /api/v1/admin/status/incidents/:incidentId`
- `POST /api/v1/admin/status/incidents/:incidentId/update`
- `POST /api/v1/admin/status/services`
- `PATCH /api/v1/admin/status/services/:serviceId`

## Public trust rule

If monitoring is not connected, the service state is `monitoring_setup_required`. The product must not display fake uptime percentages.
