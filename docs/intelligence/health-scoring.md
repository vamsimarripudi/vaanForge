# Health Scoring

Health scores are exposed through `/api/v1/admin/intelligence/health-scores`.

## Engines

- Workspace
- Project
- Deployment
- Agent
- Billing
- Marketplace
- Support
- Developer
- Security
- Infrastructure

## Score Shape

Each score is 0-100 and includes reason, evidence, trend, recommended action, and owner.

Scores are deterministic heuristics. They are designed so trained models can replace the scoring implementation later without changing the external contract.

