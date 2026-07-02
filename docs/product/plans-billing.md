# Plans And Billing

`plans.vaanforge.com` presents pricing and billing flows using backend plan data as the source of truth.

## Approved Plans

| Plan | Monthly | Core Limits |
| --- | ---: | --- |
| Free | Rs 0 | 1 active project, 1 workspace, 1 user, 500 AI credits, 1 GB storage, 5 deployments |
| Creator | Rs 999 | 10 projects, 1 user, 5,000 AI credits, 10 GB storage |
| Professional | Rs 2,999 | 50 projects, 5 users, 25,000 AI credits, 100 GB storage |
| Studio | Rs 7,999 | 250 projects, 25 users, 100,000 AI credits, 500 GB storage |
| Business | Rs 19,999 | Unlimited projects, 100 users, 500,000 AI credits, 2 TB storage |
| Enterprise | Custom | Contract-defined limits |

Professional is marked as the most popular plan. Yearly billing applies the approved two-month-free pricing rule through backend plan configuration.

## Contracts

- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/subscribe`
- `POST /api/v1/billing/cancel`
- `GET /api/v1/billing/subscription`
- `GET /api/v1/billing/invoices`
- `GET /api/v1/billing/usage`
- `GET /api/v1/billing/credits`
- `POST /api/v1/billing/credits/topup`
- `POST /api/v1/webhooks/razorpay`

## Security

Plan reads are public safe metadata. Billing mutations require authentication and billing permission. Razorpay webhooks use signature verification and idempotent event storage.

