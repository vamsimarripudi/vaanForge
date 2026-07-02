# Enterprise Code Quality Upgrade

Product: VaanForge
Company: KRAVIA PRIVATE LIMITED

## Scope

This audit focused on billing and pricing adoption readiness while preserving the existing product modules.

## Findings

| Area | Status | Action |
| --- | --- | --- |
| Pricing source of truth | Backend-backed | Verified approved plans are seeded by `PlanConfigurationService`; frontend pricing reads billing APIs. |
| Payment readiness | Improved | Added explicit payment provider interfaces and a null provider state for unconfigured Razorpay checkout. |
| Limit responses | Improved | Usage middleware now returns `PLAN_LIMIT_REACHED` with current plan, required plan, usage, limit, and upgrade URL. |
| Pricing history | Improved | Plan price history is recorded when default plans are seeded and when admins update prices. |
| Frontend pricing | Improved | Pricing view now shows API-fed plan cards, yearly toggle, comparison matrix, usage context, policies, FAQ, and provider readiness. |
| Route validation | Partial | New checkout-session routes use Zod and safe error responses; older billing routes still include legacy raw errors for compatibility. |

## Remaining Risks

| Priority | Risk | Recommendation |
| --- | --- | --- |
| P1 | Some legacy billing routes still combine route and orchestration logic. | Split billing routes into controllers/use cases after compatibility consumers are stabilized. |
| P1 | The repository uses in-memory persistence for local/test flows. | Move billing plans, usage events, and price history to durable repositories before paid production traffic. |
| P2 | Checkout UI is ready for provider integration but not a full Razorpay browser embed. | Add Razorpay hosted/embedded flow after production credentials and webhook endpoints are verified. |

## Do Not Touch Without Care

- Razorpay webhook idempotency and signature verification.
- Server-side plan limit checks.
- Existing backend contract tests for checkout/subscription lifecycle.
