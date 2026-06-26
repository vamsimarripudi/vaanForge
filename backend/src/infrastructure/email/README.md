# Email

Email delivery goes through `email.service.ts`.

- `EMAIL_PROVIDER=local` stores messages in a local outbox for development and tests.
- Any real production provider must implement `EmailProvider` and supply credentials through environment variables.
