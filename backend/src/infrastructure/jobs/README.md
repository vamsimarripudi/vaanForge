# Jobs

Background jobs go through `job.service.ts`.

Local development records job metadata in memory and forwards payloads to the configured memory adapter. Job records include an idempotency key, attempt count, maximum attempts, timestamps, and last error metadata when enqueue fails. Production should connect this layer to BullMQ or the approved Vaanis queue adapter before high-volume workloads.

Current job names:

- `REPORT_EXPORT_REQUESTED`
- `AUTOMATION_RULE_CREATED`
- `VAANFORGE_BLUEPRINT_REQUESTED`
- `VAANFORGE_EXECUTION_REQUESTED`
