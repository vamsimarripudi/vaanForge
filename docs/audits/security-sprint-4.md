# Security Audit - Sprint 4

Company: KRAVIA PRIVATE LIMITED  
Product: VaanForge  
Sprint type: Security, compliance, production hardening  
Date: 2026-06-29

## Scope

This audit reviewed authentication, authorization, billing, builder, marketplace, developer platform, operations center, factory, admin routes, API gateway, file uploads, background jobs, notifications, and webhooks. The sprint did not add new product features.

## Fixes Completed

- Added successful login/logout audit events with request ID, IP address, and user agent metadata.
- Added per-email/IP login attempt limiting on top of global API rate limiting.
- Hardened Razorpay webhook verification to use the captured raw request body instead of reconstructed JSON.
- Added raw request body capture during JSON parsing.
- Hardened file uploads with:
  - base64 validation
  - 5 MB decoded size limit
  - MIME allowlist
  - extension/MIME matching
  - clean 400 responses for rejected uploads
- Added request correlation metadata to file upload audit entries.
- Standardized permission-denied responses with `code`, `recoverable`, `nextAction`, and `requestId`.

## P0 Findings

No unresolved P0 findings remain after this sprint.

Resolved P0-class risks:

- **Payment webhook body verification**: Razorpay signature verification now receives `request.rawBody`.
- **Unsafe file upload acceptance**: upload service now rejects unsupported extensions, mismatched MIME types, invalid base64, and oversized files before storage.

## P1 Findings

| Area | Finding | Status | Recommendation |
| --- | --- | --- | --- |
| Auth | No full device-session dashboard exists. | Deferred | Add device/session inventory with revoke-by-device before enterprise beta. |
| Auth | Account lockout is currently rate-limit based, not account-state based. | Partially mitigated | Keep per-email/IP limiter; add lockout policy after product decision. |
| Audit | Some service-level audit records cannot yet include request IDs because service APIs do not receive request context. | Deferred | Add request-context propagation into sensitive service methods. |
| Events | Event payload contracts are not centralized. | Deferred | Add typed event registry and payload validation. |
| Uploads | Malware scanning hook is not implemented. | Deferred | Add scanner adapter before allowing larger/binary enterprise uploads. |
| Queue | No production worker/DLQ adapter is connected. | Deferred | Connect BullMQ/Vaanis before high-volume workloads. |

## P2 Findings

- Add CSP customization beyond Helmet defaults once final asset/CDN policy is known.
- Add security headers contract tests for production response headers.
- Add path-level object-authorization tests for more nested resources.
- Add audit log search by request ID in admin UI.
- Add SSO/MFA readiness documentation when identity provider is selected.

## Authentication Review

### Current Controls

- Session cookie is `httpOnly`.
- Session cookie uses `sameSite: "lax"`.
- Session cookie is `secure` in production.
- Sessions include expiry and revocation.
- Logout revokes the current session.
- Password reset tokens are hashed at rest and expire.
- Login now has per-email/IP rate limiting.
- Successful login/logout events are audited where an organization is available.

### Remaining Work

- Device sessions and email verification are not complete enterprise features yet.
- Failed login audit is intentionally not persisted to tenant audit logs because failed attempts may not map to an organization without creating account-enumeration risk. Operational logs/rate limits cover abuse detection today.

## Authorization Review

### Current Controls

- Route security contract validates protected route coverage.
- Mutations require permissions unless explicitly allowlisted by contract.
- Admin routes use admin permissions.
- Operations emergency controls require Super Admin behavior in service tests.
- Tenant isolation is enforced by session organization ID across core services.

### Remaining Work

- Add broader object-level authorization tests for nested records.
- Add typed domain errors for expected authorization failures.

## Billing Security

### Current Controls

- Pricing and limits are server-side.
- Razorpay webhook uses signature verification.
- Webhook events are idempotent by provider event ID.
- Duplicate payment handling is covered by billing tests.
- Credits and usage deductions are server-side.
- Admin plan management requires billing permission.

### Sprint 4 Fix

- Razorpay webhook now verifies against raw request body.

## File Upload Security

### Current Controls

- Upload route requires authentication and `organization:manage`.
- Upload request schema validates fields and base64 size envelope.
- Upload service sanitizes folder and file name path segments.
- Upload audit entries include request correlation.

### Sprint 4 Fix

- Added decoded size cap, base64 validation, extension allowlist, MIME allowlist, and extension/MIME matching.

### Remaining Work

- Add malware scanning adapter.
- Add signed download URLs and explicit download authorization checks when non-local storage is enabled.

## API Hardening

### Current Controls

- Helmet is enabled.
- CORS is restricted to configured frontend URL.
- JSON payload limit is 2 MB at API parser level.
- Request IDs are emitted and logged.
- Error middleware masks raw exceptions in production.
- Permission/auth/CSRF/rate-limit responses are structured.

## Secret Management

### Current Controls

- Logger masks secret-like fields.
- Production env validation rejects local/placeholder critical secrets.
- Provider adapters fail closed when production credentials are not configured.
- API keys are hashed at rest in developer platform tests.

## Audit Logging

### Verified Coverage

- Billing actions
- Entitlement checks
- Finance actions
- Legal/compliance actions
- Workspace creation
- Settings changes
- Automation changes
- File uploads
- VaanForge agent runs
- Successful auth login/logout

### Remaining Work

- Add request ID propagation to all service-originated audit entries.
- Add project deletion audit if/when deletion workflow is enabled.

## Operational Resilience

### Current Controls

- Job enqueue retry metadata exists.
- Provider readiness contracts pass.
- Production readiness contracts pass.
- Deployment rollback metadata exists in deployment agent.

### Remaining Work

- Graceful shutdown should close database/cache/queue adapters explicitly when external adapters are connected.
- Production DLQ/worker recovery remains a pre-scale requirement.

## Compliance Preparation

Supported:

- Privacy/terms/refund/data-policy pages exist as product surfaces.
- Data export/delete requests exist.
- Retention controls exist in enterprise workspace records.
- Billing records and invoices exist.

Not claimed:

- No SOC 2, ISO, HIPAA, or PCI certification is claimed.
- Razorpay integration is application-level; card data handling remains provider-hosted.

## Penetration Readiness

| Risk | Mitigation |
| --- | --- |
| IDOR | Tenant-scoped service methods and route security contracts. |
| Privilege escalation | `requirePermission` and Super Admin service checks. |
| CSRF | CSRF middleware for protected mutations. |
| XSS | React escaping plus API validation; CSP tuning remains future work. |
| SQL injection | Prisma schema planned for production; current services avoid raw SQL. |
| Command injection | Deployment and factory actions use service contracts, not raw user shell execution. |
| Prompt injection | Builder/factory/marketplace/developer submissions include prompt-injection checks. |
| SSRF | No arbitrary server-side fetch route is exposed for users. |
| Path traversal | Upload paths sanitize segments and reject unsupported file names/extensions. |
| Insecure uploads | Sprint 4 upload allowlist and size checks added. |

## Validation Status

Final validation results are recorded in `docs/audits/security-production-readiness.md`.
