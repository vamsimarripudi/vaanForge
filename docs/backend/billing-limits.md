# Billing Limits

Approved VaanForge plans are centralized in `backend/src/modules/billing/plan-configuration.service.ts`.

The Free plan allows exactly one active project. The enterprise completion project route checks active project usage before creation.

Frontend must consume pricing from backend APIs and must never be source of truth for limits.

