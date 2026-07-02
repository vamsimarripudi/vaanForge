# VaanForge Error Handling Guide

VaanForge uses one backend error contract and one frontend API normalization layer.

## User-facing behavior

- Show field errors inline.
- Show permission and plan-limit errors as page-level states where they block the page.
- Use toasts for request-level feedback, not as a replacement for field errors.
- Include retry only when the action is safe or idempotent.
- Never show raw backend messages, stack traces, private paths, or secrets.

## Recovery mapping

| Code | User recovery |
| --- | --- |
| `VALIDATION_ERROR` | Fix highlighted fields |
| `AUTH_REQUIRED` | Sign in again |
| `PERMISSION_DENIED` | Request access |
| `PLAN_LIMIT_REACHED` | Upgrade plan |
| `RATE_LIMITED` | Retry later |
| `PAYMENT_FAILED` | Retry payment or update method |
| `PROVIDER_UNAVAILABLE` | Retry after provider recovery |

## Duplicate submissions

Submit buttons should enter a loading state during requests. Unsafe mutations should not auto-retry unless an idempotency key exists.
