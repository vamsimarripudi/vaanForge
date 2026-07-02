# Development

VaanForge is organized as a TypeScript workspace. Frontend and backend are deployable independently but share repository-level scripts and domain configuration.

## Local Workflow

1. Create or update implementation in the smallest relevant module.
2. Add or update tests when behavior changes.
3. Run typecheck and lint.
4. Run backend tests and E2E contracts.
5. Run production build before handoff.

## Commands

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev:frontend` | Start the Vite React app. |
| `npm.cmd run dev:backend` | Start the Express API. |
| `npm.cmd run typecheck` | Check frontend and backend TypeScript. |
| `npm.cmd run lint` | Run frontend lint. |
| `npm.cmd run test` | Run backend service tests. |
| `npm.cmd run test:e2e` | Run repository QA contracts. |
| `npm.cmd run build` | Build frontend and backend. |

## Engineering Expectations

- Keep modules scoped and explicit.
- Avoid fake metrics, fake success states, and static-only data.
- Use audited workflow transitions for sensitive actions.
- Keep secrets out of logs, memory, and generated output.
