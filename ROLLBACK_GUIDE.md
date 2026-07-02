# Rollback Guide - v1.0.0-rc1

## Rollback Triggers

Rollback when any of the following occur after deployment:

- Authentication outage
- Billing or webhook processing failure
- Database migration failure
- Data corruption
- Persistent 5xx errors on critical APIs
- Deployment health checks fail
- Security incident or secret exposure

## Application Rollback

1. Stop new deployments and agent generation.
2. Enable maintenance mode if customer impact is active.
3. Promote the previous verified release artifact.
4. Restart backend and frontend services.
5. Verify `/api/v1/health`.
6. Run smoke checks for auth, billing, builder, marketplace, operations, and audit logs.

## Database Rollback

1. Do not roll back database blindly.
2. Identify migration applied during failed release.
3. Prefer forward fix when data was written after migration.
4. Restore backup only when corruption or incompatible schema blocks recovery.
5. Record rollback decision in audit/incident notes.

## Verification

- Health endpoint passes.
- Login works.
- Billing invoices and subscriptions are readable.
- Builder projects are readable.
- Operations incident is created.
- Audit logs include rollback action.

## Communication

- Notify internal admins.
- Notify affected beta customers if customer impact occurred.
- Publish postmortem for SEV1/SEV2 incidents.
