# Billing Architecture

```mermaid
flowchart LR
  UI["Pricing / Checkout UI"] --> API["Billing Routes"]
  API --> Service["Billing Service"]
  Service --> Plans["Plan Configuration"]
  Service --> Usage["Usage Limits"]
  Service --> Wallet["Credit Wallet"]
  Service --> Provider["Payment Provider Interface"]
  Service --> Audit["Audit Log"]
```

## Principles

- Backend is the pricing source of truth.
- Checkout recalculates price server-side.
- Usage limits are checked before protected actions.
- Payment provider failures must not be converted into fake success.
- Plan price history is tracked.
