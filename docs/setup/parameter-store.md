# AWS Parameter Store Setup

VaanForge production deployments must load secrets from AWS Systems Manager Parameter Store unless an approved break-glass deployment explicitly sets `ALLOW_LOCAL_ENV_IN_PRODUCTION=true`.

## Required production flags

```env
NODE_ENV=production
PARAMETER_STORE_ENABLED=true
PARAMETER_STORE_PREFIX=/vaanforge/prod
AWS_REGION=ap-south-1
```

## Required paths

| Provider | Parameter paths |
| --- | --- |
| PostgreSQL | `/vaanforge/prod/postgresql/database-url` |
| Razorpay | `/vaanforge/prod/razorpay/key-id`, `/vaanforge/prod/razorpay/key-secret`, `/vaanforge/prod/razorpay/webhook-secret` |
| Redis | `/vaanforge/prod/redis/url` |
| S3 | `/vaanforge/prod/s3/endpoint`, `/vaanforge/prod/s3/bucket` |
| AWS | `/vaanforge/prod/aws/region` |
| VFormix webhook | `/vaanforge/prod/vformix/webhook-token` |

## Enforcement

Production boot fails if placeholder secrets remain or Parameter Store is disabled without break-glass approval. Secret values must never be logged; admin readiness shows only masked state and missing path names.
