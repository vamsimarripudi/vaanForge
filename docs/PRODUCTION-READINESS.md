# Production Readiness

`npm run launch:readiness` is the final environment gate. It must return `ready` and exit with code 0 in the target production environment before traffic is cut over.

Local/demo values are intentionally allowed to produce `limited` readiness. Production must replace every item below.

| Readiness key | Production requirement |
| --- | --- |
| `persistence-mode` | Set `PERSISTENCE_MODE=postgres`. |
| `database-url` | Set `DATABASE_URL` to the reviewed production PostgreSQL connection string, then run `npm run db:migrate:deploy`. |
| `jwt-secret` | Set `JWT_SECRET` to a strong production secret. |
| `root-domain` | Set `ROOT_DOMAIN` to the final approved root domain. |
| `frontend-url` | Set `FRONTEND_URL` to the public HTTPS frontend origin. |
| `memory-adapter` | Set `MEMORY_ADAPTER` to the approved production memory/cache adapter. |
| `realtime-adapter` | Set `REALTIME_ADAPTER` to the approved production realtime adapter. |
| `email-provider` | Replace `EMAIL_PROVIDER=local` with the approved production email provider and credentials. |
| `sms-provider` | Replace `SMS_PROVIDER=local` with the approved production SMS provider and credentials. |
| `storage-provider` | Replace `S3_ENDPOINT=local` with the approved production object storage endpoint and credentials. |
| `ai-provider` | Replace `AI_PROVIDER=deterministic` with the approved production AI provider and credentials. |
| `payments-provider` | Replace `RAZORPAY_KEY_ID=local` and `RAZORPAY_KEY_SECRET=local` with production Razorpay credentials. |

All domain and proxy changes must also update `infrastructure/nginx/vmnexus.conf`, SSL setup, and DNS records together.

Production launch sequence:

1. Install dependencies with `npm ci`.
2. Generate Prisma Client with `npm run prisma:generate --workspace backend`.
3. Apply migrations with `npm run db:migrate:deploy`.
4. Run `npm run typecheck`.
5. Run `npm test`.
6. Run `npm run test:e2e`.
7. Run `npm run phase:status`.
8. Run `npm run build`.
9. Run `npm run launch:readiness` in the production environment and require `ready`.
