# VaanForge Legal Pages

Legal pages are managed records branded for KRAVIA PRIVATE LIMITED. Each page has a version, effective date, and last updated timestamp.

## Pages

- Privacy Policy
- Terms of Use
- Terms and Conditions
- Refund and Cancellation Policy
- Payment Policy
- Cookie Policy
- Data Usage Policy
- Plan Limits
- Security
- Acceptable Use
- Subprocessors
- Contact

## Data model

- `legal_pages`
- `legal_page_versions`
- `legal_acceptance_logs`

## APIs

- `GET /api/v1/legal/pages`
- `GET /api/v1/legal/pages/:slug`
- `POST /api/v1/admin/legal/pages`
- `PATCH /api/v1/admin/legal/pages/:pageId`
- `POST /api/v1/admin/legal/pages/:pageId/publish`

## Legal review boundary

Managed policy content is not a certification claim. Production legal text should be reviewed before external launch.
