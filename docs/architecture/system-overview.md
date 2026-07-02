# System Overview

VaanForge is a modular AI software factory made of intake, planning, execution, validation, security, deployment, operations, billing, marketplace, and memory systems.

```mermaid
flowchart TB
  Intake["Requirement Intake"] --> Planning["Planning + Architecture"]
  Planning --> Execution["Coding Execution"]
  Execution --> Validation["QA + Security Validation"]
  Validation --> Approval["Human Approval"]
  Approval --> Deployment["Deployment + Rollback"]
  Deployment --> Operations["Operations Center"]
  Operations --> Memory["Memory + Knowledge Base"]
  Memory --> Planning
```

## Boundaries

- Frontend renders workflows and calls backend APIs.
- Backend owns business rules, validation, permissions, and audit writes.
- Persistence stores durable workflow state.
- QA scripts enforce architecture, docs, security, and production readiness contracts.

