# Backend Error Response Contract

All backend errors should resolve to a safe envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": {
      "email": "Enter a valid email address."
    },
    "recoverable": true,
    "nextAction": "fix_fields"
  },
  "requestId": "req_xxx"
}
```

## Categories

- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `PERMISSION_DENIED`
- `PLAN_LIMIT_REACHED`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `PAYMENT_FAILED`
- `WEBHOOK_INVALID`
- `PROVIDER_UNAVAILABLE`
- `DEPLOYMENT_FAILED`
- `FILE_UPLOAD_FAILED`
- `INTERNAL_ERROR`

## Safety rules

Errors must not expose stack traces, secrets, provider keys, private file paths, or raw webhook payloads. Every error includes `requestId`.
