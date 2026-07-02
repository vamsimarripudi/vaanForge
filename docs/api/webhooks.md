# Webhooks

VaanForge uses signed webhooks for external and internal system callbacks.

## Current Webhook Types

- Razorpay billing webhook
- Internal VFormix agent webhook
- Developer platform event webhooks

## Rules

- Verify signature or internal token.
- Store idempotent event records where applicable.
- Do not add fake user auth to external provider webhooks.
- Mask secrets in logs and evidence.

