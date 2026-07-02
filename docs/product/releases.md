# VaanForge Releases

The releases subdomain publishes versioned release notes, changelog items, migration notes, and known issues.

## Data model

- `release_notes`
- `release_versions`
- `release_changelog_items`

## APIs

- `GET /api/v1/releases`
- `GET /api/v1/releases/:releaseId`
- `GET /api/v1/releases/changelog`
- `POST /api/v1/admin/releases`
- `PATCH /api/v1/admin/releases/:releaseId`
- `POST /api/v1/admin/releases/:releaseId/publish`

## Rules

Release notes must map to real release records. Do not publish fake release history. Known issues and migration notes should be explicit when they exist.
