# Deployment Checklist - v1.0.0-rc1

## Pre-Deploy

- [ ] Feature freeze confirmed.
- [ ] Candidate commit approved.
- [ ] Database backup completed.
- [ ] Object storage backup completed.
- [ ] Previous release artifact available.
- [ ] Environment variables reviewed.
- [ ] Secrets rotated or verified.
- [ ] `npm run lint` passed.
- [ ] `npm run type-check` passed.
- [ ] `npm run test` passed.
- [ ] `npm run test:e2e` passed.
- [ ] `npm run build` passed.
- [ ] `npm run launch:readiness` reviewed.

## Required Production Configuration

- [ ] PostgreSQL persistence enabled.
- [ ] Production domain configured.
- [ ] HTTPS frontend URL configured.
- [ ] Razorpay keys and webhook secret configured.
- [ ] Email provider configured.
- [ ] Storage provider configured.
- [ ] Realtime/queue provider configured.
- [ ] AI provider configured.
- [ ] Monitoring and alerting connected.
- [ ] Backup and restore runbook verified.

## Post-Deploy Smoke

- [ ] `/api/v1/health` returns healthy response.
- [ ] Login/logout works.
- [ ] CSRF-protected mutation works.
- [ ] Builder project creation works.
- [ ] Billing plans load from backend.
- [ ] Marketplace listing loads from backend.
- [ ] Developer API key workflow works.
- [ ] Operations summary loads.
- [ ] Audit logs record sensitive action.
- [ ] Rollback trigger path is available.
