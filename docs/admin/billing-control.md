# Admin Billing Control

Billing administrators can:

- View plans
- Update plan metadata
- Review price history
- View subscriptions
- View payments
- View invoices
- View usage events
- Grant credits through controlled service methods
- Review usage policies and feature flags

Every admin mutation requires `billing:manage`, validates input, and writes a billing audit event.
