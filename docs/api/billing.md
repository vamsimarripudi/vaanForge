# Billing APIs

Billing APIs control plans, subscriptions, usage limits, credits, invoices, payments, and Razorpay webhooks.

## Customer Routes

- `/api/v1/builder/billing/plans`
- `/api/v1/builder/billing/subscribe`
- `/api/v1/builder/billing/cancel`
- `/api/v1/builder/billing/invoices`
- `/api/v1/builder/billing/usage`
- `/api/v1/builder/billing/credits`

## Admin Routes

- `/api/v1/admin/agent/billing/plans`
- `/api/v1/admin/agent/billing/usage`

## Webhook

`POST /api/v1/webhooks/razorpay` uses signature verification, not normal browser auth.

