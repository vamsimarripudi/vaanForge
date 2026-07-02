# Marketplace APIs

Marketplace APIs support app listings, publisher submissions, review decisions, installs, updates, rollback, pricing, and payouts.

## Storefront

- `GET /api/v1/marketplace/apps`
- `GET /api/v1/marketplace/apps/:appId`

## Publisher

- `GET /api/v1/developers/publisher`
- `POST /api/v1/developers/publisher`
- `GET /api/v1/developers/publisher/apps`
- `POST /api/v1/developers/publisher/apps`
- `POST /api/v1/developers/publisher/apps/:appId/submit`
- `POST /api/v1/developers/publisher/apps/:appId/versions`

## Admin Review

- `GET /api/v1/admin/marketplace/reviews`
- `POST /api/v1/admin/marketplace/reviews/:reviewId/decision`

## Workspace Install

- `GET /api/v1/builder/workspace/apps`
- `POST /api/v1/builder/workspace/apps/:appId/install`
- `POST /api/v1/builder/workspace/apps/:appId/uninstall`
- `POST /api/v1/builder/workspace/apps/:appId/update`
- `POST /api/v1/builder/workspace/apps/:appId/rollback`

