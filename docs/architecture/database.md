# Database Architecture

Production persistence targets PostgreSQL through Prisma. Local development and smoke tests can use in-memory persistence where explicitly configured.

## Model Areas

- Agent runs, outputs, tasks, files, validation, errors, repairs
- Templates and marketplace records
- Builder projects, requirements, blueprints, outputs, change requests
- Billing plans, subscriptions, invoices, payments, usage, credits
- Operations incidents, audit logs, health, product metrics, business metrics
- Developer accounts, apps, API keys, webhooks, plugins
- Marketplace publishers, apps, versions, reviews, installs, pricing, payouts

See [../DATABASE.md](../DATABASE.md) for the contract-backed model list.

