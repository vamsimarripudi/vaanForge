# Developer API Keys

Developer API keys are scoped credentials for KRAVIA Developer Platform requests.

## Rules

- Secrets are hashed at rest.
- Full secret is visible only once.
- Revoked keys cannot authenticate.
- Usage logs redact key identifiers.
- Mutations require developer management permission.

