# VaanForge Deployment Layout

VaanForge is organized as a workspace with two deployable application folders:

- `frontend/` - customer, builder, and admin dashboard UI.
- `backend/` - API, agent orchestration, database, billing, deployment, and integration services.

Supporting folders such as `shared/`, `design-system/`, `packages/`, `infrastructure/`, and the root `package.json` are required by the workspace builds and should stay with the repository.

## Frontend

```powershell
npm install
npm run build --workspace frontend
```

## Backend

```powershell
npm install
npm run build --workspace backend
npm run test --workspace backend
```

Use environment values from `.env.example` and keep real secrets out of Git.
