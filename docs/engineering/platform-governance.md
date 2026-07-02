# Platform Governance

Platform governance is exposed through `/api/v1/admin/engineering/governance`.

## Governed Versions

- API versioning from API usage logs
- documentation versioning from documentation versions
- design system versioning from factory design systems
- database versioning from migration history
- agent versioning from agent role and configuration records
- marketplace versioning from marketplace app versions
- SDK versioning from SDK metadata

The governance endpoint reports only records that exist in the backend. It does not invent version status.

## Admin Tools

`/api/v1/admin/engineering/admin-tools` summarizes feature flags, maintenance windows, announcements, emergency locks, read-only mode, provider readiness, queue state, and runtime cache configuration.

