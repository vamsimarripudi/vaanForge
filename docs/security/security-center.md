# VaanForge Security Center

The Security Center is the admin view for real security telemetry in VaanForge. It is a readiness and monitoring layer, not a certification claim.

## Routes

- `admin.vaanforge.com/security`
- `admin.vaanforge.com/security/events`
- `admin.vaanforge.com/security/risk`
- `admin.vaanforge.com/security/sessions`
- `admin.vaanforge.com/security/api-keys`
- `admin.vaanforge.com/security/reports`
- `settings.vaanforge.com/security`

## APIs

- `GET /api/v1/admin/security/overview`
- `GET /api/v1/admin/security/events`
- `GET /api/v1/admin/security/risk`
- `GET /api/v1/admin/security/sessions`
- `GET /api/v1/admin/security/api-keys`
- `GET /api/v1/admin/security/reports`
- `POST /api/v1/admin/security/reports/generate`

All admin routes require authentication and admin-readable audit permission. Report generation requires settings management permission and writes an audit event.

## Data Sources

- login history
- security events
- API keys and API-key security settings
- prompt risk events
- secret scan events
- provider health checks
- audit logs

## Report Language

Reports must say `readiness` when the platform has evidence. They must not claim ISO, SOC 2, GDPR, HIPAA, or other certification unless KRAVIA PRIVATE LIMITED has legally obtained that certification.
