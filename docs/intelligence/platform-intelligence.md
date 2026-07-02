# Platform Intelligence

VaanForge Platform Intelligence lives at `admin.vaanforge.com/intelligence` and `/api/v1/admin/intelligence`.

It calculates health across executive, product, engineering, AI, customer, billing, infrastructure, security, marketplace, and support surfaces.

## Rule Engine

The current implementation is deterministic. It uses persisted backend records such as operations health checks, subscriptions, support tickets, provider cost events, security events, deployments, validation runs, and engineering governance records.

No score is generated from frontend-only state.

## Output Contract

Every section includes:

- score
- why the score exists
- evidence
- suggested action

