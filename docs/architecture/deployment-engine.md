# Deployment Engine

The deployment engine records readiness, release, verification, health, and rollback evidence.

## Supported Target Categories

- AWS EC2
- S3 + CloudFront
- Docker server
- Vercel optional
- Future KRAVIA-controlled cloud target

## Core Records

- Deployment
- Target
- Checks
- Logs
- Release
- Rollback
- Health check

## Safety

Required environment variables, build status, migration status, storage, domain, SSL, and health checks must pass before live release.

