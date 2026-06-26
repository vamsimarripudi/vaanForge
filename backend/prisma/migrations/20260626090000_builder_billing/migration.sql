CREATE TYPE "BuilderBillingPlanTier" AS ENUM ('free_trial', 'starter', 'pro', 'business', 'enterprise', 'custom');
CREATE TYPE "BuilderBillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "CustomerSubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired');
CREATE TYPE "CustomerInvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'failed', 'void');
CREATE TYPE "CustomerPaymentStatus" AS ENUM ('created', 'paid', 'failed', 'refunded');
CREATE TYPE "CustomerUsageMetric" AS ENUM ('agent_run', 'template_use', 'build_minute', 'ai_credit', 'storage_mb', 'deployment', 'team_member', 'regeneration');
CREATE TYPE "CustomerUsageEventStatus" AS ENUM ('accepted', 'rejected', 'refunded');
CREATE TYPE "CustomerCreditTransactionType" AS ENUM ('grant', 'deduct', 'refund', 'topup', 'adjustment');

CREATE TABLE "billing_plans" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "organizationId" TEXT,
  "tier" "BuilderBillingPlanTier" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "monthlyPrice" INTEGER NOT NULL,
  "yearlyPrice" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "limits" JSONB NOT NULL,
  "creditsIncluded" INTEGER NOT NULL,
  "features" TEXT[] NOT NULL,
  "status" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_subscriptions" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "billingCycle" "BuilderBillingCycle" NOT NULL,
  "status" "CustomerSubscriptionStatus" NOT NULL,
  "razorpaySubscriptionId" TEXT,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "renewalDate" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_invoices" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "paymentId" TEXT,
  "number" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "CustomerInvoiceStatus" NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "lineItems" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_payments" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "invoiceId" TEXT,
  "provider" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "providerOrderId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "CustomerPaymentStatus" NOT NULL,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_usage_limits" (
  "id" TEXT NOT NULL,
  "limitId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "metric" "CustomerUsageMetric" NOT NULL,
  "limitValue" INTEGER NOT NULL,
  "usedValue" INTEGER NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "adminOverride" BOOLEAN NOT NULL DEFAULT false,
  "overrideReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_usage_limits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_usage_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "metric" "CustomerUsageMetric" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "sourceId" TEXT,
  "status" "CustomerUsageEventStatus" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_usage_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_credit_wallets" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL,
  "reserved" INTEGER NOT NULL,
  "lifetimeCredits" INTEGER NOT NULL,
  "lifetimeDebits" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_credit_wallets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_credit_transactions" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "type" "CustomerCreditTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "sourceId" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "razorpay_webhook_events" (
  "id" TEXT NOT NULL,
  "webhookEventId" TEXT NOT NULL,
  "organizationId" TEXT,
  "eventType" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "signatureVerified" BOOLEAN NOT NULL,
  "processed" BOOLEAN NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "razorpay_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_plans_planId_key" ON "billing_plans"("planId");
CREATE INDEX "billing_plans_organizationId_status_idx" ON "billing_plans"("organizationId", "status");
CREATE INDEX "billing_plans_tier_idx" ON "billing_plans"("tier");
CREATE UNIQUE INDEX "customer_subscriptions_subscriptionId_key" ON "customer_subscriptions"("subscriptionId");
CREATE INDEX "customer_subscriptions_organizationId_customerId_idx" ON "customer_subscriptions"("organizationId", "customerId");
CREATE INDEX "customer_subscriptions_organizationId_status_idx" ON "customer_subscriptions"("organizationId", "status");
CREATE UNIQUE INDEX "customer_invoices_invoiceId_key" ON "customer_invoices"("invoiceId");
CREATE UNIQUE INDEX "customer_invoices_organizationId_number_key" ON "customer_invoices"("organizationId", "number");
CREATE INDEX "customer_invoices_organizationId_customerId_idx" ON "customer_invoices"("organizationId", "customerId");
CREATE UNIQUE INDEX "customer_payments_paymentId_key" ON "customer_payments"("paymentId");
CREATE INDEX "customer_payments_organizationId_customerId_idx" ON "customer_payments"("organizationId", "customerId");
CREATE INDEX "customer_payments_providerPaymentId_idx" ON "customer_payments"("providerPaymentId");
CREATE UNIQUE INDEX "customer_usage_limits_limitId_key" ON "customer_usage_limits"("limitId");
CREATE UNIQUE INDEX "customer_usage_limits_organizationId_customerId_metric_key" ON "customer_usage_limits"("organizationId", "customerId", "metric");
CREATE INDEX "customer_usage_limits_organizationId_planId_idx" ON "customer_usage_limits"("organizationId", "planId");
CREATE UNIQUE INDEX "customer_usage_events_eventId_key" ON "customer_usage_events"("eventId");
CREATE INDEX "customer_usage_events_organizationId_customerId_idx" ON "customer_usage_events"("organizationId", "customerId");
CREATE INDEX "customer_usage_events_organizationId_metric_idx" ON "customer_usage_events"("organizationId", "metric");
CREATE UNIQUE INDEX "customer_credit_wallets_walletId_key" ON "customer_credit_wallets"("walletId");
CREATE UNIQUE INDEX "customer_credit_wallets_organizationId_customerId_key" ON "customer_credit_wallets"("organizationId", "customerId");
CREATE UNIQUE INDEX "customer_credit_transactions_transactionId_key" ON "customer_credit_transactions"("transactionId");
CREATE INDEX "customer_credit_transactions_organizationId_customerId_idx" ON "customer_credit_transactions"("organizationId", "customerId");
CREATE UNIQUE INDEX "razorpay_webhook_events_webhookEventId_key" ON "razorpay_webhook_events"("webhookEventId");
CREATE UNIQUE INDEX "razorpay_webhook_events_providerEventId_key" ON "razorpay_webhook_events"("providerEventId");
CREATE INDEX "razorpay_webhook_events_organizationId_eventType_idx" ON "razorpay_webhook_events"("organizationId", "eventType");

ALTER TABLE "billing_plans" ADD CONSTRAINT "billing_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_invoices" ADD CONSTRAINT "customer_invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_usage_limits" ADD CONSTRAINT "customer_usage_limits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_usage_events" ADD CONSTRAINT "customer_usage_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_credit_wallets" ADD CONSTRAINT "customer_credit_wallets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "customer_credit_wallets"("walletId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_credit_transactions" ADD CONSTRAINT "customer_credit_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "razorpay_webhook_events" ADD CONSTRAINT "razorpay_webhook_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
