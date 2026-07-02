# VaanForge Marketplace

The VaanForge Marketplace lists reviewed apps, templates, plugins, integrations, agent extensions, and workflow automations for the KRAVIA ecosystem.

## Source of truth

Marketplace data is stored in backend records:

- `marketplace_apps`
- `marketplace_app_versions`
- `marketplace_categories`
- `marketplace_installs`
- `marketplace_permissions`
- `marketplace_reviews`
- `marketplace_publishers`
- `marketplace_revenue_events`
- `marketplace_payouts`

The storefront never renders static marketplace cards. If no reviewed apps exist, the UI must show an empty state.

## Review gates

Every app version must pass security, code scan, permission, and manual review before public listing. Versions are immutable after submission. Published app changes require a new version.

## Installs

Workspace installs require authentication, workspace permission, and explicit consent to requested permissions. Paid installs connect to billing and create revenue/payout records.

## Public APIs

- `GET /api/v1/marketplace/apps`
- `GET /api/v1/marketplace/apps/:appId`
- `GET /api/v1/marketplace/categories`

## Protected APIs

- `POST /api/v1/marketplace/apps`
- `PATCH /api/v1/marketplace/apps/:appId`
- `POST /api/v1/marketplace/apps/:appId/submit-review`
- `POST /api/v1/marketplace/apps/:appId/publish`
- `POST /api/v1/marketplace/apps/:appId/install`
- `POST /api/v1/marketplace/apps/:appId/uninstall`
- `GET /api/v1/marketplace/installs`
- `GET /api/v1/marketplace/publisher`
- `GET /api/v1/marketplace/publisher/apps`
- `GET /api/v1/marketplace/publisher/revenue`

## Admin APIs

- `GET /api/v1/admin/marketplace/reviews`
- `POST /api/v1/admin/marketplace/reviews/:reviewId/approve`
- `POST /api/v1/admin/marketplace/reviews/:reviewId/reject`
- `POST /api/v1/admin/marketplace/apps/:appId/suspend`

## Trust rules

No fake ratings, installs, reviews, or revenue are shown. Ratings remain disabled until a customer review policy and moderation workflow are approved.
