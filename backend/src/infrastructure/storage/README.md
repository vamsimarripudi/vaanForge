# Storage

File/object storage goes through `storage.service.ts`.

- `S3_ENDPOINT=local` stores objects in a local in-memory object map for development and tests.
- Production must use a reviewed S3-compatible adapter with real credentials.
