CREATE TYPE "CustomerPaymentAttemptStatus" AS ENUM ('pending', 'succeeded', 'failed', 'retry_scheduled');

ALTER TABLE "customer_subscriptions"
  ADD COLUMN "providerCheckoutId" TEXT,
  ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3),
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastPaymentFailureReason" TEXT,
  ADD COLUMN "pendingPlanId" TEXT,
  ADD COLUMN "pendingBillingCycle" "BuilderBillingCycle";

ALTER TABLE "customer_invoices"
  ADD COLUMN "gstin" TEXT,
  ADD COLUMN "subtotal" INTEGER,
  ADD COLUMN "gstRatePercent" INTEGER,
  ADD COLUMN "gstAmount" INTEGER,
  ADD COLUMN "downloadUrl" TEXT,
  ADD COLUMN "pdfContent" TEXT;

ALTER TABLE "customer_payments"
  ADD COLUMN "providerSubscriptionId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextRetryAt" TIMESTAMP(3),
  ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "customer_payments_idempotencyKey_key" ON "customer_payments"("idempotencyKey");

CREATE TABLE "customer_payment_attempts" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "invoiceId" TEXT,
  "paymentId" TEXT,
  "provider" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "providerOrderId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "CustomerPaymentAttemptStatus" NOT NULL,
  "failureReason" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "nextRetryAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "customer_payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_payment_attempts_attemptId_key" ON "customer_payment_attempts"("attemptId");
CREATE INDEX "customer_payment_attempts_organizationId_customerId_idx" ON "customer_payment_attempts"("organizationId", "customerId");
CREATE INDEX "customer_payment_attempts_organizationId_status_idx" ON "customer_payment_attempts"("organizationId", "status");
CREATE INDEX "customer_payment_attempts_idempotencyKey_idx" ON "customer_payment_attempts"("idempotencyKey");

ALTER TABLE "customer_payment_attempts" ADD CONSTRAINT "customer_payment_attempts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
