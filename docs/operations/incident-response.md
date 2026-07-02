# Incident Response Runbook

## Trigger
An incident is created from alerting, monitoring, customer support, or manual admin report.

## Symptoms
- Elevated error rate
- Queue latency
- Provider unavailable
- Billing webhook failures
- Failed deployment verification

## Investigation
1. Confirm service health.
2. Identify affected tenants/workspaces.
3. Review recent releases and deployments.
4. Search audit logs for sensitive actions.

## Mitigation
- Set incident status to investigating.
- Assign owner and severity.
- Publish status update if customer-facing.
- Apply targeted rollback or provider failover.

## Owner
Incident commander.

## Escalation
SEV1 requires Super Admin and product owner.

## Rollback/Recovery
Rollback only through signed deployment action with rollback metadata.

## Postmortem Checklist
Create `/api/v1/admin/incidents/:incidentId/postmortem` with impact and prevention actions.
