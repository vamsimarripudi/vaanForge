# No Static Code Audit

Product: VaanForge
Company: KRAVIA PRIVATE LIMITED
Sprint: Master Code Quality Upgrade

## Summary

This audit focused on production-facing static, dummy, fake, placeholder, and local-only behavior. The main production issue found in this pass was that ML scoring and proof-ledger APIs existed through older compatibility routes with module-local arrays. The sprint added canonical `/api/v1/ml/*` and `/api/v1/proof-records/*` implementations backed by the shared application store, secured route middleware, validation, audit logging, and explicit heuristic/local-provider semantics.

## Fixed Now

| Area | Finding | Fix |
| --- | --- | --- |
| ML intelligence | Older endpoints mixed deterministic scoring with module-local persistence. | Added `MlEnginesService`, typed engine interfaces, persisted `mlScores`, validation, safe route errors, and canonical `/ml` router. |
| Proof ledger | Older proof records were local to a compatibility service. | Added `ProofLedgerService`, `HashingService`, `ProofProvider`, `LocalProofProvider`, persisted `proofRecords`, verification, and audit logs. |
| AI routing | Agents were not insulated by a reusable routing contract. | Added provider-agnostic `ModelRouterService` with health, cost, fallback, usage, and prompt safety interfaces. |
| Secret exposure risk | Proof metadata could contain sensitive keys if callers sent them. | Metadata masking now redacts key, token, secret, password, and private-key fields. |
| Route contracts | New ML/proof routes needed standard errors and permissions. | Added `authMiddleware`, `requirePermission(...)`, Zod validation, and safe error responses. |

## Classified Findings

| Pattern | Classification | Action |
| --- | --- | --- |
| Deterministic ML engines | Production-safe foundation | Kept, marked `engineType: heuristic`, persisted with rule version and evidence. |
| Local proof provider | Production-safe foundation until blockchain adapter is configured | Kept, explicitly marks `provider: local` and never returns fake transaction IDs. |
| Test fixtures | Acceptable dev/test fixture | Left in tests only. |
| Provider placeholder readiness values | Safe operational state | Kept as readiness states, not fake success. |
| Static UI assets | Acceptable product assets | Not changed in backend quality sprint. |

## Remaining Backlog

| Priority | Item | Recommendation |
| --- | --- | --- |
| P1 | Replace in-memory store with durable database repositories for all production deployments. | Keep current store for local/test, add Prisma repositories per module before production launch. |
| P1 | Delegate older enterprise-completion compatibility ML/proof methods to canonical services. | Preserve old routes for backward compatibility but remove local arrays in a follow-up hardening pass. |
| P2 | Add automated static-data scanner to CI. | Fail CI on production files containing fake/demo/mock dashboard data outside tests/docs. |

## Production Rule

No score, proof, model route, dashboard metric, or provider health result should claim trained ML, on-chain anchoring, provider availability, or production success unless backed by real configured state.
