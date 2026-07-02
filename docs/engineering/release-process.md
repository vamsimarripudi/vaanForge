# Engineering Release Process

VaanForge engineering release governance is tracked through `/api/v1/admin/engineering/release-pipeline`.

## Stages

- development
- internal_qa
- security_review
- release_candidate
- beta
- general_availability
- hotfix
- patch
- lts

## Required Evidence

Every release pipeline gate stores:

- release ID
- stage
- status
- approval requirement
- rollback plan
- validation report reference
- documentation URL
- migration notes
- owner
- next action

The release pipeline complements the production release lifecycle APIs. It does not replace deployment safety checks.

