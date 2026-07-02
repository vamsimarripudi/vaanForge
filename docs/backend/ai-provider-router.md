# AI Provider Router

The AI router selects a provider using task type, plan context, provider health, estimated cost, token volume, and prompt risk.

## Components

- `ModelRouterService`
- `ModelHealthService`
- `ModelCostTracker`
- `ModelFallbackService`
- `ModelUsageMeter`
- `PromptSafetyService`

## Routing Rules

- Security tasks prefer high-safety providers.
- Code and QA tasks prefer code-capable providers.
- Free plan chat can route to lower-cost providers when healthy.
- Unsafe prompts are blocked for human review.
- Usage events are recorded for cost and credit tracking.

## Provider Status

The router must treat missing or degraded providers as unavailable for primary routing and fall back safely. It must not fake provider success.
