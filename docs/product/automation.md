# Automation Center

The automation center lets workspaces react to lifecycle events.

## Supported Triggers

- Deployment succeeded
- Blueprint approved
- Credits low
- Payment failed
- AI finished
- Ticket created
- Renewal due

## Supported Actions

- Send notification
- Send email
- Call webhook
- Create task
- Request approval
- Queue report

## APIs

- `GET /api/v1/automation/summary`
- `GET /api/v1/automation/rules`
- `POST /api/v1/automation/rules`
- `GET /api/v1/automation/operating-system`

Rules are database-backed and rule creation writes audit logs.
