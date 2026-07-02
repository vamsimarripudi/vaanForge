# Admin Support Center

The admin support center runs on `admin.vaanforge.com/support`.

## Capabilities

- Support dashboard
- Ticket queue
- Ticket assignment
- Escalation
- Internal notes
- Knowledge base publishing
- Announcements
- Reports

## Contracts

- `GET /api/v1/admin/support/dashboard`
- `GET /api/v1/admin/support/tickets`
- `GET /api/v1/admin/support/tickets/:ticketId`
- `PATCH /api/v1/admin/support/tickets/:ticketId`
- `POST /api/v1/admin/support/tickets/:ticketId/assign`
- `POST /api/v1/admin/support/tickets/:ticketId/escalate`
- `POST /api/v1/admin/support/tickets/:ticketId/internal-note`
- `POST /api/v1/admin/support/kb`
- `PATCH /api/v1/admin/support/kb/:id`
- `POST /api/v1/admin/support/announcements`
- `PATCH /api/v1/admin/support/announcements/:id`
- `GET /api/v1/admin/support/reports`

## Security

All routes require admin support permission. Every admin action is audited. Internal notes never appear in customer ticket views.

