import assert from "node:assert/strict";
import { createId, store } from "../database/in-memory-store";
import { businessOperationsService } from "../modules/business-operations/business-operations.service";
import { crmService } from "../modules/crm/crm.service";
import { financeService } from "../modules/finance/finance.service";

async function main() {
  const organizationId = `org-business-${Date.now()}`;
  const actor = { organizationId, userId: "business-admin", role: "Super Admin" };
  const now = new Date().toISOString();

  store.organizations.push({ id: organizationId, name: "Business Ops Org", suiteType: "VAANFORGE" as any, activePlan: "professional", billingStatus: "ACTIVE" as any, createdAt: now });
  store.workspaces.push({ id: `wks-${organizationId}`, organizationId, suiteType: "VAANFORGE" as any, name: "Business Ops Workspace", enabledProducts: ["VAANFORGE" as any], status: "ACTIVE", createdAt: now });
  store.billingPlans.push({ id: createId("plan"), planId: "professional", tier: "pro", name: "Professional", description: "Professional", monthlyPrice: 299900, yearlyPrice: 2999000, currency: "INR", limits: {}, creditsIncluded: 25000, features: [], status: "active", ownerId: actor.userId, priority: "HIGH", dueDate: now, nextAction: "Monitor", activityHistory: [], createdAt: now, updatedAt: now });
  store.customerSubscriptions.push({ id: createId("sub"), subscriptionId: "sub_business", organizationId, customerId: actor.userId, planId: "professional", billingCycle: "MONTHLY", status: "active", currentPeriodStart: now, currentPeriodEnd: new Date(Date.now() + 20 * 86400000).toISOString(), renewalDate: new Date(Date.now() + 20 * 86400000).toISOString(), cancelAtPeriodEnd: false, ownerId: actor.userId, priority: "HIGH", dueDate: now, nextAction: "Renew", activityHistory: [], createdAt: now, updatedAt: now });
  store.customerCreditWallets.push({ id: createId("cw"), walletId: "wallet_business", organizationId, customerId: actor.userId, balance: 250, reserved: 0, lifetimeCredits: 250, lifetimeDebits: 0, createdAt: now, updatedAt: now });
  store.customerUsageEvents.push({ id: createId("cue"), eventId: "usage_business", organizationId, customerId: actor.userId, workspaceId: `wks-${organizationId}`, userId: actor.userId, metric: "ai_credit", quantity: 1200, unit: "credit", planId: "professional", creditsUsed: 1200, source: "business_test", idempotencyKey: "business-usage", status: "accepted", metadata: {}, createdAt: now });
  store.supportTickets.push({ id: createId("ticket"), organizationId, subject: "Billing question", priority: "HIGH", status: "OPEN", createdAt: now });
  store.agentDeployments.push({ id: createId("dep"), deploymentId: "dep_business", runId: "run_business", organizationId, targetType: "DOCKER_SERVER", targetName: "Production", environment: "production", ownerId: actor.userId, priority: "HIGH", status: "live", releaseId: "rel_business", requiredEnvVars: [], config: {}, checks: [], logs: [], releases: [], rollbacks: [], healthChecks: [], confirmedProduction: true, nextAction: "Monitor", activityHistory: [], createdAt: now, updatedAt: now } as any);

  await financeService.addRevenue({ organizationId, source: "subscription", amount: 299900, receivedAt: now, product: "VaanForge" });
  await financeService.addExpense({ organizationId, category: "cloud", amount: 50000, spentAt: now, vendor: "Cloud" });
  const finance = await financeService.summary(organizationId);
  assert.equal(finance.revenueTotal, 299900);
  assert.equal(finance.grossProfit, 249900);

  const lead = await crmService.createLead({ organizationId, name: "Acme AI", company: "Acme", email: "buyer@acme.test", source: "enterprise", stage: "NEW", expectedValue: 500000 });
  const opportunity = businessOperationsService.createOpportunity(actor, { leadId: lead.id, name: "Acme enterprise rollout", stage: "QUALIFIED", value: 500000, ownerId: actor.userId });
  assert.equal(opportunity.stage, "QUALIFIED");
  assert.equal(businessOperationsService.updateOpportunity(actor, opportunity.opportunityId, { stage: "NEGOTIATION" }).probability, 80);

  const health = businessOperationsService.customerHealth(actor)[0];
  assert.equal(health.organizationId, organizationId);
  assert.equal(health.healthScore > 0, true);
  assert.equal(businessOperationsService.assignSuccessManager(actor, organizationId, actor.userId).successManagerId, actor.userId);
  assert.equal(businessOperationsService.createFollowUp(actor, organizationId, { title: "Schedule QBR", successManagerId: actor.userId }).status, "open");

  const subscriptionOps = businessOperationsService.subscriptionOperations(actor);
  assert.equal(subscriptionOps.some((item) => item.operationType === "renewal_due"), true);
  assert.equal(subscriptionOps.some((item) => item.operationType === "credits_low"), true);
  assert.equal(businessOperationsService.performSubscriptionAction(actor, { operationType: "grant_credits", evidence: { credits: 1000 } }).status, "completed");

  businessOperationsService.addProviderCost(actor, { provider: "openai", requests: 10, inputTokens: 1000, outputTokens: 500, latencyMs: 220, errors: 1, estimatedCost: 42, creditsConsumed: 150 });
  businessOperationsService.addInfrastructureCost(actor, { category: "compute", amount: 1200, unit: "INR", evidence: { source: "deployment worker" } });
  assert.equal(businessOperationsService.aiCosts(actor).summary.creditsConsumed, 150);
  assert.equal(businessOperationsService.infrastructureCosts(actor).summary.totalCost, 1200);

  const dashboard = businessOperationsService.executiveDashboard(actor);
  assert.equal(dashboard.metrics.mrr, 299900);
  assert.equal(dashboard.metrics.arr, 3598800);
  assert.equal(dashboard.metrics.deploymentSuccessRate, 100);
  assert.equal(dashboard.sources.subscriptions.includes("customerSubscriptions"), true);

  const report = businessOperationsService.createBusinessReport(actor, { reportType: "executive", format: "CSV" });
  assert.equal(report.status, "READY");
  assert.equal(report.content.includes("metrics.mrr"), true);
  assert.equal(businessOperationsService.automationQueue(actor).lowCreditReminders.length >= 1, true);

  console.log("Business operations test passed for executive KPIs, CRM, customer health, finance, subscription ops, AI/infrastructure costs, automation, and reports.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
