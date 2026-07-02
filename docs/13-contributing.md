# Contributing

VaanForge is a KRAVIA PVT LTD product. Contribution rules depend on repository access and KRAVIA approval.

## Engineering Expectations

- Keep changes scoped to the relevant module.
- Preserve route security and permissions.
- Add or update tests for behavior changes.
- Do not introduce dummy success states or static fake metrics.
- Do not expose provider keys, payment secrets, private file paths, or customer-sensitive data.
- Update docs when routes, workflows, environment variables, or data models change.

## Required Validation

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

## Pull Request Checklist

- Security-sensitive routes include auth middleware.
- Mutations have permissions or a justified signed/public exception.
- Database models include migrations and docs.
- UI empty/error states explain the next action.
- Workflows track owner, status, priority, due date, audit history, activity history, and next action.

