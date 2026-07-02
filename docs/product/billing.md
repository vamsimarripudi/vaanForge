# Billing

Billing covers subscriptions, checkout readiness, invoices, payment history, credit wallet, and usage limits.

## Contracts

- Plans: `GET /api/v1/billing/plans`
- Checkout session: `POST /api/v1/billing/checkout/session`
- Checkout confirm: `POST /api/v1/billing/checkout/confirm`
- Subscription: `GET /api/v1/billing/subscription`
- Invoices: `GET /api/v1/billing/invoices`
- Usage: `GET /api/v1/billing/usage`
- Credits: `GET /api/v1/billing/credits`

## Payment Provider

If Razorpay is not configured, checkout returns `PROVIDER_NOT_CONFIGURED`. The product must not show payment success until a signed webhook or provider-confirmed payment exists.
