# App Subdomain

`app.vaanforge.com` is the logged-in product home for projects and workspace activity.

## Contracts

- `GET /api/v1/dashboard/summary`
- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:projectId`
- `PATCH /api/v1/projects/:projectId`
- `DELETE /api/v1/projects/:projectId`
- `POST /api/v1/projects/:projectId/archive`
- `POST /api/v1/projects/:projectId/restore`
- `GET /api/v1/projects/:projectId/activity`
- `GET /api/v1/projects/:projectId/usage`

## Rules

Project creation is server-side usage-gated. The Free plan is enforced through the billing limit engine and blocks additional active projects with an upgrade response.

