# Deployment Runbook

## Trigger
Admin approves a release for deployment.

## Symptoms
Deployment is blocked, verifying, failed, rollback required, or live.

## Investigation
1. Run preflight.
2. Review environment, database, migration, storage, queue, provider, billing, email, SSL, health, and rollback checks.
3. Verify deployment logs.

## Mitigation
- Fix failed preflight checks.
- Do not deploy until checks pass.
- Confirm production deployment explicitly.

## Owner
Deployment owner.

## Escalation
Escalate production deploy failures to DevOps and Super Admin.

## Rollback/Recovery
Use signed rollback action after verifying rollback metadata.

## Postmortem Checklist
Record failed check, impact, mitigation, and prevention.
