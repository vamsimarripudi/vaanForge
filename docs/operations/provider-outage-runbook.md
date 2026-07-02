# Provider Outage Runbook

## Trigger
AI, billing, storage, email, database, queue, or monitoring provider becomes unavailable or misconfigured.

## Symptoms
- Provider readiness shows missing secret, unavailable, degraded, or rate limited.
- AI generation, checkout, upload, notification, or deployment fails.

## Investigation
1. Open provider readiness.
2. Check missing Parameter Store paths.
3. Verify last health check.
4. Review safe provider errors and audit logs.

## Mitigation
- Disable dependent workflow if needed.
- Route to alternate provider where configured.
- Communicate setup required internally if provider is optional.

## Owner
Platform operations owner.

## Escalation
Critical provider outage escalates to Super Admin and vendor owner.

## Rollback/Recovery
Restore previous provider configuration through Parameter Store versioning.

## Postmortem Checklist
Record provider, duration, affected workflows, mitigation, and prevention.
