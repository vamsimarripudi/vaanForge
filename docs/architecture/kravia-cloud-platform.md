# KRAVIA Cloud Platform Architecture

KCP is an internal platform layer, not a duplicate product stack. VaanForge and future KRAVIA products consume the same identity, gateway, registry, event, storage, secrets, configuration, messaging, AI runtime, build, deploy, monitoring, observability, billing, and console services.

```mermaid
sequenceDiagram
  participant Admin as KRAVIA Console Admin
  participant Console as Console API
  participant Gateway as API Gateway
  participant Registry as Service Registry
  participant Bus as Event Bus
  participant Runtime as AI/Build/Deploy Runtime
  participant Observe as Monitoring + Observability

  Admin->>Console: Open /admin/cloud
  Console->>Gateway: Read normalized KCP snapshot
  Gateway->>Registry: Discover services
  Gateway->>Bus: Read event state
  Gateway->>Runtime: Read jobs and deployments
  Runtime->>Observe: Emit metrics and traces
  Observe-->>Console: Evidence-backed status
```

## Data Model

KCP adds these database surfaces:

- `service_registry`
- `event_bus`
- `storage_objects`
- `secret_store`
- `configuration`
- `notifications`
- `ai_runs`
- `build_jobs`
- `deployments`
- `health_checks`
- `audit_logs`
- `billing`
- `console_preferences`

## Operational Rules

- No service is considered available until it is registered.
- No secret value is exposed through the console.
- No control action runs without a reason.
- No tenant can read another tenant's KCP records.
- Health, event, job, and control evidence is retained for audit.
