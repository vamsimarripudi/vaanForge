# Environment Guide

Required variables:

```env
NODE_ENV=development
ROOT_DOMAIN=example.com
FRONTEND_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_VAANFORGE_ROOT_DOMAIN=vaanforge.com
VITE_VAANFORGE_PUBLIC_URL=https://vaanforge.com
VITE_VAANFORGE_WWW_URL=https://www.vaanforge.com
VITE_VAANFORGE_APP_URL=https://app.vaanforge.com
VITE_VAANFORGE_AUTH_URL=https://auth.vaanforge.com
VITE_VAANFORGE_PROFILE_URL=https://profile.vaanforge.com
VITE_VAANFORGE_SETTINGS_URL=https://settings.vaanforge.com
VITE_VAANFORGE_PLANS_URL=https://plans.vaanforge.com
VITE_VAANFORGE_SUPPORT_URL=https://support.vaanforge.com
VITE_VAANFORGE_ADMIN_URL=https://admin.vaanforge.com
VITE_VAANFORGE_DOCS_URL=https://docs.vaanforge.com
VITE_VAANFORGE_STATUS_URL=https://status.vaanforge.com
VITE_VAANFORGE_DEVELOPERS_URL=https://developers.vaanforge.com
VITE_VAANFORGE_MARKETPLACE_URL=https://marketplace.vaanforge.com
VITE_VAANFORGE_API_URL=https://api.vaanforge.com
VITE_VAANFORGE_ASSETS_URL=https://assets.vaanforge.com
VITE_VAANFORGE_CDN_URL=https://cdn.vaanforge.com
VITE_VAANFORGE_UPLOADS_URL=https://uploads.vaanforge.com
VITE_VAANFORGE_FILES_URL=https://files.vaanforge.com
VITE_VAANFORGE_WEBHOOKS_URL=https://webhooks.vaanforge.com
VITE_VAANFORGE_EVENTS_URL=https://events.vaanforge.com
VITE_VAANFORGE_BILLING_URL=https://billing.vaanforge.com
VITE_VAANFORGE_CHECKOUT_URL=https://checkout.vaanforge.com
VITE_VAANFORGE_CONSOLE_URL=https://console.vaanforge.com
VITE_VAANFORGE_FACTORY_URL=https://factory.vaanforge.com
VITE_VAANFORGE_AGENTS_URL=https://agents.vaanforge.com
VITE_VAANFORGE_DEPLOY_URL=https://deploy.vaanforge.com
VITE_VAANFORGE_RELEASES_URL=https://releases.vaanforge.com
VITE_VAANFORGE_LEGAL_URL=https://legal.vaanforge.com
VITE_VAANFORGE_FEEDBACK_URL=https://feedback.vaanforge.com
VITE_VAANFORGE_LEARN_URL=https://learn.vaanforge.com
VITE_VAANFORGE_BLOG_URL=https://blog.vaanforge.com
VITE_VAANFORGE_PARTNERS_URL=https://partners.vaanforge.com
VITE_VAANFORGE_ENTERPRISE_URL=https://enterprise.vaanforge.com
VAANFORGE_PUBLIC_URL=https://vaanforge.com
VAANFORGE_WWW_URL=https://www.vaanforge.com
VAANFORGE_APP_URL=https://app.vaanforge.com
VAANFORGE_AUTH_URL=https://auth.vaanforge.com
VAANFORGE_API_URL=https://api.vaanforge.com
VAANFORGE_ADMIN_URL=https://admin.vaanforge.com
VAANFORGE_SUPPORT_URL=https://support.vaanforge.com
VAANFORGE_PROFILE_URL=https://profile.vaanforge.com
VAANFORGE_SETTINGS_URL=https://settings.vaanforge.com
VAANFORGE_PLANS_URL=https://plans.vaanforge.com
VAANFORGE_DOCS_URL=https://docs.vaanforge.com
VAANFORGE_STATUS_URL=https://status.vaanforge.com
VAANFORGE_DEVELOPERS_URL=https://developers.vaanforge.com
VAANFORGE_MARKETPLACE_URL=https://marketplace.vaanforge.com
VAANFORGE_ASSETS_URL=https://assets.vaanforge.com
VAANFORGE_CDN_URL=https://cdn.vaanforge.com
VAANFORGE_UPLOADS_URL=https://uploads.vaanforge.com
VAANFORGE_FILES_URL=https://files.vaanforge.com
VAANFORGE_WEBHOOKS_URL=https://webhooks.vaanforge.com
VAANFORGE_EVENTS_URL=https://events.vaanforge.com
VAANFORGE_BILLING_URL=https://billing.vaanforge.com
VAANFORGE_CHECKOUT_URL=https://checkout.vaanforge.com
VAANFORGE_CONSOLE_URL=https://console.vaanforge.com
VAANFORGE_FACTORY_URL=https://factory.vaanforge.com
VAANFORGE_AGENTS_URL=https://agents.vaanforge.com
VAANFORGE_DEPLOY_URL=https://deploy.vaanforge.com
VAANFORGE_RELEASES_URL=https://releases.vaanforge.com
VAANFORGE_LEGAL_URL=https://legal.vaanforge.com
VAANFORGE_FEEDBACK_URL=https://feedback.vaanforge.com
VAANFORGE_LEARN_URL=https://learn.vaanforge.com
VAANFORGE_BLOG_URL=https://blog.vaanforge.com
VAANFORGE_PARTNERS_URL=https://partners.vaanforge.com
VAANFORGE_ENTERPRISE_URL=https://enterprise.vaanforge.com
VAANFORGE_COOKIE_DOMAIN=.vaanforge.com
CORS_EXTRA_ORIGINS=
PORT=4000
PERSISTENCE_MODE=memory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kravia
JWT_SECRET=replace-with-secure-secret
SESSION_TTL_SECONDS=28800
PASSWORD_RESET_TTL_SECONDS=1800
MEMORY_ADAPTER=redis
REALTIME_ADAPTER=external
RAZORPAY_KEY_ID=local
RAZORPAY_KEY_SECRET=local
RAZORPAY_WEBHOOK_SECRET=local
EMAIL_PROVIDER=local
SMS_PROVIDER=local
S3_ENDPOINT=local
AI_PROVIDER=deterministic
VFORMIX_AGENT_WEBHOOK_TOKEN=replace-with-secure-secret
```

Never commit real secrets.

`VITE_API_BASE_URL` must point the frontend to the deployed API base URL.
`PERSISTENCE_MODE=memory` is for development and controlled demos only. Production must use `PERSISTENCE_MODE=postgres` with a production `DATABASE_URL`.
`EMAIL_PROVIDER=local` is for development and tests only. Production must use a reviewed provider adapter with real credentials.
`SMS_PROVIDER=local` is for development and tests only. Production must use a reviewed provider adapter with real credentials.
`S3_ENDPOINT=local` is for development and tests only. Production must use reviewed object storage credentials.
`AI_PROVIDER=deterministic` is for development and demos only. Production advisory flows require a reviewed AI provider and credentials.
`RAZORPAY_KEY_ID=local`, `RAZORPAY_KEY_SECRET=local`, and `RAZORPAY_WEBHOOK_SECRET=local` are for development and tests only. Production billing requires real Razorpay credentials and verified webhook signing.
`VFORMIX_AGENT_WEBHOOK_TOKEN=replace-with-secure-secret` protects internal VFormix-to-agent callbacks. Production must use a rotated secret shared only with VFormix.

## Production startup validation

When `NODE_ENV=production`, the API now fails fast if critical secrets or provider credentials still use placeholder, local, or development-only values. The production validator checks:

Production also requires AWS Systems Manager Parameter Store unless an approved break-glass deployment explicitly sets `ALLOW_LOCAL_ENV_IN_PRODUCTION=true`.

```env
PARAMETER_STORE_ENABLED=true
PARAMETER_STORE_PREFIX=/vaanforge/prod
AWS_REGION=ap-south-1
```

See [Parameter Store Setup](../setup/parameter-store.md) and [Provider Accounts Checklist](../setup/provider-accounts-checklist.md).

- `DATABASE_URL`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `VFORMIX_AGENT_WEBHOOK_TOKEN`
- HTTPS `FRONTEND_URL`

This validation prevents a production process from booting with known-insecure defaults. Local development and test runs keep the documented defaults so CI and offline smoke tests remain deterministic.
