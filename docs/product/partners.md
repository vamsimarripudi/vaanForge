# VaanForge Partners

The partners subdomain supports agencies, freelancers, consultants, and system integrators.

## Data model

- `partner_applications`
- `partners`
- `partner_referrals`
- `partner_commissions`
- `partner_payouts`
- `partner_resources`
- `partner_certifications`

## APIs

- `POST /api/v1/partners/apply`
- `GET /api/v1/partners/profile`
- `GET /api/v1/partners/referrals`
- `GET /api/v1/partners/commissions`
- `GET /api/v1/partners/payouts`
- `GET /api/v1/partners/resources`
- `GET /api/v1/admin/partners/applications`
- `POST /api/v1/admin/partners/applications/:applicationId/approve`
- `POST /api/v1/admin/partners/applications/:applicationId/reject`
- `GET /api/v1/admin/partners`
- `PATCH /api/v1/admin/partners/:partnerId`

## Revenue rule

Referrals, commissions, and payouts must come from real revenue events. Empty states are correct until revenue exists.
