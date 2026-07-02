# Backend Architecture

VaanForge backend follows a layered structure:

Controller / Route -> Application Service -> Domain Service -> Repository / Store -> Database.

Current implementation uses Express with strict TypeScript, Zod validation, auth middleware, permission guards, audit logging, and in-memory persistence for local/test execution with Prisma schema coverage for production database evolution.

The enterprise completion module provides canonical `/api/v1` contract coverage while preserving existing working domain modules.

