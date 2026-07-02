# Environment Management

VaanForge environments are governed through `/api/v1/admin/engineering/environments`.

## Supported Environments

- development
- testing
- staging
- production
- sandbox
- preview

## Tracked Readiness

Each environment stores:

- region
- owner
- provider readiness
- secrets status
- database status
- storage status
- queue status
- worker status
- deployment status

Health samples are appended as evidence-backed records. Production cannot be marked healthy by frontend state alone.

