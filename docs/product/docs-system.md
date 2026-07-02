# VaanForge Docs System

The docs subdomain serves action-oriented documentation for users, developers, security reviewers, billing admins, and operators.

## Content model

Documentation can come from repository markdown or managed docs records. Published docs are indexed for backend search.

Tracked records:

- `docs_articles`
- `docs_versions`
- `docs_categories`
- `docs_search_index`

## APIs

- `GET /api/v1/docs`
- `GET /api/v1/docs/:slug`
- `GET /api/v1/docs/search`
- `GET /api/v1/docs/categories`
- `POST /api/v1/admin/docs`
- `PATCH /api/v1/admin/docs/:docId`
- `POST /api/v1/admin/docs/:docId/publish`

## Rules

Docs should be short, workflow-based, and linked to product surfaces. Admin publishing requires permission. Unsupported product claims must not be documented as complete.
