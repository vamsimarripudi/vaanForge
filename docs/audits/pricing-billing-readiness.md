# Pricing and Billing Readiness

## Approved Plans

| Plan | Monthly | Core Limits |
| --- | ---: | --- |
| Free | ₹0 | 1 active project, 1 user, 500 AI credits, 1 GB storage, 5 deployments |
| Creator | ₹999 | 10 projects, 1 user, 5,000 AI credits, 10 GB storage |
| Professional | ₹2,999 | 50 projects, 5 users, 25,000 AI credits, 100 GB storage |
| Studio | ₹7,999 | 250 projects, 25 users, 100,000 AI credits, 500 GB storage |
| Business | ₹19,999 | Unlimited projects, 100 users, 500,000 AI credits, 2 TB storage |
| Enterprise | Custom | Custom contract and enterprise controls |

Yearly pricing is calculated as 10 months, giving 2 months free.

## Readiness Status

- Pricing source: backend billing plan seeds and editable plan records.
- Frontend pricing: reads `/api/v1/billing/builder/plans` and usage APIs.
- Checkout readiness: `/api/v1/billing/checkout/session`.
- Provider state: unconfigured Razorpay returns `PROVIDER_NOT_CONFIGURED`; no fake payment success.
- Webhooks: Razorpay endpoint requires signature and is idempotent.
- Usage metering: limited actions write `customerUsageEvents`.
- Admin controls: billing admins can view/update plans, feature flags, usage policies, and price history.

## Remaining Work

- Connect production Razorpay credentials.
- Add hosted/embedded Razorpay client handoff.
- Move local/test billing store to durable production repositories.
