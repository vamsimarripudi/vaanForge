# UI/UX Code Foundation

VaanForge frontend code should stay simple, backend-driven, and state-aware.

## Structure

Page -> Feature Module -> Component -> Hook -> API Client -> State/Cache Layer

## Required Page States

- Loading
- Empty
- Error
- Permission denied
- Plan limit reached
- Not found
- Maintenance
- Offline
- Session expired

## Interaction Rules

- No static metrics in production views.
- No fake success states.
- Every primary action maps to an API.
- Long-running actions show backend status.
- Errors show safe reason and recovery action.
- Forms validate locally for UX but trust backend validation as source of truth.

## Visual Direction

Use clean spacing, restrained typography, short copy, accessible focus states, and responsive layout primitives. Avoid clutter, decorative gradients, and oversized text in product surfaces.
