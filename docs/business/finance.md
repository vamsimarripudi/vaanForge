# Finance

The finance module tracks revenue, expenses, P&L, GST estimate, cash flow, and exports.

## APIs

- `GET /api/v1/finance/overview`
- `GET /api/v1/finance/revenue`
- `GET /api/v1/finance/expenses`
- `GET /api/v1/finance/pnl`
- `GET /api/v1/finance/reports`
- `POST /api/v1/finance/exports`

## Calculation Sources

- `revenues`
- `expenses`
- subscription records
- marketplace revenue events
- partner payout/commission records

Finance exports are generated from backend records and audited.
