# API

Base route: `/api/v1`.

Implemented foundation routes:

- `GET /api/v1/health`
- `GET /api/v1/system/readiness`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`
- `GET /api/v1/onboarding`
- `GET /api/v1/plans`
- `GET /api/v1/plans/:planId`
- `POST /api/v1/entitlements/check` authenticated
- `GET /api/v1/audit`
- `GET /api/v1/audit/summary`
- `POST /api/v1/audit`
- `GET /api/v1/roles`
- `POST /api/v1/roles/check`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `PATCH /api/v1/notifications/:notificationId/read`
- `GET /api/v1/dashboard/founder`
- `GET /api/v1/dashboard/suite/:suiteType`
- `GET /api/v1/finance/summary`
- `GET /api/v1/finance/revenue`
- `POST /api/v1/finance/revenue`
- `GET /api/v1/finance/expenses`
- `POST /api/v1/finance/expenses`
- `GET /api/v1/finance/pnl`
- `GET /api/v1/finance/gst`
- `GET /api/v1/finance/cash-flow`
- `GET /api/v1/finance/analytics`
- `POST /api/v1/finance/exports`
- `GET /api/v1/finance/exports`
- `GET /api/v1/finance/exports/:exportId/download`
- `GET /api/v1/reports/exports`
- `GET /api/v1/reports/operating-system`
- `POST /api/v1/reports/exports`
- `GET /api/v1/reports/exports/:exportId/download`
- `POST /api/v1/files/uploads`
- `GET /api/v1/billing/summary`
- `POST /api/v1/billing/trial`
- `POST /api/v1/billing/checkout`
- `GET /api/v1/tasks/summary`
- `GET /api/v1/tasks/work-allocation`
- `GET /api/v1/tasks/projects`
- `POST /api/v1/tasks/projects`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:taskId/assign`
- `PATCH /api/v1/tasks/:taskId/status`
- `GET /api/v1/crm/summary`
- `GET /api/v1/crm/sales-operations`
- `GET /api/v1/crm/customer-portal`
- `GET /api/v1/crm/leads`
- `POST /api/v1/crm/leads`
- `PATCH /api/v1/crm/leads/:leadId/stage`
- `GET /api/v1/crm/customers`
- `POST /api/v1/crm/customers`
- `GET /api/v1/support/summary`
- `GET /api/v1/support/operations`
- `GET /api/v1/support/tickets`
- `POST /api/v1/support/tickets`
- `GET /api/v1/support/tickets/:ticketId/messages`
- `POST /api/v1/support/tickets/:ticketId/messages`
- `PATCH /api/v1/support/tickets/:ticketId/status`
- `GET /api/v1/hr/summary`
- `GET /api/v1/hr/team-operations`
- `GET /api/v1/hr/departments`
- `POST /api/v1/hr/departments`
- `GET /api/v1/hr/employees`
- `POST /api/v1/hr/employees`
- `GET /api/v1/hr/candidates`
- `POST /api/v1/hr/candidates`
- `PATCH /api/v1/hr/candidates/:candidateId/stage`
- `GET /api/v1/hr/interviews`
- `POST /api/v1/hr/interviews`
- `PATCH /api/v1/hr/interviews/:interviewId/score`
- `GET /api/v1/legal/summary`
- `GET /api/v1/legal/operating-system`
- `GET /api/v1/legal/agreements`
- `POST /api/v1/legal/agreements`
- `PATCH /api/v1/legal/agreements/:agreementId/status`
- `GET /api/v1/compliance/summary`
- `GET /api/v1/compliance/operating-system`
- `GET /api/v1/compliance/items`
- `POST /api/v1/compliance/items`
- `PATCH /api/v1/compliance/items/:itemId/status`
- `GET /api/v1/compliance/registrations`
- `POST /api/v1/compliance/registrations`
- `PATCH /api/v1/compliance/registrations/:registrationId/status`
- `GET /api/v1/creators/summary`
- `GET /api/v1/creators/promotions`
- `GET /api/v1/creators/creator-portal`
- `GET /api/v1/creators/profiles`
- `POST /api/v1/creators/profiles`
- `GET /api/v1/creators/campaigns`
- `POST /api/v1/creators/campaigns`
- `GET /api/v1/partners/summary`
- `GET /api/v1/partners/collaboration-os`
- `GET /api/v1/partners`
- `POST /api/v1/partners`
- `GET /api/v1/communication/summary`
- `GET /api/v1/communication/operating-system`
- `GET /api/v1/communication`
- `POST /api/v1/communication`
- `GET /api/v1/automation/summary`
- `GET /api/v1/automation/operating-system`
- `GET /api/v1/automation/rules`
- `POST /api/v1/automation/rules`
- `GET /api/v1/intelligence/summary`
- `GET /api/v1/intelligence/latest`
- `GET /api/v1/intelligence/operating-system`
- `GET /api/v1/settings/summary`
- `GET /api/v1/settings/operating-system`
- `PATCH /api/v1/settings`

PDF route compatibility aliases:

- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `GET /api/v1/organizations`
- `GET /api/v1/users`
- `POST /api/v1/users/invite`
- `GET /api/v1/revenue`
- `POST /api/v1/revenue`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `GET /api/v1/pnl`
- `GET /api/v1/gst`
- `GET /api/v1/cash-flow`
- `GET /api/v1/clients`
- `GET /api/v1/leads`
- `POST /api/v1/leads`
- `GET /api/v1/sales`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/documents/uploads`
- `POST /api/v1/documents/uploads`
- `GET /api/v1/employees`
- `POST /api/v1/employees`
- `GET /api/v1/candidates`
- `POST /api/v1/candidates`
- `GET /api/v1/interviews`
- `POST /api/v1/interviews`

These aliases preserve the PDF's named REST route groups while reusing the existing auth, workspace, finance, CRM, tasks, HR, and file-storage services. The onboarding route returns the suite-first field catalog and workspace activation handoff needed before creating a workspace.

Every future API must include validation, authentication, permission checks, error handling, and audit logging where required. `npm run test:e2e` includes source-level API security, API route catalog, and CSRF contract checks that fail when non-public routes omit authentication, PDF-named route groups drift from the Express/API docs catalog, mutating routes omit a permission guard without an explicit authenticated self-service exception, or the CSRF public mutation bypass list drifts.
Sensitive mutating APIs are also covered by the audit contract check in `npm run test:e2e`.

Password reset requests use the configured email provider. In local development, reset messages are written to the local email outbox.
The frontend account area exposes registration, sign-in, session visibility, CSRF-protected logout, reset-link request, and reset-token confirmation surfaces.
The frontend operations area surfaces launch readiness checks from `/api/v1/system/readiness`.
File uploads use `contentBase64`, `fileName`, `mimeType`, folder, tags, version, expiry date, and document type metadata, write through the storage provider abstraction, and record `FILE_UPLOADED` audit entries.
