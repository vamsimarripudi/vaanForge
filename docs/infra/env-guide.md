# Environment Guide

Required variables:

```env
NODE_ENV=development
ROOT_DOMAIN=example.com
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
PORT=4000
PERSISTENCE_MODE=memory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vmnexus
JWT_SECRET=replace-with-secure-secret
SESSION_TTL_SECONDS=28800
PASSWORD_RESET_TTL_SECONDS=1800
MEMORY_ADAPTER=redis
REALTIME_ADAPTER=external
RAZORPAY_KEY_ID=local
RAZORPAY_KEY_SECRET=local
EMAIL_PROVIDER=local
SMS_PROVIDER=local
S3_ENDPOINT=local
AI_PROVIDER=deterministic
```

Never commit real secrets.

`NEXT_PUBLIC_API_BASE_URL` must point the frontend to the deployed API base URL.
`PERSISTENCE_MODE=memory` is for development and controlled demos only. Production must use `PERSISTENCE_MODE=postgres` with a production `DATABASE_URL`.
`EMAIL_PROVIDER=local` is for development and tests only. Production must use a reviewed provider adapter with real credentials.
`SMS_PROVIDER=local` is for development and tests only. Production must use a reviewed provider adapter with real credentials.
`S3_ENDPOINT=local` is for development and tests only. Production must use reviewed object storage credentials.
`AI_PROVIDER=deterministic` is for development and demos only. Production advisory flows require a reviewed AI provider and credentials.
`RAZORPAY_KEY_ID=local` and `RAZORPAY_KEY_SECRET=local` are for development and tests only. Production billing requires real Razorpay credentials and webhook review.
