# Support Subdomain

`support.vaanforge.com` is the customer support surface for tickets, knowledge base, announcements, status, feedback, billing help, API support, bug reports, and security reports.

## Routes

- `/dashboard`
- `/tickets`
- `/tickets/new`
- `/tickets/:ticketId`
- `/knowledge-base`
- `/announcements`
- `/status`
- `/feedback`
- `/bug-report`
- `/billing-help`
- `/api-support`
- `/security-report`

## Contracts

- `POST /api/v1/support/tickets`
- `GET /api/v1/support/tickets`
- `GET /api/v1/support/tickets/:ticketId`
- `POST /api/v1/support/tickets/:ticketId/messages`
- `POST /api/v1/support/tickets/:ticketId/attachments`
- `POST /api/v1/support/tickets/:ticketId/close`
- `POST /api/v1/support/tickets/:ticketId/reopen`
- `GET /api/v1/support/announcements`
- `GET /api/v1/support/kb`
- `GET /api/v1/support/kb/:articleSlug`
- `GET /api/v1/support/status`
- `POST /api/v1/support/feedback`

## Privacy

Customers only see their own tickets. Internal support notes are hidden from customer responses.

