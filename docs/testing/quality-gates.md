# Quality Gates

Every VaanForge production sprint must pass:

```bash
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run build
```

## Contract Gates

- Route security contract
- API response contract
- Billing and plan-limit contract
- Environment readiness contract
- Provider readiness contract
- Webhook signature contract
- Static-data audit contract

## Current Sprint Coverage

The code-quality upgrade added regression coverage for:

- heuristic ML output contract
- prompt-risk detection
- model routing and usage-cost recording
- local proof-ledger hash creation
- proof verification
- metadata secret masking

Tests must not be skipped or weakened to pass CI.
