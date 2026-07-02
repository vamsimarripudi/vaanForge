# Installation

## Prerequisites

- Node.js 20 or later
- npm workspaces
- PostgreSQL for production persistence
- Optional Redis-compatible service for queue/realtime adapters

## Setup

```powershell
git clone https://github.com/vamsimarripudi/vaanForge.git
cd vaanForge
npm install
Copy-Item .env.example .env
```

## Database

```powershell
npm.cmd run prisma:generate --workspace backend
npm.cmd run db:migrate:deploy
```

For local development, `PERSISTENCE_MODE=memory` can be used where documented. Production should use PostgreSQL.

## Run

```powershell
npm.cmd run dev:frontend
npm.cmd run dev:backend
```

## Validate

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

