# CRM

The CRM supports KRAVIA sales operations for VaanForge.

## Objects

- leads
- contacts
- companies
- opportunities
- tasks
- activity history

## Pipeline

`NEW_LEAD -> QUALIFIED -> DEMO_SCHEDULED -> PROPOSAL_SENT -> NEGOTIATION -> WON -> CUSTOMER`

## APIs

- `POST /api/v1/crm/leads`
- `GET /api/v1/crm/leads`
- `PATCH /api/v1/crm/leads/:leadId`
- `GET /api/v1/crm/opportunities`
- `POST /api/v1/crm/opportunities`
- `PATCH /api/v1/crm/opportunities/:id`

Mutations require authenticated organization management permission. Opportunity updates write audit records through the business operations service.
