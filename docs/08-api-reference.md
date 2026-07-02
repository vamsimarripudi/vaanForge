# API Reference

The backend API is mounted under `/api/v1`.

## Major API Groups

- `/api/v1/vaanforge/*`
- `/api/v1/admin/agent/*`
- `/api/v1/admin/operations/*`
- `/api/v1/admin/marketplace/*`
- `/api/v1/developers/*`
- `/api/v1/developers/publisher/*`
- `/api/v1/gateway/v1/*`
- `/api/v1/marketplace/*`
- `/api/v1/builder/*`
- `/api/v1/builder/billing/*`
- `/api/v1/webhooks/razorpay`

## Conventions

- Browser APIs use authenticated session context.
- Mutations require CSRF protection unless they are signed webhook endpoints.
- Sensitive mutations require explicit permissions.
- Public developer gateway calls use scoped API keys.

Detailed references live in [docs/api](api/authentication.md).

