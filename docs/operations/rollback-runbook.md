# Rollback Runbook

## Trigger
Deployment verification fails or production health degrades after release.

## Symptoms
- Deployment status `rollback_required`
- Health check unhealthy
- Elevated customer-impacting errors

## Investigation
1. Confirm current release id.
2. Confirm rollback metadata exists.
3. Review migration and build status.
4. Verify previous release artifact.

## Mitigation
- Execute signed rollback.
- Verify rollback health.
- Keep incident open until stability is confirmed.

## Owner
Deployment owner and incident commander.

## Escalation
Escalate failed rollback immediately.

## Rollback/Recovery
Rollback must not proceed without metadata and audit trail.

## Postmortem Checklist
Document cause, rollback duration, customer impact, and prevention.
