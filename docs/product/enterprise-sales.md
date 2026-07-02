# VaanForge Enterprise Sales

The enterprise subdomain captures enterprise leads, demo requests, solution pages, and security information.

## Data model

- `enterprise_leads`
- `enterprise_demo_requests`
- `enterprise_sales_notes`
- `enterprise_solution_pages`

## Public APIs

- `POST /api/v1/enterprise/contact-sales`
- `POST /api/v1/enterprise/demo-request`
- `GET /api/v1/enterprise/solutions`
- `GET /api/v1/enterprise/security`

## Admin APIs

- `GET /api/v1/admin/enterprise/leads`
- `GET /api/v1/admin/enterprise/demo-requests`
- `PATCH /api/v1/admin/enterprise/leads/:leadId`

## Rules

No fake customer logos or unsupported compliance claims. Enterprise plan pricing remains custom and must connect to billing/sales workflows before contract execution.
