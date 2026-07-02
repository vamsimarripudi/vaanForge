# VaanForge Operations Runbook

## Trigger
Any production alert, customer-impacting incident, failed deployment, billing failure spike, or provider outage.

## Symptoms
- Monitoring overview reports degraded/down service.
- Alert event remains open.
- Support tickets mention availability, billing, deployment, or AI generation failures.

## Investigation
1. Open `/api/v1/admin/monitoring/overview`.
2. Check `/api/v1/admin/alerts`.
3. Review `/api/v1/admin/operations/incidents`.
4. Inspect deployment logs and provider readiness.
5. Confirm whether customer data, billing, or security is impacted.

## Mitigation
- Acknowledge alert.
- Assign incident owner.
- Pause deployments if release safety is unclear.
- Communicate through status/support channels.

## Owner
Operations owner on duty.

## Escalation
Escalate SEV1/SEV2 to Super Admin and engineering owner immediately.

## Rollback/Recovery
Use deployment rollback only when rollback metadata exists and health verification can run.

## Postmortem Checklist
- Timeline
- Root cause
- Impact
- Fix
- Prevention
- Owners
- Action items
