# Deployment for Developers

Developer-facing deployment work should use the Deployment Agent and never bypass readiness checks.

## Checklist

- Required env variables present
- Secrets masked
- Database migrations ready
- Build passed
- Health checks configured
- Rollback metadata available
- Production confirmation recorded

