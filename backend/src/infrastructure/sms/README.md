# SMS

SMS delivery goes through `sms.service.ts`.

- `SMS_PROVIDER=local` stores messages in a local outbox for development and tests.
- Production must use a reviewed provider adapter with real credentials.
