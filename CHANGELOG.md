# Changelog

## v1.0.0-rc1 - 2026-06-29

Release Candidate 1 locks VaanForge for closed-beta approval. Feature development is frozen; only bug fixes, security fixes, performance improvements, and documentation updates are allowed until RC1 acceptance.

### Added

- RC1 release documentation set.
- Executive readiness report at `docs/releases/RC1_READINESS.md`.
- Beta readiness evidence at `docs/audits/beta-readiness-report.md`.

### Changed

- README validation command guidance corrected while preserving legacy QA-contract wording.
- Production hardening from Sprints 1-5 is now treated as the release baseline.

### Validated

- Lint
- Type-check
- Backend workflow tests
- E2E and QA contracts
- Production build

### Known Limitations

- Local `launch:readiness` remains `limited` until production persistence, secrets, providers, queue/realtime, storage, payments, and AI settings are configured.
- No benchmark/load-test suite exists yet.
