# Backend

Backend location: `backend/`.

Required backend structure lives under `backend/src`: `config`, `modules`, `common`, `middlewares`, `guards`, `interceptors`, `validators`, `jobs`, `database`, `services`, and `utils`.

PDF example modules `auth`, `users`, `roles`, `finance`, `crm`, `support`, `hr`, `legal`, and `compliance` expose boundary folders named `controller`, `service`, `repository`, `dto`, `validation`, and `routes`. Existing Express implementations continue to live in the established `*.routes.ts`, `*.service.ts`, and `*.repository.ts` files, with these folders reserved for future splits when a module grows.

The API currently uses Express because it keeps the initial scaffold readable and fast to extend. The module structure is compatible with a later NestJS migration if the team decides it is needed.

Important services:

- `auth.service.ts`
- `plans.service.ts`
- `entitlements.service.ts`
- `audit.service.ts`
- `workspaces.service.ts`
- `notifications.service.ts`
- `dashboard.service.ts`
- `finance.service.ts`
- `tasks.service.ts`
- `crm.service.ts`
- `support.service.ts`
- `hr.service.ts`
- `legal.service.ts`
- `compliance.service.ts`
- `creators.service.ts`
- `partners.service.ts`
- `communication.service.ts`
- `automation.service.ts`
- `intelligence.service.ts`
- `settings.service.ts`
- `files.service.ts`
- `job.service.ts`
- `memory.service.ts`
- `realtime.service.ts`

Business modules must depend on services, not adapters.

Verified:

- Backend foundation tests pass.
- Backend TypeScript check passes.
- Root production build passes.
- API route security contract checks pass for authentication and permission guard coverage.

Finance formulas:

- P&L gross profit = revenue total - expense total.
- Profit margin = gross profit / revenue total * 100.
- GST payable = max(output GST on revenue - input GST credit on expenses, 0).
- Net cash flow = cash in - cash out.
- Finance analytics add founder payout planning, product-wise revenue, product-wise profit, and CA export metadata through `/api/v1/finance/analytics`.

Report exports:

- Excel-compatible exports are generated as CSV content.
- PDF-style exports are generated as printable HTML until a binary PDF renderer is connected.
- CA exports are available through the existing finance/report export pipeline with report type `CA_EXPORT`.
- Report exports are also written through the storage provider abstraction; local development uses an in-memory object store.
- File uploads are accepted through `POST /api/v1/files/uploads` using `contentBase64`, `fileName`, `mimeType`, folder, tags, version, expiry date, and document type metadata; uploads are stored through the same local/S3-compatible storage abstraction and audited with `FILE_UPLOADED`.
- PDF route compatibility aliases live in `backend/src/modules/aliases/pdf-api-aliases.routes.ts`, exposing `/api/v1/customers`, `/api/v1/clients`, `/api/v1/leads`, `/api/v1/sales`, `/api/v1/projects`, `/api/v1/documents`, `/api/v1/employees`, `/api/v1/candidates`, and `/api/v1/interviews` while reusing existing services.
- Background jobs go through `backend/src/infrastructure/jobs/job.service.ts`; report exports enqueue `REPORT_EXPORT_REQUESTED` and automation rule creation enqueues `AUTOMATION_RULE_CREATED` through the memory adapter queue hook.
- Realtime updates go through `realtime.service.ts`; notifications, realtime task updates, realtime support conversations, and realtime approval updates publish organization-scoped events while VaanRTC/SFU adapters remain launch-gated.
- Memory, cache, queue, pub/sub, presence, rate-limit, and temporary workflow state must go through `memory.service.ts` so Redis can remain a development adapter and Vaanis can replace it without changing business modules.
- Intelligence generation goes through the AI provider abstraction; local development uses deterministic generation.
- Billing supports `/api/v1/billing/summary` for active plan, payment status, invoices, renewal dates, renewal reminders, and payment-provider readiness. Trial and checkout steps remain explicit through `/api/v1/billing/trial` and `/api/v1/billing/checkout`; null-priced plans return a price-pending state.
- Promotions and marketing operations are exposed through `/api/v1/creators/promotions`, combining creator profiles and campaign records into campaign, social post, approval, budget, performance, and content-calendar signals.
- Creator Portal operations are exposed through `/api/v1/creators/creator-portal`, covering campaigns, creator billing, content ideas, concept sharing, approval flow, brand guidelines, payouts, and performance tracking.
- Customer Portal operations are exposed through `/api/v1/crm/customer-portal`, composing customer subscriptions, invoices, support-ticket links, product access, announcements, documents, and renewal status.
- Reports OS is exposed through `/api/v1/reports/operating-system`, cataloging P&L, GST, cash flow, sales, hiring, support, compliance, founder monthly, Excel, and PDF report coverage.
- Automation OS is exposed through `/api/v1/automation/operating-system`, covering triggers, actions, conditions, approval rules, follow-up automation, renewal reminders, report generation, and task creation.
- Intelligence OS is exposed through `/api/v1/intelligence/operating-system`, covering report explanations, next task suggestions, risk detection, follow-up suggestions, drafted communications, ticket summaries, interview summaries, the financial assistant, and the sales assistant.
- Settings OS is exposed through `/api/v1/settings/operating-system`, covering company profile, users, roles, permissions, themes, domains, billing, notifications, templates, security controls, and API keys placeholder status.
- Sales and CRM operations are exposed through `/api/v1/crm/sales-operations`, deriving deals, follow-ups, demo scheduling, proposals, objections, renewals, and sales psychology guidance from CRM leads and customers.
- Legal operations are exposed through `/api/v1/legal/operating-system`, covering the agreement catalog, public policy register, and legal awareness notes.
- Compliance operations are exposed through `/api/v1/compliance/operating-system`, covering incorporation, GST, PAN/TAN, DIN/DSC, MCA/ROC, trademark, Startup India, MSME/Udyam, compliance calendar, filing reminders, and risk summary.
- Work allocation operations are exposed through `/api/v1/tasks/work-allocation`, covering task/project allocation, owners, due dates, priorities, statuses, comments, attachments, recurring task templates, and allocation rules.
- Communication operations are exposed through `/api/v1/communication/operating-system`, covering notifications, announcements, direct messages, team channels, support conversations, customer follow-ups, email templates, SMS templates, and routing rules.
- Partner collaboration operations are exposed through `/api/v1/partners/collaboration-os`, covering partners, collabs, revenue share, agreements, tasks, approvals, and communications.
