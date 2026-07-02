# Policy Acceptance

VaanForge tracks user acceptance of legal policies with version, IP, user agent, workspace, and timestamp evidence.

## Tracked Policies

- Terms of Use
- Privacy Policy
- Payment Policy
- Refund Policy
- Data Usage Policy
- Cookie Policy
- API Terms
- Marketplace Publisher Terms
- Partner Terms

## APIs

- `POST /api/v1/legal/accept`
- `GET /api/v1/legal/acceptance-history`
- `GET /api/v1/admin/legal/acceptance-logs`

## Rules

- Acceptance requires an authenticated user.
- Acceptance logs are organization-scoped.
- Admin access requires legal management permission.
- Every acceptance writes a legal audit event.
