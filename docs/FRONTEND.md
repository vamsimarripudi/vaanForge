# Frontend

Frontend location: `frontend/`.

PDF structure compatibility paths:

- `/apps/web` maps to `frontend/`.
- `/apps/api` maps to `backend/`.
- `/packages/ui` maps to `design-system/`.
- `/packages/config` maps to `shared/config/`, `frontend/src/config/`, and environment documentation.
- `/packages/types` maps to `shared/src/` and `frontend/src/types/`.
- `/packages/utils` maps to `frontend/src/utils/` and `shared/src/`.
- `/packages/docs` maps to `docs/`.

Required frontend folders exist under `frontend/src`: `app`, `pages`, `components`, `layouts`, `features`, `hooks`, `services`, `store`, `utils`, `constants`, `assets`, `styles`, and `types`. PDF-named feature folders exist for auth, onboarding, dashboard, finance, HR, sales, support, legal, compliance, documents, settings, and reports; each contains components, pages, hooks, services, and types subfolders. Sales/documents/reports point to their implemented CRM, file, and reports surfaces.

Implemented routes:

- `/`
- `/features`
- `/about`
- `/contact`
- `/terms`
- `/privacy`
- `/refund`
- `/data-policy`
- `/admin`
- `/pricing`
- `/billing`
- `/onboarding`
- `/account`
- `/account/reset-password`
- `/founder/dashboard`
- `/finance`
- `/planning`
- `/operations`
- `/crm`
- `/client`
- `/customer`
- `/support`
- `/hr`
- `/hiring`
- `/interviews`
- `/legal`
- `/marketing`
- `/compliance`
- `/registrations`
- `/creator`
- `/partners`
- `/communication`
- `/automation`
- `/intelligence`
- `/settings`
- `/education/dashboard`
- `/education`
- `/education/onboarding`
- `/education/students`
- `/education/teachers`
- `/education/meetings`
- `/education/forms`
- `/education/support`
- `/education/settings`
- `/vmetron/dashboard`
- `/vmetron`
- `/vmetron/onboarding`
- `/vmetron/events`
- `/vmetron/registrations`
- `/vmetron/meetings`
- `/vmetron/forms`
- `/vmetron/promotions`
- `/vmetron/support`
- `/vmetron/settings`
- `/reports`

UI states are represented with shared state panels for loading, empty, error, and success. Each future module must include these states.

Theme modes:

- Light.
- Dark.
- System.

Current frontend verification:

- Frontend typecheck passes.
- Frontend production build passes.
- Onboarding collects founder name, company name, business type, country, industry, team size, products needed, pain points, revenue stage, preferred plan, required portals, compliance needs, and support needs; it stores recommended modules for workspace activation and is guarded by `scripts/qa-onboarding-contract.js`.
- Workspace activation hands users into dashboard activation links for founder, selected suite, operations, and settings.
- Education and VMetron suite dashboards load live suite summaries from `/api/v1/dashboard/suite/:suiteType`, including active plan, enabled products, finance, operations, support, growth, hiring, and compliance signals. PDF-required suite routes now exist for onboarding, education students/teachers/meetings/forms/support/settings, and VMetron events/registrations/meetings/forms/promotions/support/settings.
- Module dashboards expose loading, empty, error, and success states through `StatePanel`; `scripts/qa-state-contract.js` keeps API failures mapped to error states instead of silent empty states.
- Public website routes cover landing, features, about, contact, terms, privacy, refund policy, and data policy pages.
- Business Planning OS route covers ideas, goals, OKRs, roadmaps, business model, launch plan, daily notes, weekly reviews, and monthly reviews.
- File uploads are available from Settings, send content through the storage abstraction, surface storage key/checksum responses, and are guarded by `scripts/qa-file-upload-contract.js`. Document OS metadata captures folders, tags, versioning, expiry reminders, agreements, invoices, legal docs, HR docs, CA docs, and customer docs.
- Founder dashboard notifications can be sent, refreshed, and marked read through CSRF-backed notification workflows.
- Settings includes role setup controls that load the role matrix and run CSRF-protected permission checks through `/api/v1/roles/check`.
- Settings includes a CSRF-protected admin preferences form for theme mode, billing email, and notification toggles through `/api/v1/settings`, plus Settings OS from `/api/v1/settings/operating-system` for company profile, users, roles, permissions, themes, domains, billing, notifications, templates, security, and API keys placeholder status.
- Billing includes a live Billing & Invoice System panel backed by `/api/v1/billing/summary`, covering payment status, invoice status, renewal status, renewal date, reminders, and payment-provider readiness.
- Settings includes audit summary, recent audit entries, refresh, and CSRF-backed manual audit entry controls through `/api/v1/audit`.
- Route smoke, UI interaction, module state, API security, API route catalog, frontend structure, CSRF, CI workflow, environment, database, provider readiness, audit coverage, phase documentation, domain configuration, pricing placeholder, dependency hygiene, QA documentation, and infrastructure contract checks pass through `npm run test:e2e`.
- Pricing exposes the backend plan catalog through `/api/v1/plans` and selected plan lookup, plus plan-card entitlement checks, trial controls, and checkout controls; current placeholder prices render as price-pending until commercial approval.
- Finance and operations dashboards expose protected forms for revenue, expenses, finance export queueing/downloads, projects, tasks, task assignment, and task status updates; UI interaction contracts require CSRF-backed API calls for these workflows. Operations also shows recent project and task records from `/api/v1/tasks/projects` and `/api/v1/tasks`, plus Work Allocation OS panels from `/api/v1/tasks/work-allocation` for comments, attachments, recurring tasks, and allocation rules.
- CRM and support dashboards expose protected forms for leads, customers, lead stage updates, support tickets, ticket messages, and ticket status updates. CRM shows recent lead and customer records from `/api/v1/crm/leads` and `/api/v1/crm/customers`, plus Sales & CRM OS operations from `/api/v1/crm/sales-operations` for deals, follow-ups, demo scheduling, proposals, objections, renewals, and sales psychology guidance. Support shows recent tickets and selected ticket messages from `/api/v1/support/tickets`, plus SLA rules, escalation paths, live chat mode, and knowledge-base guidance from `/api/v1/support/operations`.
- Customer portal exposes protected forms for customer records and customer-linked support tickets. It also renders Customer Portal OS from `/api/v1/crm/customer-portal`, covering subscription, invoices, support tickets, product access, announcements, documents, and renewal status.
- Client portal exposes projects, proposals, agreements, meetings, deliverables, invoices, documents, and support handoffs across existing operating modules.
- HR, hiring, and interview dashboards expose protected forms for departments, employees, candidates, candidate stage updates, interviews, and interview scorecards. HR also shows Team OS operations from `/api/v1/hr/team-operations`, covering org chart, attendance, leaves, performance signals, and access-control guidance.
- Legal, compliance, and registration dashboards expose protected forms for agreements, agreement status updates, compliance items, compliance item status updates, government registrations, and registration status updates. Legal also shows recent agreement records from `/api/v1/legal/agreements` and Legal OS operations from `/api/v1/legal/operating-system`, including agreement catalog, policy register, and legal awareness notes. Compliance shows registration catalog, compliance calendar, filing reminders, and risk summary from `/api/v1/compliance/operating-system`.
- Creator dashboard uses the shared growth workflow renderer for CSRF-backed creator profile and campaign creation plus recent profile and campaign lists; it also includes Creator Portal OS backed by `/api/v1/creators/creator-portal` for campaigns, creator billing, content ideas, concept sharing, approval flow, brand guidelines, payouts, and performance tracking. Partner, communication, automation, and settings dashboards use the same renderer for their protected workflows. Partner, communication, and automation dashboards also show recent records through list APIs.
- Partner also exposes a Partner & Collaboration OS panel backed by `/api/v1/partners/collaboration-os`, covering collaborations, revenue share, agreements, tasks, approvals, and communications.
- Communication also exposes a Communication OS panel backed by `/api/v1/communication/operating-system`, covering notifications, channel catalog, email templates, SMS templates, and routing rules.
- Marketing exposes Promotions & Marketing OS at `/marketing`, backed by `/api/v1/creators/promotions`, covering campaigns, social posts, creator collaborations, approval queue, budget, performance tracking, and content calendar.
- Automation exposes Automation OS at `/automation`, backed by `/api/v1/automation/operating-system`, covering triggers, actions, conditions, approval rules, follow-up automation, renewal reminders, report generation, and task creation.
- Reports exposes Reports OS at `/reports`, backed by `/api/v1/reports/operating-system`, covering P&L, GST, cash flow, sales, hiring, support, compliance, founder monthly, Excel download, and PDF download report coverage.
- Intelligence dashboard generates deterministic local summaries through `/api/v1/intelligence/summary`, shows the latest persisted snapshot from `/api/v1/intelligence/latest`, and exposes Intelligence OS from `/api/v1/intelligence/operating-system` for report explanations, next task suggestions, risk detection, follow-up suggestions, drafted communications, ticket summaries, interview summaries, the financial assistant, and the sales assistant.
- Account UI includes founder registration, sign-in, current session visibility, CSRF-protected logout, password reset request, and reset confirmation.

Finance route:

- Shows revenue, expenses, gross profit, profit margin, GST payable, net cash flow, founder payout planning, product-wise revenue, product-wise profit, CA export metadata, and finance report export queue/download state.

Operations route:

- Shows task allocation metrics and launch readiness counts from the system readiness endpoint.
