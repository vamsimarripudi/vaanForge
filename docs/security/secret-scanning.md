# Secret Scanning

Secret scanning protects generated files, uploads, documentation, memory, agent outputs, and support attachments before they become durable product records.

## Detected Patterns

- private keys
- provider keys
- JWTs
- cloud access keys
- generic secret/token/password assignments

## Outcomes

- `allowed`
- `redacted`
- `blocked`

High-confidence findings are blocked and create security events. Medium-confidence findings are redacted where safe. Secret values must never be logged.
