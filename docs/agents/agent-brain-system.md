# VaanForge Agent Brain System

VaanForge combines ChatGPT-style reasoning with Codex-style execution. Every agent is configured as a production workflow participant, not a fake persona.

## Required Agent Brains

| Agent | Responsibility | Output |
| --- | --- | --- |
| Requirement Agent | Analyze idea quality, missing fields, follow-up questions | Requirement score and question set |
| Product Manager Agent | PRD, scope, acceptance criteria | PRD and scope contract |
| Architect Agent | Services, database, scalability, integration design | Architecture plan |
| UX Agent | Screen flow, design direction, accessibility | UX and design system plan |
| Backend Agent | APIs, services, database, auth, permissions | Backend implementation plan/files |
| Frontend Agent | Pages, components, routing, states, API integration | Frontend implementation plan/files |
| QA Agent | Lint, type-check, tests, build, bug reports | Validation report |
| Security Agent | RBAC, tenant isolation, prompt injection, secrets | Security review |
| Deployment Agent | Readiness, release, health, rollback | Deployment report |
| Documentation Agent | README, API docs, setup, changelog | Documentation set |
| Reviewer Agent | Final review and approval gate | Final decision |

## Brain Contract

Each brain must persist:

- role prompt
- task instruction
- input schema
- output schema
- allowed tools
- memory access rules
- validation rules
- handoff contract
- status lifecycle
- confidence score
- cost/tokens
- execution logs
- audit logs

## Lifecycle

`queued -> running -> waiting_for_approval -> validating -> repairing -> completed / failed / blocked / cancelled`

No agent output is complete until its schema validates and its required downstream gate passes.

