# Payment Provider Interface

VaanForge billing uses provider interfaces so product logic is not tightly coupled to Razorpay.

## Interfaces

- `PaymentProvider`
- `SubscriptionProvider`
- `InvoiceProvider`

## Implementations

- `RazorpayPaymentsAdapter`: creates real Razorpay orders when credentials are configured.
- `NullPaymentProvider`: returns `PROVIDER_NOT_CONFIGURED` for product checkout readiness.
- `LocalPaymentsAdapter`: test/local subscription compatibility only.

## Rules

- Never trust frontend pricing.
- Never fake payment success.
- Verify webhook signatures.
- Process duplicate webhooks idempotently.
- Audit payment and subscription events.
