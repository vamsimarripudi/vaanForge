import { z } from "zod";
import { createId, store, type StoredBusinessReport, type StoredCrmOpportunity, type StoredCustomerHealthScore, type StoredSubscriptionOperation } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

export type BusinessActor = { organizationId: string; userId: string; role: string };

const opportunityStages = ["NEW_LEAD", "QUALIFIED", "DEMO_SCHEDULED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "CUSTOMER", "LOST"] as const;
const reportTypes = ["executive", "finance", "billing", "support", "marketplace", "security", "deployment", "ai_usage", "developer"] as const;
const reportFormats = ["PDF", "CSV", "EXCEL"] as const;

export const opportunitySchema = z.object({
  leadId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  name: z.string().min(2),
  stage: z.enum(opportunityStages).default("NEW_LEAD"),
  value: z.number().nonnegative().default(0),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().min(2)
});

export const opportunityPatchSchema = opportunitySchema.partial();

export const healthActionSchema = z.object({
  successManagerId: z.string().min(2).optional(),
  title: z.string().min(3).optional(),
  dueDate: z.string().optional()
});

export const subscriptionActionSchema = z.object({
  operationType: z.enum(["grant_credits", "extend_subscription", "suspend_workspace", "reactivate_workspace"]),
  subscriptionId: z.string().optional(),
  evidence: z.record(z.unknown()).default({}),
  dueDate: z.string().optional()
});

export const providerCostSchema = z.object({
  provider: z.enum(["openai", "gemini", "claude", "groq", "hugging_face", "other"]),
  requests: z.number().int().min(0),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  latencyMs: z.number().min(0),
  errors: z.number().int().min(0),
  estimatedCost: z.number().min(0),
  creditsConsumed: z.number().min(0),
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional()
});

export const infrastructureCostSchema = z.object({
  category: z.enum(["compute", "storage", "bandwidth", "cache", "database", "email", "ai_provider", "marketplace", "support"]),
  amount: z.number().min(0),
  unit: z.string().min(1).default("INR"),
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  deploymentId: z.string().optional(),
  evidence: z.record(z.unknown()).default({})
});

export const businessReportSchema = z.object({
  reportType: z.enum(reportTypes),
  format: z.enum(reportFormats)
});

export class BusinessOperationsService {
  executiveDashboard(actor: BusinessActor) {
    const subscriptions = store.customerSubscriptions.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const paidSubscriptions = subscriptions.filter((item) => item.status === "active" && item.planId !== "free");
    const freeSubscriptions = subscriptions.filter((item) => item.planId === "free");
    const monthlyRevenue = paidSubscriptions.reduce((sum, sub) => sum + planMonthlyAmount(sub.planId), 0);
    const revenue = store.revenues.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const expenses = store.expenses.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const usage = store.customerUsageEvents.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const deployments = store.agentDeployments.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const support = store.supportTickets.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const incidents = store.operationsIncidents.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const marketplaceRevenue = store.marketplaceRevenueEvents.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").reduce((sum, item) => sum + item.amount, 0);
    const partnerIds = new Set(store.partners.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").map((item) => item.id));
    const partnerRevenue = store.partnerCommissions.filter((item) => partnerIds.has(item.partnerId)).reduce((sum, item) => sum + item.amount, 0);
    const cost = this.infrastructureCosts(actor).summary.totalCost + this.aiCosts(actor).summary.estimatedCost;
    const totalUsers = freeSubscriptions.length + paidSubscriptions.length;
    const churned = subscriptions.filter((item) => ["cancelled", "expired"].includes(item.status)).length;
    const deploymentSuccesses = deployments.filter((item) => ["live", "rolled_back"].includes(item.status)).length;

    return {
      metrics: {
        mrr: monthlyRevenue,
        arr: monthlyRevenue * 12,
        activeSubscriptions: subscriptions.filter((item) => item.status === "active").length,
        freeUsers: freeSubscriptions.length,
        paidUsers: paidSubscriptions.length,
        conversionRate: percent(paidSubscriptions.length, totalUsers),
        churnRate: percent(churned, subscriptions.length),
        aiCreditConsumption: usage.reduce((sum, item) => sum + (item.creditsUsed || 0), 0),
        infrastructureCostEstimate: Number(cost.toFixed(2)),
        apiUsage: store.apiUsageLogs.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").length,
        deploymentSuccessRate: percent(deploymentSuccesses, deployments.length),
        customerSatisfaction: support.length ? percent(support.filter((ticket) => ticket.status === "CLOSED").length, support.length) : 0,
        openIncidents: incidents.filter((item) => !["resolved", "postmortem"].includes(item.status)).length,
        openSupportTickets: support.filter((ticket) => ticket.status !== "CLOSED").length,
        marketplaceRevenue,
        partnerRevenue
      },
      sources: {
        subscriptions: "customerSubscriptions plan/status records",
        revenue: "revenues and billing plans",
        usage: "customerUsageEvents and apiUsageLogs",
        deployments: "agentDeployments status records",
        support: "supportTickets",
        incidents: "operationsIncidents",
        costs: "providerCostEvents and infrastructureCostEvents",
        marketplace: "marketplaceRevenueEvents",
        partners: "partnerCommissions"
      }
    };
  }

  opportunities(actor: BusinessActor) {
    return store.crmOpportunities.filter((item) => item.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createOpportunity(actor: BusinessActor, input: z.infer<typeof opportunitySchema>) {
    const parsed = opportunitySchema.parse(input);
    const now = new Date().toISOString();
    const opportunity: StoredCrmOpportunity = {
      id: createId("opp"),
      opportunityId: createId("crm_opportunity"),
      organizationId: actor.organizationId,
      ...parsed,
      probability: parsed.probability ?? probabilityFor(parsed.stage),
      status: parsed.stage === "WON" || parsed.stage === "CUSTOMER" ? "won" : parsed.stage === "LOST" ? "lost" : "open",
      activityHistory: [{ at: now, actorId: actor.userId, action: "CREATED", stage: parsed.stage }],
      createdAt: now,
      updatedAt: now
    };
    store.crmOpportunities.push(opportunity);
    this.audit(actor, "CRM_OPPORTUNITY_CREATED", "CrmOpportunity", opportunity.opportunityId);
    return opportunity;
  }

  updateOpportunity(actor: BusinessActor, opportunityId: string, input: z.infer<typeof opportunityPatchSchema>) {
    const opportunity = store.crmOpportunities.find((item) => item.organizationId === actor.organizationId && item.opportunityId === opportunityId);
    if (!opportunity) throw new Error("Opportunity not found.");
    const parsed = opportunityPatchSchema.parse(input);
    Object.assign(opportunity, parsed, {
      probability: parsed.probability ?? (parsed.stage ? probabilityFor(parsed.stage) : opportunity.probability),
      status: parsed.stage === "WON" || parsed.stage === "CUSTOMER" ? "won" : parsed.stage === "LOST" ? "lost" : opportunity.status,
      updatedAt: new Date().toISOString()
    });
    opportunity.activityHistory.push({ at: opportunity.updatedAt, actorId: actor.userId, action: "UPDATED", fields: Object.keys(parsed) });
    this.audit(actor, "CRM_OPPORTUNITY_UPDATED", "CrmOpportunity", opportunity.opportunityId);
    return opportunity;
  }

  customerHealth(actor: BusinessActor) {
    const organizations = actor.role === "Super Admin" ? store.organizations : store.organizations.filter((item) => item.id === actor.organizationId);
    return organizations.map((organization) => this.calculateCustomerHealth(actor, organization.id));
  }

  assignSuccessManager(actor: BusinessActor, workspaceId: string, successManagerId: string) {
    const score = this.calculateCustomerHealth(actor, workspaceId);
    score.successManagerId = successManagerId;
    score.nextAction = "Success manager assigned; schedule the next customer review.";
    store.customerHealthScores.push(score);
    this.audit(actor, "SUCCESS_MANAGER_ASSIGNED", "CustomerHealthScore", score.scoreId);
    return score;
  }

  createFollowUp(actor: BusinessActor, workspaceId: string, input: z.infer<typeof healthActionSchema>) {
    const now = new Date().toISOString();
    const task = {
      id: createId("crm_task"),
      taskId: createId("customer_followup"),
      organizationId: actor.organizationId,
      targetType: "customer" as const,
      targetId: workspaceId,
      title: input.title || "Customer success follow-up",
      dueDate: input.dueDate || inDays(3),
      ownerId: input.successManagerId || actor.userId,
      status: "open" as const,
      priority: "HIGH" as const,
      createdAt: now,
      updatedAt: now
    };
    store.crmTasks.push(task);
    this.audit(actor, "CUSTOMER_FOLLOWUP_CREATED", "CrmTask", task.taskId);
    return task;
  }

  subscriptionOperations(actor: BusinessActor) {
    this.refreshSubscriptionOperations(actor);
    return store.subscriptionOperations.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  performSubscriptionAction(actor: BusinessActor, input: z.infer<typeof subscriptionActionSchema>) {
    const parsed = subscriptionActionSchema.parse(input);
    const now = new Date().toISOString();
    const operation: StoredSubscriptionOperation = {
      id: createId("subop"),
      operationId: createId("subscription_operation"),
      organizationId: actor.organizationId,
      subscriptionId: parsed.subscriptionId,
      operationType: parsed.operationType,
      status: "completed",
      ownerId: actor.userId,
      dueDate: parsed.dueDate || now,
      evidence: parsed.evidence,
      nextAction: "Action completed and recorded in subscription operations.",
      createdAt: now,
      updatedAt: now
    };
    store.subscriptionOperations.push(operation);
    this.audit(actor, "SUBSCRIPTION_OPERATION_COMPLETED", "SubscriptionOperation", operation.operationId);
    return operation;
  }

  addProviderCost(actor: BusinessActor, input: z.infer<typeof providerCostSchema>) {
    const parsed = providerCostSchema.parse(input);
    const event = { id: createId("pce"), eventId: createId("provider_cost"), organizationId: actor.organizationId, ...parsed, createdAt: new Date().toISOString() };
    store.providerCostEvents.push(event);
    this.audit(actor, "PROVIDER_COST_RECORDED", "ProviderCostEvent", event.eventId);
    return event;
  }

  aiCosts(actor: BusinessActor) {
    const events = store.providerCostEvents.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    return {
      summary: {
        requests: events.reduce((sum, item) => sum + item.requests, 0),
        tokens: events.reduce((sum, item) => sum + item.inputTokens + item.outputTokens, 0),
        errors: events.reduce((sum, item) => sum + item.errors, 0),
        estimatedCost: events.reduce((sum, item) => sum + item.estimatedCost, 0),
        creditsConsumed: events.reduce((sum, item) => sum + item.creditsConsumed, 0)
      },
      byProvider: groupSum(events, "provider", ["requests", "estimatedCost", "creditsConsumed", "errors"])
    };
  }

  addInfrastructureCost(actor: BusinessActor, input: z.infer<typeof infrastructureCostSchema>) {
    const parsed = infrastructureCostSchema.parse(input);
    const event = { id: createId("ice"), eventId: createId("infrastructure_cost"), organizationId: actor.organizationId, ...parsed, createdAt: new Date().toISOString() };
    store.infrastructureCostEvents.push(event);
    this.audit(actor, "INFRASTRUCTURE_COST_RECORDED", "InfrastructureCostEvent", event.eventId);
    return event;
  }

  infrastructureCosts(actor: BusinessActor) {
    const events = store.infrastructureCostEvents.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    const deployments = store.agentDeployments.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").length || 1;
    const projects = store.factoryProjects.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").length || 1;
    const workspaces = store.workspaces.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").length || 1;
    const totalCost = events.reduce((sum, item) => sum + item.amount, 0);
    const revenue = store.revenues.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin").reduce((sum, item) => sum + item.amount, 0);
    return {
      summary: {
        totalCost,
        costPerWorkspace: Number((totalCost / workspaces).toFixed(2)),
        costPerProject: Number((totalCost / projects).toFixed(2)),
        costPerDeployment: Number((totalCost / deployments).toFixed(2)),
        grossMarginEstimate: revenue ? Number((((revenue - totalCost) / revenue) * 100).toFixed(2)) : 0
      },
      byCategory: groupSum(events, "category", ["amount"])
    };
  }

  automationQueue(actor: BusinessActor) {
    this.refreshSubscriptionOperations(actor);
    const supportDue = store.supportTickets.filter((ticket) => ticket.organizationId === actor.organizationId && ticket.status !== "CLOSED").map((ticket) => ({
      type: "support_sla_reminder",
      targetId: ticket.id,
      nextAction: "Notify support owner before SLA breach."
    }));
    return {
      trialReminders: store.subscriptionOperations.filter((item) => item.organizationId === actor.organizationId && item.operationType === "trial_ending"),
      renewalReminders: store.subscriptionOperations.filter((item) => item.organizationId === actor.organizationId && item.operationType === "renewal_due"),
      lowCreditReminders: store.subscriptionOperations.filter((item) => item.organizationId === actor.organizationId && item.operationType === "credits_low"),
      failedPaymentReminders: store.subscriptionOperations.filter((item) => item.organizationId === actor.organizationId && item.operationType === "failed_payment"),
      supportSlaReminders: supportDue,
      marketplaceReviewReminders: store.marketplaceReviews.filter((item) => item.organizationId === actor.organizationId && item.status === "pending"),
      deploymentAlerts: store.agentDeployments.filter((item) => item.organizationId === actor.organizationId && ["failed", "rollback_required"].includes(item.status))
    };
  }

  createBusinessReport(actor: BusinessActor, input: z.infer<typeof businessReportSchema>) {
    const parsed = businessReportSchema.parse(input);
    const data = this.reportData(actor, parsed.reportType);
    const content = parsed.format === "CSV" || parsed.format === "EXCEL" ? toCsv(data) : `<html><body><h1>${parsed.reportType} report</h1><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></body></html>`;
    const report: StoredBusinessReport = {
      id: createId("brep"),
      reportId: createId("business_report"),
      organizationId: actor.organizationId,
      reportType: parsed.reportType,
      format: parsed.format,
      status: "READY",
      fileName: `${parsed.reportType}-${actor.organizationId}.${parsed.format === "PDF" ? "html" : "csv"}`,
      mimeType: parsed.format === "PDF" ? "text/html" : "text/csv",
      content,
      generatedBy: actor.userId,
      createdAt: new Date().toISOString()
    };
    store.businessReports.push(report);
    this.audit(actor, "BUSINESS_REPORT_GENERATED", "BusinessReport", report.reportId);
    return report;
  }

  reports(actor: BusinessActor) {
    return store.businessReports.filter((item) => item.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private calculateCustomerHealth(actor: BusinessActor, organizationId: string): StoredCustomerHealthScore {
    const onboarding = store.onboardingProgress.find((item) => item.organizationId === organizationId);
    const projects = store.factoryProjects.filter((item) => item.organizationId === organizationId).length;
    const usage = store.customerUsageEvents.filter((item) => item.organizationId === organizationId);
    const subscription = store.customerSubscriptions.find((item) => item.organizationId === organizationId);
    const tickets = store.supportTickets.filter((item) => item.organizationId === organizationId);
    const onboardingCompletion = onboarding?.status === "completed" ? 100 : onboarding ? 60 : 0;
    const usageScore = Math.min(100, projects * 25 + usage.length * 5);
    const billingScore = subscription?.status === "active" ? 100 : subscription ? 55 : 20;
    const supportScore = tickets.length ? Math.max(0, 100 - tickets.filter((item) => item.status !== "CLOSED").length * 20) : 100;
    const riskScore = Math.max(0, 100 - Math.round((onboardingCompletion + usageScore + billingScore + supportScore) / 4));
    const healthScore = 100 - riskScore;
    return {
      id: createId("chs"),
      scoreId: createId("customer_health"),
      organizationId,
      workspaceId: store.workspaces.find((item) => item.organizationId === organizationId)?.id,
      healthScore,
      onboardingCompletion,
      usageScore,
      billingScore,
      supportScore,
      riskScore,
      expansionOpportunity: usageScore > 70 && billingScore > 70 ? "high" as const : usageScore > 35 ? "medium" as const : "low" as const,
      renewalProbability: Math.max(5, Math.min(95, healthScore - tickets.filter((item) => item.status !== "CLOSED").length * 5)),
      successManagerId: undefined,
      nextAction: healthScore < 60 ? "Create a customer success follow-up." : "Monitor usage and expansion opportunities.",
      calculatedFrom: { onboardingStatus: onboarding?.status || "not_started", projects, usageEvents: usage.length, subscriptionStatus: subscription?.status || "none", tickets: tickets.length },
      createdAt: new Date().toISOString()
    };
  }

  private refreshSubscriptionOperations(actor: BusinessActor) {
    const now = new Date().toISOString();
    const subscriptions = store.customerSubscriptions.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    for (const subscription of subscriptions) {
      const checks: Array<[StoredSubscriptionOperation["operationType"], boolean, string]> = [
        ["failed_payment", subscription.status === "past_due", "Retry payment or contact billing owner."],
        ["expired_plan", subscription.status === "expired", "Suspend or reactivate workspace after review."],
        ["trial_ending", subscription.status === "trialing", "Send trial ending reminder."],
        ["renewal_due", Boolean(subscription.currentPeriodEnd), "Send renewal reminder before current period end."]
      ];
      for (const [operationType, enabled, nextAction] of checks) {
        if (!enabled) continue;
        const exists = store.subscriptionOperations.some((item) => item.organizationId === subscription.organizationId && item.subscriptionId === subscription.subscriptionId && item.operationType === operationType && item.status === "open");
        if (exists) continue;
        store.subscriptionOperations.push({
          id: createId("subop"),
          operationId: createId("subscription_operation"),
          organizationId: subscription.organizationId,
          subscriptionId: subscription.subscriptionId,
          operationType,
          status: "open",
          ownerId: actor.userId,
          dueDate: subscription.currentPeriodEnd || inDays(3),
          evidence: { subscriptionId: subscription.subscriptionId, status: subscription.status, retryCount: subscription.retryCount || 0 },
          nextAction,
          createdAt: now,
          updatedAt: now
        });
      }
    }
    const wallets = store.customerCreditWallets.filter((item) => item.organizationId === actor.organizationId || actor.role === "Super Admin");
    for (const wallet of wallets.filter((item) => item.balance < 500)) {
      const exists = store.subscriptionOperations.some((item) => item.organizationId === wallet.organizationId && item.operationType === "credits_low" && item.status === "open");
      if (!exists) store.subscriptionOperations.push({ id: createId("subop"), operationId: createId("subscription_operation"), organizationId: wallet.organizationId, operationType: "credits_low", status: "open", ownerId: actor.userId, dueDate: inDays(1), evidence: { balance: wallet.balance }, nextAction: "Send low credit reminder or recommend top-up.", createdAt: now, updatedAt: now });
    }
  }

  private reportData(actor: BusinessActor, reportType: StoredBusinessReport["reportType"]) {
    if (reportType === "executive") return this.executiveDashboard(actor);
    if (reportType === "finance") return { revenue: store.revenues.filter((item) => item.organizationId === actor.organizationId), expenses: store.expenses.filter((item) => item.organizationId === actor.organizationId) };
    if (reportType === "billing") return { subscriptions: store.customerSubscriptions.filter((item) => item.organizationId === actor.organizationId), payments: store.customerPayments.filter((item) => item.organizationId === actor.organizationId) };
    if (reportType === "support") return { tickets: store.supportTickets.filter((item) => item.organizationId === actor.organizationId) };
    if (reportType === "marketplace") return { revenue: store.marketplaceRevenueEvents.filter((item) => item.organizationId === actor.organizationId), installs: store.marketplaceInstalls.filter((item) => item.organizationId === actor.organizationId) };
    if (reportType === "security") return { events: store.securityEvents.filter((item) => item.organizationId === actor.organizationId) };
    if (reportType === "deployment") return { deployments: store.agentDeployments.filter((item) => item.organizationId === actor.organizationId) };
    if (reportType === "ai_usage") return this.aiCosts(actor);
    return { logs: store.apiUsageLogs.filter((item) => item.organizationId === actor.organizationId) };
  }

  private audit(actor: BusinessActor, event: string, entityType: string, entityId?: string) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "FINANCE_ACTION", entityType, entityId, metadata: { event } });
  }
}

export const businessOperationsService = new BusinessOperationsService();

function probabilityFor(stage: StoredCrmOpportunity["stage"]) {
  return { NEW_LEAD: 10, QUALIFIED: 30, DEMO_SCHEDULED: 45, PROPOSAL_SENT: 65, NEGOTIATION: 80, WON: 100, CUSTOMER: 100, LOST: 0 }[stage];
}

function planMonthlyAmount(planId: string) {
  const plan = store.billingPlans.find((item) => item.planId === planId || item.name.toLowerCase() === planId.toLowerCase());
  return plan?.monthlyPrice || 0;
}

function percent(value: number, total: number) {
  return total ? Number(((value / total) * 100).toFixed(2)) : 0;
}

function groupSum<T extends Record<string, any>>(items: T[], key: keyof T, fields: string[]) {
  const groups = new Map<string, Record<string, number | string>>();
  for (const item of items) {
    const groupKey = String(item[key]);
    const group = groups.get(groupKey) || { [String(key)]: groupKey };
    for (const field of fields) group[field] = Number(group[field] || 0) + Number(item[field] || 0);
    groups.set(groupKey, group);
  }
  return [...groups.values()];
}

function toCsv(data: unknown) {
  const rows = flatten(data);
  return ["Metric,Value", ...Object.entries(rows).map(([key, value]) => `"${key.replace(/"/g, '""')}","${String(value).replace(/"/g, '""')}"`)].join("\n");
}

function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) flatten(child, prefix ? `${prefix}.${key}` : key, out);
  } else if (Array.isArray(value)) {
    out[prefix || "items"] = value.length;
  } else {
    out[prefix || "value"] = value;
  }
  return out;
}

function inDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}
