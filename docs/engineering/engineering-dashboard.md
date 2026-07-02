# Engineering Dashboard

The engineering dashboard is available at `admin.vaanforge.com/engineering` and `/api/v1/admin/engineering`.

## Data Sources

- Repository health: `factoryValidationRuns`, `factoryErrors`, `securityEvents`, `architectureReviews`
- Active projects: `engineeringProjects`
- Build queue: `cloudJobs`
- Running agent jobs: `agentExecutionRuns`
- Deployment queue: `agentDeployments`
- Technical debt: `technicalDebt`
- Code coverage and trends: `engineeringMetrics`
- Database and queue health: operations health and queue services
- Provider health: provider readiness service

## Metrics

The dashboard exposes repository health, active projects, CI status, build queue, deployment queue, open bugs, open security findings, architecture violations, technical debt, code coverage, performance trends, database health, queue health, and provider health.

No frontend-only metrics are accepted for this dashboard.

