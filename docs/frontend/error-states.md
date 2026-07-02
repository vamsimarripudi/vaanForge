# Frontend Error States

Shared page states live in `frontend/src/app/components/states/VaanForgeStates.tsx`.

## Required states

- Loading
- Empty
- Error
- Permission denied
- Plan limit reached
- Not found
- Maintenance
- Offline
- Session expired
- Success

## Rules

No page should render blank on error. Every state needs a clear title, short explanation, primary action, and secondary action where useful. Field-level validation should remain near the field and should not be replaced by toasts.
