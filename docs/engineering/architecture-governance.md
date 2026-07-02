# Architecture Governance

VaanForge architecture governance is managed through `admin.vaanforge.com/engineering/architecture` and the `/api/v1/admin/engineering/architecture` APIs.

## Records

- Architecture Decisions (ADR): versioned decisions with context, decision, consequences, owner, status, and approval history.
- Architecture Reviews: project-level reviews with architecture version, reviewer, findings, evidence, next action, and status.
- Compliance: calculated from real review records. Approval rate is not estimated.

## Workflow

1. Create an ADR when architecture changes.
2. Request an architecture review for the project and version.
3. Record findings and evidence.
4. Approve or request changes.
5. Approved reviews update the engineering project architecture version.

## Controls

All mutation routes require authenticated admin access and `settings:manage`. Every decision and review update writes an audit event.

