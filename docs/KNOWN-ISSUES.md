# Known Issues

- Browser interaction E2E through a real browser runner is not installed yet; route smoke QA, UI interaction contract checks, and backend HTTP smoke coverage are configured.
- Pricing values are placeholders; `npm run test:e2e` verifies the current launch catalog stays price-pending until commercial approval.
- Domain values are placeholders until a real domain is ready.
- Billing has explicit trial and checkout steps. Payment checkout has a provider abstraction and local development adapter, but commercial prices and production Razorpay credentials are not wired yet.
- Production email/SMS, production file storage, and production database connections are not wired yet.
- `/api/v1/system/readiness` fails production mode when domains, frontend URLs, providers, AI provider, adapter values, payment credentials, or database settings are still placeholders. Provider readiness coverage is guarded by `npm run test:e2e`.
- Auth, automation, communication, compliance/government registrations, creators, CRM/customers, finance, HR/interviews, intelligence snapshots, legal, partners, settings, support, tasks, and workspaces have memory and Prisma repository implementations. Production use still requires running Prisma generation during deployment and configuring a production database.
- `PERSISTENCE_MODE` and `/api/v1/system/readiness` now make the memory-vs-PostgreSQL launch boundary explicit. All current business modules are repository-backed with memory and Prisma implementations.
- Prisma Client generation succeeds locally; every production deployment must run `prisma generate` before `PERSISTENCE_MODE=postgres` receives traffic.
- Legal document workflows are operational helpers only and require qualified legal review before real-world use.
- Security hardening now includes expiring signed sessions, per-session IDs, logout revocation, signed CSRF enforcement with bypass contract QA, secure production cookie flags, hashed one-time password reset tokens, local password reset email delivery, and local SMS notification delivery, but production email/SMS delivery, production-grade distributed revocation storage, and provider-specific security reviews remain before real customer launch.
- Intelligence assistant responses go through the AI provider abstraction, use deterministic local generation by default, and must be connected to a reviewed AI provider before real advisory use.
- Report exports currently generate CSV for Excel-compatible output and printable HTML for PDF-style output; polished binary XLSX/PDF generation is a future enhancement.
- Report exports write to local in-memory storage in development; production object storage still needs reviewed S3-compatible credentials.
- Background jobs have a typed queue abstraction and local memory adapter handoff through `memory.service.ts`. Production still needs BullMQ or the approved Vaanis queue adapter before high-volume asynchronous workloads.
- Realtime notification, task, support, and approval events are published through the `realtime.service.ts` abstraction. Vaanis, VaanRTC, and SFU adapters are placeholders until production providers are approved.
- Full browser-driven CRUD hardening remains planned for production use; API auth, permission guard contract checks, and backend HTTP smoke coverage are configured for the implemented route set.
- `npm audit` reports a moderate PostCSS advisory through the current Next.js dependency tree; the automated fix currently proposes a breaking downgrade and should be revisited when a safe Next.js/PostCSS patch path is available. Dependency hygiene is guarded locally by `npm run test:e2e`.
