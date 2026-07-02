# Customer Success

Customer success turns workspace usage, support, billing, onboarding, and deployment data into actionable account health.

## Scores

- health score
- onboarding completion
- usage score
- billing score
- support score
- risk score
- expansion opportunity
- renewal probability

## Actions

- assign success manager
- create follow-up
- schedule call as a CRM task
- create customer task

## APIs

- `GET /api/v1/admin/business/customer-success`
- `POST /api/v1/admin/business/customer-success/:workspaceId/assign`
- `POST /api/v1/admin/business/customer-success/:workspaceId/follow-up`

Scores are deterministic and source-backed. They are not ML predictions.
