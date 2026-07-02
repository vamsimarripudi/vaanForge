# Toast System

Toast helpers live in `frontend/src/app/components/toast/vaanforgeToast.ts`.

## Variants

- success
- error
- warning
- info
- loading
- progress
- undo
- plan-limit
- payment
- deployment
- AI-run

## Rules

Success toasts only appear after backend confirmation. Errors include safe request IDs where available. Recoverable errors can expose a retry action. Critical errors must remain visible long enough for the user to read and act.
