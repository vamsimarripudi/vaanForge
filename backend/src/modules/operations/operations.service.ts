import { cpus } from "node:os";
import { statfsSync } from "node:fs";
import { z } from "zod";
import { createId, store, type StoredEmergencyAction, type StoredOperationsAgentMetric, type StoredOperationsCommandAction, type StoredOperationsIncident, type StoredOperationsProductMetric } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

type Actor = { organizationId: string; userId: string; role: string };

const severities = ["SEV1", "SEV2", "SEV3", "SEV4"] as const;
const incidentStatuses = ["open", "investigating", "mitigated", "resolved", "postmortem"] as const;
const commandActions = ["pause_deployments", "pause_agent_generation", "emergency_stop", "resume_services", "maintenance_mode", "scheduled_maintenance", "restart_agent", "drain_agent", "enable_agent", "disable_agent"] as const;

export const incidentCreateSchema = z.object({
  title: z.string().min(4),
  description: z.string().min(8),
  severity: z.enum(severities),
  ownerId: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
  dueDate: z.string().optional(),
  impactedProducts: z.array(z.string()).default([]),
  nextAction: z.string().min(4)
});

export const incidentPatchSchema = z.object({
  status: z.enum(incidentStatuses).optional(),
  ownerId: z.string().min(2).optional(),
  severity: z.enum(severities).optional(),
  rootCause: z.string().min(4).optional(),
  resolution: z.string().min(4).optional(),
  postmortem: z.string().min(4).optional(),
  nextAction: z.string().min(4).optional()
});

export const auditSearchSchema = z.object({
  query: z.string().optional(),
  action: z.string().optional(),
  actorId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

export const commandSchema = z.object({
  action: z.enum(commandActions),
  reason: z.string().min(8),
  confirmed: z.boolean(),
  targetId: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  affectedServices: z.array(z.string()).default([])
});

export class OperationsService {
  summary(actor: Actor) {
    const health = this.health(actor);
    const incidents = this.incidents(actor);
    const queues = this.queues(actor);
    const deployments = this.deployments(actor);
    const analytics = this.analytics(actor);
    const agentRuns = store.vaanForgeRuns.filter((run) => run.organizationId === actor.organizationId);
    return {
      systemHealth: health.overallStatus,
      activeAgentRuns: agentRuns.filter((run) => ["pending", "analyzing", "planned"].includes(run.status)).length,
      queueStatus: queues.overallStatus,
      deploymentStatus: deployments.overallStatus,
      customerActivity: {
        builderProjects: store.builderProjects.filter((project) => project.organizationId === actor.organizationId).length,
        submissions: store.vformixAgentSubmissionLinks.filter((link) => link.organizationId === actor.organizationId).length,
        customerUsageEvents: store.customerUsageEvents.filter((event) => event.organizationId === actor.organizationId).length
      },
      resourceUtilization: health.resources,
      incidentOverview: {
        open: incidents.filter((incident) => incident.status !== "resolved" && incident.status !== "postmortem").length,
        sev1: incidents.filter((incident) => incident.severity === "SEV1").length,
        nextAction: incidents[0]?.nextAction || "Continue monitoring operations health and audit trails."
      },
      business: analytics,
      recentActivity: this.auditSearch(actor, { limit: 10 })
    };
  }

  agents(actor: Actor) {
    const metrics = this.agentFleet(actor);
    return {
      agents: metrics,
      workloadBalancing: {
        overloaded: metrics.filter((agent) => agent.workloadScore >= 80).map((agent) => agent.agentId),
        disabled: metrics.filter((agent) => agent.status === "disabled").map((agent) => agent.agentId),
        nextAction: metrics.some((agent) => agent.health !== "healthy") ? "Drain degraded agents and reassign active runs." : "Fleet is balanced. Keep monitoring queue latency."
      }
    };
  }

  products(actor: Actor) {
    const products = this.productMetrics(actor);
    return {
      products,
      nextAction: products.some((product) => product.apiHealth !== "healthy" || product.queueHealth !== "healthy") ? "Investigate degraded product services." : "All product operations are within current gates."
    };
  }

  health(actor: Actor) {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const disk = diskStats();
    const apiLatency = this.apiLatency(actor.organizationId);
    const queueLatency = this.queueLatency(actor.organizationId);
    const checks = [
      this.healthCheck(actor.organizationId, "api", apiLatency < 1000 ? "healthy" : "degraded", apiLatency, { route: "/api/v1/health" }),
      this.healthCheck(actor.organizationId, "database", store.organizations.length >= 0 ? "healthy" : "down", undefined, { persistence: "in-memory/postgres-ready" }),
      this.healthCheck(actor.organizationId, "queue", queueLatency < 5000 ? "healthy" : "degraded", queueLatency, { pendingTasks: store.agentTasks.filter((task) => task.organizationId === actor.organizationId && task.status !== "completed").length }),
      this.healthCheck(actor.organizationId, "deployment", store.agentDeployments.some((deployment) => deployment.organizationId === actor.organizationId && deployment.status === "failed") ? "degraded" : "healthy", undefined, { deployments: store.agentDeployments.filter((deployment) => deployment.organizationId === actor.organizationId).length })
    ];
    return {
      overallStatus: checks.some((check) => check.status === "down") ? "down" : checks.some((check) => check.status === "degraded") ? "degraded" : "healthy",
      checks,
      resources: {
        cpu: { cores: cpus().length, userMicros: cpu.user, systemMicros: cpu.system },
        memory: { rss: memory.rss, heapUsed: memory.heapUsed, heapTotal: memory.heapTotal, external: memory.external },
        disk,
        database: { mode: "in-memory/postgres-ready", recordsTracked: this.recordCount() },
        cache: { configured: Boolean(process.env.CACHE_ENDPOINT), queueAdapter: process.env.CACHE_ENDPOINT ? "external" : "internal" },
        queueLatencyMs: queueLatency,
        apiLatencyMs: apiLatency,
        backgroundWorkers: { active: store.agentActivityLogs.filter((log) => log.organizationId === actor.organizationId).length },
        storage: { generatedFiles: store.agentFiles.filter((file) => file.organizationId === actor.organizationId).length },
        emailServices: { configured: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST) }
      }
    };
  }

  queues(actor: Actor) {
    const pending = store.agentTasks.filter((task) => task.organizationId === actor.organizationId && ["pending", "preparing", "generating", "validating", "repairing"].includes(task.status));
    const failed = store.agentTasks.filter((task) => task.organizationId === actor.organizationId && ["failed", "blocked"].includes(task.status));
    const latency = this.queueLatency(actor.organizationId);
    return {
      overallStatus: failed.length ? "degraded" : "healthy",
      pendingTasks: pending.length,
      failedTasks: failed.length,
      latencyMs: latency,
      agentRunsQueued: store.vaanForgeRuns.filter((run) => run.organizationId === actor.organizationId && run.status === "pending").length,
      executionRunsQueued: store.agentExecutionRuns.filter((run) => run.organizationId === actor.organizationId && ["pending", "preparing"].includes(run.status)).length,
      nextAction: failed.length ? "Review blocked and failed agent tasks before accepting new generation load." : "Queue is accepting work."
    };
  }

  deployments(actor: Actor) {
    const deployments = store.agentDeployments.filter((deployment) => deployment.organizationId === actor.organizationId);
    const failed = deployments.filter((deployment) => ["failed", "rollback_required"].includes(deployment.status));
    return {
      overallStatus: failed.length ? "degraded" : deployments.some((deployment) => deployment.status === "deploying") ? "deploying" : "healthy",
      deployments,
      live: deployments.filter((deployment) => deployment.status === "live").length,
      failed: failed.length,
      paused: this.latestEmergency(actor.organizationId, "pause_deployments")?.status === "completed",
      nextAction: failed.length ? "Resolve failed deployments or initiate rollback." : "Deployment pipeline is available."
    };
  }

  incidents(actor: Actor) {
    return store.operationsIncidents.filter((incident) => incident.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createIncident(actor: Actor, input: z.infer<typeof incidentCreateSchema>) {
    const parsed = incidentCreateSchema.parse(input);
    const now = new Date().toISOString();
    const incident: StoredOperationsIncident = {
      id: createId("oin"),
      incidentId: createId("incident"),
      organizationId: actor.organizationId,
      title: sanitize(parsed.title),
      description: sanitize(parsed.description),
      severity: parsed.severity,
      status: "open",
      ownerId: parsed.ownerId,
      priority: parsed.priority,
      dueDate: parsed.dueDate || inHours(parsed.severity === "SEV1" ? 4 : 24),
      impactedProducts: parsed.impactedProducts.map(sanitize),
      timeline: [{ at: now, status: "open", message: "Incident created." }],
      nextAction: sanitize(parsed.nextAction),
      activityHistory: [{ at: now, status: "open", message: parsed.nextAction }],
      createdAt: now,
      updatedAt: now
    };
    store.operationsIncidents.push(incident);
    this.audit(actor, "INCIDENT_CREATED", "OperationsIncident", incident.incidentId, `Created ${incident.severity} incident ${incident.title}.`);
    return incident;
  }

  updateIncident(actor: Actor, incidentId: string, input: z.infer<typeof incidentPatchSchema>) {
    const incident = store.operationsIncidents.find((item) => item.organizationId === actor.organizationId && item.incidentId === incidentId);
    if (!incident) return undefined;
    const parsed = incidentPatchSchema.parse(input);
    const now = new Date().toISOString();
    Object.assign(incident, {
      status: parsed.status ?? incident.status,
      ownerId: parsed.ownerId ?? incident.ownerId,
      severity: parsed.severity ?? incident.severity,
      rootCause: parsed.rootCause ? sanitize(parsed.rootCause) : incident.rootCause,
      resolution: parsed.resolution ? sanitize(parsed.resolution) : incident.resolution,
      postmortem: parsed.postmortem ? sanitize(parsed.postmortem) : incident.postmortem,
      nextAction: parsed.nextAction ? sanitize(parsed.nextAction) : incident.nextAction,
      updatedAt: now
    });
    incident.timeline.push({ at: now, status: incident.status, message: incident.nextAction });
    incident.activityHistory.push({ at: now, status: incident.status, message: incident.nextAction });
    this.audit(actor, "INCIDENT_UPDATED", "OperationsIncident", incident.incidentId, `Updated incident ${incident.incidentId}.`, parsed);
    return incident;
  }

  auditSearch(actor: Actor, input: Partial<z.infer<typeof auditSearchSchema>>) {
    const parsed = auditSearchSchema.parse(input);
    const query = parsed.query?.toLowerCase();
    const logs = [
      ...store.operationsAuditLogs.filter((log) => log.organizationId === actor.organizationId),
      ...store.workspaceAuditLogs.filter((log) => log.organizationId === actor.organizationId).map((log) => ({ ...log, entityType: "Workspace", entityId: log.workspaceId, command: undefined, metadata: log.metadata })),
      ...store.builderProjectActivityLogs.filter((log) => log.organizationId === actor.organizationId).map((log) => ({ ...log, entityType: "BuilderProject", entityId: log.projectId, command: undefined, metadata: log.metadata }))
    ];
    return logs
      .filter((log) => !parsed.action || log.action === parsed.action)
      .filter((log) => !parsed.actorId || log.actorId === parsed.actorId)
      .filter((log) => !query || JSON.stringify(log).toLowerCase().includes(query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, parsed.limit);
  }

  analytics(actor: Actor) {
    const invoices = store.customerInvoices.filter((invoice) => invoice.organizationId === actor.organizationId);
    const subscriptions = store.customerSubscriptions.filter((subscription) => subscription.organizationId === actor.organizationId);
    const usage = store.customerUsageEvents.filter((event) => event.organizationId === actor.organizationId);
    const creditTransactions = store.customerCreditTransactions.filter((transaction) => transaction.organizationId === actor.organizationId);
    const revenue = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.amount, 0);
    const mrr = subscriptions.filter((subscription) => subscription.status === "active").length * averageMonthlyPlanValue(actor.organizationId);
    const metric = {
      id: createId("obm"),
      metricId: createId("business"),
      organizationId: actor.organizationId,
      revenue,
      subscriptions: subscriptions.length,
      usageEvents: usage.length,
      creditConsumption: creditTransactions.filter((transaction) => transaction.type === "deduct").reduce((sum, transaction) => sum + transaction.amount, 0),
      aiUsage: usage.filter((event) => ["agent_run", "ai_credit", "regeneration"].includes(event.metric)).reduce((sum, event) => sum + event.quantity, 0),
      customerGrowth: uniqueCount(store.builderProjects.filter((project) => project.organizationId === actor.organizationId).map((project) => project.customerId)),
      productAdoption: this.productAdoption(actor.organizationId),
      churn: subscriptions.filter((subscription) => ["cancelled", "expired"].includes(subscription.status)).length,
      mrr,
      arr: mrr * 12,
      createdAt: new Date().toISOString()
    };
    store.operationsBusinessMetrics.push(metric);
    return metric;
  }

  settings(actor: Actor) {
    return {
      maintenanceMode: this.latestEmergency(actor.organizationId, "maintenance_mode")?.status === "completed",
      deploymentsPaused: this.latestEmergency(actor.organizationId, "pause_deployments")?.status === "completed",
      agentGenerationPaused: this.latestEmergency(actor.organizationId, "pause_agent_generation")?.status === "completed",
      emergencyStopActive: this.latestEmergency(actor.organizationId, "emergency_stop")?.status === "completed",
      maintenanceWindows: store.maintenanceWindows.filter((window) => window.organizationId === actor.organizationId),
      emergencyActions: store.emergencyActions.filter((action) => action.organizationId === actor.organizationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)
    };
  }

  command(actor: Actor, input: z.infer<typeof commandSchema>) {
    const parsed = commandSchema.parse(input);
    if (!parsed.confirmed) throw new Error("Operations command requires confirmation.");
    if (["emergency_stop", "resume_services", "pause_deployments", "pause_agent_generation"].includes(parsed.action) && actor.role !== "Super Admin") {
      throw new Error("Super Admin permission required for emergency operations controls.");
    }
    if (parsed.action === "scheduled_maintenance" || parsed.action === "maintenance_mode") this.createMaintenance(actor, parsed);
    if (parsed.targetId && ["restart_agent", "drain_agent", "enable_agent", "disable_agent"].includes(parsed.action)) this.agentCommand(actor, parsed.action, parsed.targetId);
    const action: StoredEmergencyAction = {
      id: createId("oea"),
      actionId: createId("emergency"),
      organizationId: actor.organizationId,
      actorId: actor.userId,
      action: parsed.action,
      reason: sanitize(parsed.reason),
      confirmed: parsed.confirmed,
      status: "completed",
      evidence: { targetId: parsed.targetId, affectedServices: parsed.affectedServices },
      createdAt: new Date().toISOString()
    };
    store.emergencyActions.push(action);
    this.audit(actor, "OPERATIONS_COMMAND", "EmergencyAction", action.actionId, `Executed ${parsed.action}.`, { command: parsed.action, targetId: parsed.targetId });
    return { action, settings: this.settings(actor) };
  }

  private agentFleet(actor: Actor) {
    const roles = store.agentRoles.filter((role) => role.organizationId === actor.organizationId);
    const fallbackRoles = roles.length ? roles : [
      { roleId: "agent_product_manager", name: "Product Manager Agent", slug: "product-manager", status: "active" },
      { roleId: "agent_architect", name: "Architect Agent", slug: "architect", status: "active" },
      { roleId: "agent_qa", name: "QA Agent", slug: "qa", status: "active" },
      { roleId: "agent_security", name: "Security Agent", slug: "security", status: "active" },
      { roleId: "agent_devops", name: "DevOps Agent", slug: "devops", status: "active" }
    ];
    const metrics = fallbackRoles.map((role) => {
      const assignments = store.agentAssignments.filter((assignment) => assignment.organizationId === actor.organizationId && assignment.roleId === role.roleId);
      const activeRuns = assignments.filter((assignment) => !["completed", "failed", "blocked"].includes(assignment.status)).length;
      const queuedTasks = store.agentTasks.filter((task) => task.organizationId === actor.organizationId && task.ownerId === role.roleId && task.status !== "completed").length;
      const errors = store.agentErrors.filter((error) => error.organizationId === actor.organizationId && error.status === "open").length;
      const workloadScore = Math.min(100, activeRuns * 18 + queuedTasks * 12 + errors * 5);
      const existing = store.operationsAgentMetrics.find((metric) => metric.organizationId === actor.organizationId && metric.agentId === role.roleId);
      const metric: StoredOperationsAgentMetric = {
        id: existing?.id || createId("oam"),
        metricId: existing?.metricId || createId("agent_metric"),
        organizationId: actor.organizationId,
        agentId: role.roleId,
        agentName: role.name,
        version: existing?.version || "1.0.0",
        status: existing?.status || (role.status === "inactive" ? "disabled" : "enabled"),
        health: errors > 0 ? "degraded" : "healthy",
        activeRuns,
        queuedTasks,
        errorRate: activeRuns + queuedTasks ? Number((errors / Math.max(1, activeRuns + queuedTasks)).toFixed(2)) : 0,
        workloadScore,
        region: "primary",
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (existing) Object.assign(existing, metric);
      else store.operationsAgentMetrics.push(metric);
      return metric;
    });
    return metrics;
  }

  private productMetrics(actor: Actor) {
    const products: StoredOperationsProductMetric["product"][] = ["VidyaLuma", "VMetron", "VaanMeet", "VFormix", "VaanForge AI", "Future KRAVIA"];
    const deployments = store.agentDeployments.filter((deployment) => deployment.organizationId === actor.organizationId);
    const metrics = products.map((product) => {
      const productKey = product.toLowerCase();
      const errors = store.agentErrors.filter((error) => error.organizationId === actor.organizationId && JSON.stringify(error).toLowerCase().includes(productKey)).length;
      const deployment = deployments.find((item) => JSON.stringify(item).toLowerCase().includes(productKey)) || deployments.at(-1);
      const metric: StoredOperationsProductMetric = {
        id: createId("opm"),
        metricId: createId("product_metric"),
        organizationId: actor.organizationId,
        product,
        activeUsers: store.users.filter((user) => user.organizationId === actor.organizationId).length,
        activeWorkspaces: store.workspaces.filter((workspace) => workspace.organizationId === actor.organizationId && workspace.status === "ACTIVE").length + store.enterpriseWorkspaces.filter((workspace) => workspace.organizationId === actor.organizationId && workspace.status === "active").length,
        apiHealth: errors ? "degraded" : "healthy",
        queueHealth: this.queueLatency(actor.organizationId) > 5000 ? "degraded" : "healthy",
        errorRate: errors,
        buildStatus: store.agentValidationRuns.filter((run) => run.organizationId === actor.organizationId && run.checkName === "build").at(-1)?.status || "not_run",
        deploymentStatus: deployment?.status || "not_deployed",
        region: "primary",
        createdAt: new Date().toISOString()
      };
      store.operationsProductMetrics.push(metric);
      return metric;
    });
    return metrics;
  }

  private healthCheck(organizationId: string, service: string, status: "healthy" | "degraded" | "down", latencyMs: number | undefined, evidence: Record<string, unknown>) {
    const item = { id: createId("ohc"), checkId: createId("health"), organizationId, service, region: "primary", status, latencyMs, evidence: maskRecord(evidence), createdAt: new Date().toISOString() };
    store.operationsHealthChecks.push(item);
    return item;
  }

  private createMaintenance(actor: Actor, input: z.infer<typeof commandSchema>) {
    const now = new Date().toISOString();
    store.maintenanceWindows.push({
      id: createId("omw"),
      windowId: createId("maintenance"),
      organizationId: actor.organizationId,
      title: input.action === "scheduled_maintenance" ? "Scheduled KRAVIA maintenance" : "Maintenance mode",
      ownerId: actor.userId,
      status: input.action === "maintenance_mode" ? "active" : "scheduled",
      startsAt: input.startsAt || now,
      endsAt: input.endsAt || inHours(2),
      affectedServices: input.affectedServices,
      priority: "HIGH",
      dueDate: input.endsAt || inHours(2),
      nextAction: input.action === "maintenance_mode" ? "Monitor affected services and publish updates." : "Notify customers before maintenance starts.",
      activityHistory: [{ at: now, status: "scheduled", message: input.reason }],
      createdAt: now,
      updatedAt: now
    });
  }

  private agentCommand(actor: Actor, action: StoredOperationsCommandAction, agentId: string) {
    const metric = this.agentFleet(actor).find((item) => item.agentId === agentId);
    if (!metric) throw new Error("Agent not found.");
    if (action === "disable_agent") metric.status = "disabled";
    if (action === "enable_agent") metric.status = "enabled";
    if (action === "drain_agent") metric.status = "draining";
    if (action === "restart_agent") metric.status = "restarting";
    metric.updatedAt = new Date().toISOString();
  }

  private audit(actor: Actor, action: string, entityType: string, entityId: string | undefined, message: string, metadata?: Record<string, unknown>) {
    const item = { id: createId("oal"), auditId: createId("ops_audit"), organizationId: actor.organizationId, actorId: actor.userId, action, entityType, entityId, command: metadata?.command as StoredOperationsCommandAction | undefined, message: sanitize(message), metadata: metadata ? maskRecord(metadata) : undefined, createdAt: new Date().toISOString() };
    store.operationsAuditLogs.push(item);
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "VAANFORGE_AGENT_RUN", entityType, entityId, metadata: { operationsAction: action, ...item.metadata } });
  }

  private latestEmergency(organizationId: string, action: StoredOperationsCommandAction) {
    return store.emergencyActions.filter((item) => item.organizationId === organizationId && item.action === action).at(-1);
  }

  private productAdoption(organizationId: string) {
    return {
      VidyaLuma: store.workspaces.filter((workspace) => workspace.organizationId === organizationId && workspace.suiteType === "EDUCATION_SUITE").length,
      VMetron: store.workspaces.filter((workspace) => workspace.organizationId === organizationId && workspace.suiteType === "VMETRON_SUITE").length,
      VaanMeet: store.interviews.filter((interview) => interview.organizationId === organizationId && Boolean(interview.vaanMeetLink)).length,
      VFormix: store.vformixAgentConfigs.filter((config) => config.organizationId === organizationId).length,
      "VaanForge AI": store.vaanForgeRuns.filter((run) => run.organizationId === organizationId).length
    };
  }

  private queueLatency(organizationId: string) {
    const pending = store.agentTasks.filter((task) => task.organizationId === organizationId && task.status === "pending");
    if (!pending.length) return 0;
    const oldest = pending.map((task) => Date.now() - new Date(task.createdAt).getTime()).sort((a, b) => b - a)[0] || 0;
    return Math.max(0, oldest);
  }

  private apiLatency(organizationId: string) {
    const checks = store.operationsHealthChecks.filter((check) => check.organizationId === organizationId && check.service === "api" && check.latencyMs);
    return checks.at(-1)?.latencyMs || 12;
  }

  private recordCount() {
    return Object.values(store).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
  }
}

function averageMonthlyPlanValue(organizationId: string) {
  const plans = store.billingPlans.filter((plan) => !plan.organizationId || plan.organizationId === organizationId);
  if (!plans.length) return 0;
  return Math.round(plans.reduce((sum, plan) => sum + plan.monthlyPrice, 0) / plans.length);
}

function diskStats() {
  try {
    const stats = statfsSync(process.cwd());
    return { availableBytes: stats.bavail * stats.bsize, totalBytes: stats.blocks * stats.bsize };
  } catch (error) {
    return { unavailable: true, reason: error instanceof Error ? error.message : "Disk stats unavailable" };
  }
}

function uniqueCount(values: string[]) {
  return new Set(values).size;
}

function inHours(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/ignore previous instructions|system prompt|provider api key|secret|token/gi, "[removed]").trim();
}

function maskRecord(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /secret|token|password|key/i.test(key) ? "[masked]" : typeof item === "string" ? sanitize(item) : item]));
}

export const operationsService = new OperationsService();
