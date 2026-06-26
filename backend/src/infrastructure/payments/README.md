# Payments

Payment checkout creation goes through `payments.service.ts`.

- `RAZORPAY_KEY_ID=local` and `RAZORPAY_KEY_SECRET=local` create local checkout sessions for development and tests.
- Production must use real Razorpay credentials and a reviewed adapter/webhook flow.
