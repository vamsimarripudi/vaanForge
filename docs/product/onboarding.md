# VaanForge Onboarding

VaanForge onboarding lives at `app.vaanforge.com/onboarding` and is backed by `/api/v1/onboarding`.

## Flow

1. Welcome
2. Create workspace
3. Choose role
4. Choose use case
5. Create first project
6. AI introduction
7. Connect providers
8. Billing selection
9. Success

Progress is stored continuously in `onboardingProgress`. Completed steps are skipped when the user returns.

## APIs

- `POST /api/v1/onboarding/start`
- `GET /api/v1/onboarding`
- `PATCH /api/v1/onboarding`
- `POST /api/v1/onboarding/complete`

All mutations require authentication and `profile:manage`.
