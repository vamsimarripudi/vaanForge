# Provider Accounts Checklist

Use `/api/v1/admin/providers/readiness` and `/api/v1/admin/providers/:provider/health-check` to verify provider setup.

| Provider | Required for production | Health statuses |
| --- | --- | --- |
| OpenAI | Optional | `healthy`, `not_configured`, `missing_secret`, `degraded` |
| Gemini | Optional | `healthy`, `not_configured`, `missing_secret`, `degraded` |
| Claude | Optional | `healthy`, `not_configured`, `missing_secret`, `degraded` |
| Groq/Together | Optional | `healthy`, `not_configured`, `missing_secret`, `degraded` |
| Hugging Face | Optional | `healthy`, `not_configured`, `missing_secret`, `degraded` |
| Razorpay | Yes | `healthy`, `missing_secret`, `invalid_credentials`, `rate_limited`, `unavailable` |
| AWS | Yes | `healthy`, `missing_secret`, `unavailable` |
| S3 | Yes | `healthy`, `missing_secret`, `unavailable` |
| SES | Optional until email launch | `healthy`, `not_configured`, `missing_secret` |
| PostgreSQL | Yes | `healthy`, `missing_secret`, `unavailable` |
| Redis | Yes | `healthy`, `missing_secret`, `unavailable` |
| Sentry | Optional | `healthy`, `not_configured` |
| Analytics | Optional | `healthy`, `not_configured` |
| Figma asset readiness | Optional | `healthy`, `not_configured` |

## Rules

- Never paste provider secrets into tickets, docs, or audit metadata.
- Rotate credentials after any suspected exposure.
- Run a provider health check after every credential or region change.
- Optional providers should show `not_configured`, not fake healthy status.
