# Self-Healing

The self-healing engine is available through `/api/v1/admin/intelligence/self-heal`.

## Supported Detection

- failed jobs
- queue backlog
- retry-safe failures
- disconnected workers
- missing provider credentials
- broken webhooks
- failed deployments
- expired API keys
- failed emails

## Repair Rules

Only safe actions run automatically. Current safe repairs include requeueing failed jobs and retrying failed email messages.

Potentially destructive or externally risky actions require human approval, including webhook repair, deployment rollback, provider credential repair, and API key rotation.

Every repair creates a repair action, repair attempt when applicable, timeline, and audit log.

