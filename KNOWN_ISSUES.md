# Known Issues - v1.0.0-rc1

## P0

None known after RC1 validation.

## P1

- Local `npm run launch:readiness` reports `limited` until production secrets, provider adapters, PostgreSQL persistence, realtime/queue, storage, payments, and AI configuration are set.
- No benchmark/load-test suite exists yet.
- Production queue workers and dead-letter queue are not connected in this local repository state.
- Malware scanning adapter is not connected for uploaded files.
- Device-session management and email verification are not complete enterprise flows.
- Production outage simulations for PostgreSQL, Redis/queue, payment provider, storage, and AI provider have not been run.

## P2

- Add admin audit search by request ID.
- Expand production deployment runbook once final hosting and provider decisions are locked.
- Add response-size budgets for heavy admin dashboards.
- Add broader nested object-level authorization tests.
