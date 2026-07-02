# Builder APIs

Builder APIs power the customer-facing project creation and delivery workflow.

## Routes

- `GET /api/v1/builder/projects`
- `POST /api/v1/builder/projects`
- `POST /api/v1/builder/projects/:projectId/requirements`
- `GET /api/v1/builder/projects/:projectId/blueprint`
- `POST /api/v1/builder/projects/:projectId/blueprint/approve`
- `POST /api/v1/builder/projects/:projectId/change-requests`

## Rules

- Blueprint approval is required before coding starts.
- Change requests create new task/version records.
- Customer actions are audited.

