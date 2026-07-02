# Operations Runbook - v1.0.0-rc1

## Daily Checks

- Review operations dashboard.
- Review active incidents.
- Review failed/blocked agent runs.
- Review billing webhook events.
- Review deployment health checks.
- Review support tickets.
- Review audit anomalies.

## Health Checks

- API: `/api/v1/health`
- Production readiness: `npm run launch:readiness`
- E2E contracts: `npm run test:e2e`

## Incident Flow

1. Create incident in Operations Center.
2. Assign owner and severity.
3. Confirm customer impact.
4. Pause risky controls if needed.
5. Investigate logs using request ID.
6. Apply fix or rollback.
7. Verify health checks.
8. Resolve incident.
9. Write postmortem for major incidents.

## Billing Operations

- Verify Razorpay webhook signature failures daily during beta.
- Reconcile invoices and payments.
- Review failed payment retries.
- Confirm credit refunds after failed agent runs.

## Agent Operations

- Watch blocked and failed runs.
- Review repair attempts.
- Approve or reject human-in-the-loop requests.
- Escalate repeated failures to manual review.

## Security Operations

- Rotate secrets according to provider policy.
- Review audit logs for permission changes and admin controls.
- Never expose provider API keys in logs, tickets, or generated outputs.

## Release Operations

- Deploy only after release checklist is complete.
- Keep previous release artifact available.
- Verify rollback path before production promotion.
