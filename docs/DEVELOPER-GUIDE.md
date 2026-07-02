# Developer Guide

## Local Setup

Install dependencies from the repository root:

```bash
npm.cmd install
```

Use these commands during development:

```bash
npm.cmd run dev:frontend
npm.cmd run dev:backend
npm.cmd run typecheck
npm.cmd run test:e2e
```

## Repository Map

- `frontend/` contains the Vite React web application.
- `backend/` contains the Express API and operational checks.
- `shared/` contains shared configuration and package code.
- `design-system/` contains shared UI package foundations.
- `docs/` contains product, engineering, launch, security, and operations documentation.
- `scripts/` contains contract checks used by `npm run test:e2e`.

## Development Rules

- Keep PDF-required route, API, database, and frontend contracts covered by scripts.
- Add auth, permission checks, validation, error handling, and audit logging where required for every backend API.
- Keep launch readiness honest: placeholder providers and memory persistence must remain visible until production dependencies are configured.
- Update `docs/CHANGELOG.md`, `docs/PHASE-TRACKER.md`, and daily notes when a phase changes user-visible behavior.

## Phase Execution Rules

- Explain objective.
- Create/update files.
- Keep code readable.
- Add comments where needed.
- Update docs.
- Update daily note.
- Update phase tracker.
- Add tests where reasonable.
- Avoid breaking previous phases.
- Continue to the next phase without asking unless blocked by missing secrets.
- When blocked, create a placeholder, document the value needed, and continue with a mock adapter.

## Quality Rules

- No messy code.
- No hardcoded secrets.
- No hardcoded domains.
- No duplicate components.
- No unclear file names.
- No undocumented business logic.
- No fake production claims.
- No random UI.
- No broken mobile layouts.
- No financial calculations without formulas.
- No legal output without disclaimers.
- Avoid clever code.
- Prefer readable code.
- Documentation is mandatory.
- Maintainability is more important than short code.

## Final Rule

Build the ecosystem as if future developers will maintain it without the founder present. Every decision should optimize for clarity, scalability, maintainability, documentation, long-term growth, and ease of onboarding new team members.
