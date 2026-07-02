# Technical Debt Register

The technical debt register is available through `/api/v1/admin/engineering/technical-debt`.

## Fields

- title
- description
- priority
- owner
- impact
- estimated effort
- related project
- status
- risk
- target sprint

Debt is sorted by risk in the service layer so critical items surface first. Updates are audited.

## Statuses

- open
- assigned
- in_progress
- resolved
- accepted

