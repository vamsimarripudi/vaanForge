# Usage Metering

Every limited action records a usage event.

## Fields

- organization ID
- workspace ID
- user ID
- plan ID
- action/source
- quantity
- unit
- credits used
- idempotency key
- metadata
- created date

Duplicate idempotency keys do not create duplicate accepted usage. Eligible failed AI actions should refund credits through a refund usage event.
