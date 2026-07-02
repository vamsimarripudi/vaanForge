# Plan Limits

Plan limits are enforced server-side before protected actions.

## Limited Actions

- Create project
- Create workspace
- Invite user
- Generate requirement analysis
- Generate blueprint
- Start agent run
- Generate code
- Run QA
- Run security review
- Deploy
- Upload file
- Create API key
- Use marketplace app
- Create webhook
- Use premium template

## Limit Error

When a limit is reached, APIs return `PLAN_LIMIT_REACHED` with current plan, required plan, used amount, limit amount, upgrade URL, and next action.
