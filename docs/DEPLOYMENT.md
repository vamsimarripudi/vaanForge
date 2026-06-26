# Deployment

Initial deployment target:

- AWS EC2.
- Docker Compose.
- Nginx reverse proxy.
- PostgreSQL.
- Redis as temporary development adapter.

Production deployment requires:

- Real domain.
- SSL certificates.
- Production database.
- Secure JWT secret.
- File storage provider.
- Email and SMS provider credentials.
- Razorpay credentials.

## Deployment Gate

Before cutting traffic to a production deployment:

1. Install dependencies with `npm ci`.
2. Generate Prisma Client with `npm run prisma:generate --workspace backend`.
3. Apply reviewed migrations with `npm run db:migrate:deploy`.
4. Run `npm run typecheck`.
5. Run `npm test`.
6. Run `npm run test:e2e`.
7. Run `npm run phase:status`.
8. Run `npm run build`.
9. Run `npm run launch:readiness` in the target environment and require a zero exit code.

The CI workflow covers build, typecheck, backend tests, route smoke checks, UI interaction contracts, API auth/permission contracts, role and permission matrix contracts, CSRF bypass contracts, CI workflow contract checks, environment documentation contract checks, database schema/migration contract checks, provider readiness contract checks, production readiness documentation contract checks, audit coverage contract checks, phase documentation contract checks, domain configuration contract checks, pricing placeholder contract checks, dependency hygiene contract checks, QA documentation contract checks, infrastructure contract checks, phase status, and Prisma Client generation with local/demo settings. The launch readiness command is intentionally environment-specific because it must fail when production secrets, domain, database, providers, local-only payment/email/SMS/storage, or adapters are still placeholders.
