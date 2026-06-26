# Database

Primary database: PostgreSQL.

ORM: Prisma.

Schema file: `backend/prisma/schema.prisma`.

Runtime persistence is controlled by `PERSISTENCE_MODE`.

- `memory`: local demo and smoke-test mode backed by `backend/src/database/in-memory-store.ts`.
- `postgres`: production target backed by PostgreSQL and Prisma.

See `docs/PERSISTENCE.md` for the readiness checklist and launch switch steps.

Production migration command:

```bash
npm run db:migrate:deploy
```

Use `npm run prisma:migrate --workspace backend` only for local development migrations.

Initial migration SQL lives in `backend/prisma/migrations/20260618180000_initial_schema/migration.sql`.
PDF entity foundation SQL lives in `backend/prisma/migrations/20260619100000_pdf_entity_foundations/migration.sql`.
Report exports include storage provider, key, and URL metadata for externally stored files.
ProductType includes Vidyaluma, VaanMeet, VFormix, VMetron, Support, Customer Portal, Client Portal, Billing, Reports, Communication, and Promotions (`VIDYALUMA`, `VAANMEET`, `VFORMIX`, `VMETRON`, `SUPPORT`, `CUSTOMER_PORTAL`, `CLIENT_PORTAL`, `BILLING`, `REPORTS`, `COMMUNICATION`, `PROMOTIONS`).

Demo seed data:

- Run `npm run seed:demo` to create a local demo founder workspace.
- The seed covers workspace, finance, reports, tasks, CRM, customer, support, HR, hiring, interviews, legal, compliance, registrations, creators, partners, communication, automation, settings, and intelligence data.
- Use seed data only in local/demo environments.

Repository migration status:

- Automation has memory and Prisma repository implementations for rules.
- Auth has memory and Prisma repository implementations for users, password hashes, roles, and organization assignment.
- Communication has memory and Prisma repository implementations for messages and announcements.
- Compliance/government registrations has memory and Prisma repository implementations for compliance items, registrations, and status updates.
- Creators has memory and Prisma repository implementations for profiles and campaigns.
- CRM/customers has memory and Prisma repository implementations for leads, customers, and lead stages.
- Finance has memory and Prisma repository implementations for revenue, expenses, and report exports.
- HR/interviews has memory and Prisma repository implementations for departments, employees, candidates, interviews, interview scoring, and offer counts.
- Intelligence has memory and Prisma repository implementations for generated snapshots.
- Legal has memory and Prisma repository implementations for agreements and document status.
- Partners has memory and Prisma repository implementations for partner records and revenue share.
- Settings has memory and Prisma repository implementations.
- Support has memory and Prisma repository implementations for tickets, messages, and ticket status.
- Tasks has memory and Prisma repository implementations for projects, task assignment, and task status updates.
- Workspaces has memory and Prisma repository implementations for organizations, workspaces, subscriptions, entitlements, and activation notifications.
- Remaining modules: none in the current business-module set; future modules should follow the same repository pattern before receiving real customer data.

Initial models include:

- User.
- PasswordResetToken.
- Organization.
- Product.
- Role.
- Permission.
- Workspace.
- Plan.
- OrganizationSubscription.
- Subscription.
- Payment.
- Invoice.
- ProductEntitlement.
- UsageRecord.
- AuditLog.
- Notification.
- Revenue.
- Expense.
- GSTRecord.
- CashFlowRecord.
- PnLReport.
- ReportExport.
- Project.
- Task.
- Client.
- Deal.
- Lead.
- Customer.
- SupportTicket.
- TicketMessage.
- Department.
- Employee.
- Candidate.
- Interview.
- Approval.
- Offer.
- Agreement.
- ComplianceItem.
- GovernmentRegistration.
- Document.
- CreatorProfile.
- Campaign.
- Partner.
- Announcement.
- Communication.
- AutomationRule.
- OrganizationSettings.
- IntelligenceSnapshot.
- DailyNote.

The PDF-named database entities now exist as Prisma models. Some models are foundation-level persistence surfaces until their full UI/API workflows mature.
