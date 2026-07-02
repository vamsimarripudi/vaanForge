# Billing Incident Runbook

## Trigger
Razorpay webhook failure, duplicate payment risk, invoice issue, credit deduction failure, or payment failure spike.

## Symptoms
- Billing webhook status degraded
- Payment failures increase
- Credits not deducted/refunded correctly
- Customer reports invoice mismatch

## Investigation
1. Review webhook event records.
2. Confirm signature verification.
3. Check idempotency keys.
4. Review invoices, payments, and credit transactions.

## Mitigation
- Pause risky billing automation.
- Reprocess only idempotent events.
- Do not trust client-side pricing.

## Owner
Billing operations owner.

## Escalation
Escalate duplicate charge or refund risk to finance and Super Admin.

## Rollback/Recovery
Refund eligible credits through audited credit transaction.

## Postmortem Checklist
Capture provider event ids, impact, fix, prevention, and customer communication.
