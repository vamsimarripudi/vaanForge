# Upgrade Guide - v1.0.0-rc1

## Audience

This guide is for operators upgrading a VaanForge environment to the RC1 release candidate.

## Before Upgrading

1. Freeze feature changes.
2. Back up PostgreSQL.
3. Back up file/object storage.
4. Export current environment variables.
5. Confirm rollback package and previous deployment artifact are available.
6. Run the validation suite on the candidate commit.

## Upgrade Steps

```powershell
npm install
npm.cmd run prisma:generate --workspace backend
npm.cmd run db:migrate:deploy
npm.cmd run lint
npm.cmd run type-check
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

Deploy only after all checks pass.

## Breaking Changes

No intentional public API, database, pricing, billing-rule, or navigation breaking changes are introduced for RC1.

## Required Configuration

Production-like environments must configure:

- `NODE_ENV=production`
- `PERSISTENCE_MODE=postgres`
- production `DATABASE_URL`
- strong `JWT_SECRET`
- production `FRONTEND_URL`
- Razorpay credentials and webhook secret
- VFormix internal webhook token
- production email/SMS/storage/realtime/queue/AI provider settings

## Post-Upgrade Verification

1. Run health checks.
2. Verify login/logout.
3. Verify billing plan list.
4. Verify builder project creation.
5. Verify factory blueprint generation.
6. Verify deployment readiness check.
7. Verify marketplace listing.
8. Verify developer API key creation.
9. Verify audit logs.
10. Verify support ticket workflow.
