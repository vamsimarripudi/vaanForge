import { z } from "zod";
import { createId, store, type StoredAgentAssignment, type StoredAgentRole, type StoredAgentTeamStatus } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { agentAdminService } from "./agent-admin.service";

const requiredFinalReviewSlugs = ["product-manager", "architect", "qa", "security", "devops"];

export const roleSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  responsibilities: z.array(z.string().min(4)).min(1),
  requiredReview: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("active"),
  config: z
    .object({
      modelProvider: z.string().default("abstract"),
      systemPrompt: z.string().min(10),
      tools: z.array(z.string()).default([]),
      guardrails: z.array(z.string()).default([])
    })
    .optional()
});

export const assignSchema = z.object({
  roleIds: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional()
});

export const handoffSchema = z.object({
  fromRoleId: z.string().min(2),
  toRoleId: z.string().min(2),
  summary: z.string().min(8),
  evidence: z.record(z.unknown()).default({}),
  nextAction: z.string().min(4)
});

export const commentSchema = z.object({
  roleId: z.string().min(2),
  message: z.string().min(2).max(2000),
  visibility: z.enum(["team", "admin"]).default("team")
});

export const conflictSchema = z.object({
  raisedByRoleId: z.string().min(2),
  againstRoleId: z.string().optional(),
  reason: z.string().min(6),
  resolution: z.string().optional(),
  nextAction: z.string().min(4)
});

export const reviewSchema = z.object({
  roleId: z.string().min(2),
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  findings: z.array(z.string()).default([]),
  nextAction: z.string().min(4)
});

export const finalReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  summary: z.string().min(6)
});

export class AgentTeamService {
  async team(organizationId: string) {
    this.ensureRoles(organizationId);
    return { roles: await this.roles(organizationId), activeAssignments: store.agentAssignments.filter((item) => item.organizationId === organizationId && !["completed", "failed"].includes(item.status)) };
  }

  async roles(organizationId: string) {
    this.ensureRoles(organizationId);
    return store.agentRoles.filter((role) => role.organizationId === organizationId).map((role) => ({ ...role, config: store.agentRoleConfigs.find((config) => config.roleId === role.roleId && config.organizationId === organizationId) }));
  }

  async createRole(organizationId: string, actorId: string, input: z.infer<typeof roleSchema>) {
    const parsed = roleSchema.parse(input);
    if (store.agentRoles.some((role) => role.organizationId === organizationId && role.slug === parsed.slug)) throw new Error("Agent role slug already exists.");
    const now = new Date().toISOString();
    const role: StoredAgentRole = { id: createId("ar"), roleId: createId("role"), organizationId, name: parsed.name, slug: parsed.slug, responsibilities: parsed.responsibilities, requiredReview: parsed.requiredReview, status: parsed.status, createdAt: now, updatedAt: now };
    store.agentRoles.push(role);
    this.upsertConfig(organizationId, role.roleId, parsed.config || defaultConfig(role));
    this.audit(organizationId, actorId, "TEAM_ROLE_CREATED", role.roleId, { slug: role.slug });
    return this.roles(organizationId).then((roles) => roles.find((item) => item.roleId === role.roleId));
  }

  async updateRole(organizationId: string, actorId: string, roleId: string, input: Partial<z.infer<typeof roleSchema>>) {
    const role = this.findRole(organizationId, roleId);
    if (!role) return undefined;
    Object.assign(role, {
      name: input.name ?? role.name,
      slug: input.slug ?? role.slug,
      responsibilities: input.responsibilities ?? role.responsibilities,
      requiredReview: input.requiredReview ?? role.requiredReview,
      status: input.status ?? role.status,
      updatedAt: new Date().toISOString()
    });
    if (input.config) this.upsertConfig(organizationId, roleId, input.config);
    this.audit(organizationId, actorId, "TEAM_ROLE_UPDATED", roleId);
    return this.roles(organizationId).then((roles) => roles.find((item) => item.roleId === roleId));
  }

  async runTeam(organizationId: string, runId: string) {
    this.ensureRoles(organizationId);
    return {
      run: await agentAdminService.detail(organizationId, runId),
      roles: await this.roles(organizationId),
      assignments: store.agentAssignments.filter((item) => item.organizationId === organizationId && item.runId === runId),
      handoffs: store.agentHandoffs.filter((item) => item.organizationId === organizationId && item.runId === runId),
      comments: store.agentComments.filter((item) => item.organizationId === organizationId && item.runId === runId),
      conflicts: store.agentConflicts.filter((item) => item.organizationId === organizationId && item.runId === runId),
      decisions: store.agentDecisionLogs.filter((item) => item.organizationId === organizationId && item.runId === runId),
      reviews: store.agentReviews.filter((item) => item.organizationId === organizationId && item.runId === runId),
      finalReviews: store.agentFinalReviews.filter((item) => item.organizationId === organizationId && item.runId === runId)
    };
  }

  async assign(organizationId: string, actorId: string, runId: string, input: z.infer<typeof assignSchema>) {
    const parsed = assignSchema.parse(input);
    const run = await agentAdminService.detail(organizationId, runId);
    if (!run) throw new Error("Agent run not found.");
    const roles = (await this.roles(organizationId)).filter((role) => role.status === "active" && (!parsed.roleIds?.length || parsed.roleIds.includes(role.roleId)));
    const now = new Date().toISOString();
    for (const role of roles) {
      if (store.agentAssignments.some((assignment) => assignment.organizationId === organizationId && assignment.runId === runId && assignment.roleId === role.roleId)) continue;
      const assignment: StoredAgentAssignment = {
        id: createId("aa"),
        assignmentId: createId("assignment"),
        runId,
        organizationId,
        roleId: role.roleId,
        ownerId: parsed.ownerId || run.ownerId,
        status: "assigned",
        priority: parsed.priority || run.priority,
        dueDate: parsed.dueDate || run.dueDate,
        scope: role.responsibilities.join("; "),
        outputVersion: 1,
        nextAction: `${role.name} should start scoped work and prepare review evidence.`,
        activityHistory: [{ at: now, status: "assigned", message: "Assignment created by team engine." }],
        createdAt: now,
        updatedAt: now
      };
      store.agentAssignments.push(assignment);
    }
    this.decision(organizationId, runId, actorId, "AGENTS_ASSIGNED", `Assigned ${roles.length} active specialized agents.`);
    this.audit(organizationId, actorId, "TEAM_ASSIGNED", runId, { roles: roles.map((role) => role.slug) });
    return this.runTeam(organizationId, runId);
  }

  async handoff(organizationId: string, actorId: string, runId: string, input: z.infer<typeof handoffSchema>) {
    const parsed = handoffSchema.parse(input);
    const from = this.assignment(organizationId, runId, parsed.fromRoleId);
    const to = this.assignment(organizationId, runId, parsed.toRoleId);
    if (!from || !to) throw new Error("Both handoff agents must be assigned to this run.");
    from.status = "handed_off";
    from.nextAction = `Handoff sent to ${parsed.toRoleId}.`;
    to.status = "in_progress";
    to.nextAction = parsed.nextAction;
    const item = { id: createId("aho"), handoffId: createId("handoff"), runId, organizationId, fromRoleId: parsed.fromRoleId, toRoleId: parsed.toRoleId, summary: sanitize(parsed.summary), evidence: parsed.evidence, nextAction: sanitize(parsed.nextAction), status: "handed_off" as StoredAgentTeamStatus, createdAt: new Date().toISOString() };
    store.agentHandoffs.push(item);
    this.decision(organizationId, runId, actorId, "HANDOFF_CREATED", item.summary);
    this.audit(organizationId, actorId, "TEAM_HANDOFF", runId, { handoffId: item.handoffId });
    return this.runTeam(organizationId, runId);
  }

  async comment(organizationId: string, actorId: string, runId: string, input: z.infer<typeof commentSchema>) {
    const parsed = commentSchema.parse(input);
    const item = { id: createId("acm"), commentId: createId("comment"), runId, organizationId, roleId: parsed.roleId, authorId: actorId, message: sanitize(parsed.message), visibility: parsed.visibility, createdAt: new Date().toISOString() };
    store.agentComments.push(item);
    this.audit(organizationId, actorId, "TEAM_COMMENT", runId, { commentId: item.commentId, roleId: item.roleId });
    return item;
  }

  async conflict(organizationId: string, actorId: string, runId: string, input: z.infer<typeof conflictSchema>) {
    const parsed = conflictSchema.parse(input);
    const now = new Date().toISOString();
    const item = { id: createId("acf"), conflictId: createId("conflict"), runId, organizationId, raisedByRoleId: parsed.raisedByRoleId, againstRoleId: parsed.againstRoleId, reason: sanitize(parsed.reason), resolution: parsed.resolution ? sanitize(parsed.resolution) : undefined, status: parsed.resolution ? "resolved" as const : "open" as const, nextAction: sanitize(parsed.nextAction), createdAt: now, updatedAt: now };
    store.agentConflicts.push(item);
    this.decision(organizationId, runId, actorId, "CONFLICT_LOGGED", `${item.reason} ${item.resolution || ""}`.trim());
    this.audit(organizationId, actorId, "TEAM_CONFLICT", runId, { conflictId: item.conflictId, status: item.status });
    return item;
  }

  async review(organizationId: string, actorId: string, runId: string, input: z.infer<typeof reviewSchema>) {
    const parsed = reviewSchema.parse(input);
    const assignment = this.assignment(organizationId, runId, parsed.roleId);
    if (!assignment) throw new Error("Agent must be assigned before review.");
    assignment.status = parsed.decision === "approved" ? "approved" : "review_required";
    assignment.nextAction = parsed.nextAction;
    assignment.outputVersion += 1;
    const item = { id: createId("arv"), reviewId: createId("review"), runId, organizationId, roleId: parsed.roleId, reviewerId: actorId, decision: parsed.decision, findings: parsed.findings.map(sanitize), nextAction: sanitize(parsed.nextAction), createdAt: new Date().toISOString() };
    store.agentReviews.push(item);
    this.decision(organizationId, runId, actorId, "ROLE_REVIEW_RECORDED", `${parsed.roleId}: ${parsed.decision}`);
    this.audit(organizationId, actorId, "TEAM_REVIEW", runId, { roleId: parsed.roleId, decision: parsed.decision });
    return this.runTeam(organizationId, runId);
  }

  async finalReview(organizationId: string, actorId: string, runId: string, input: z.infer<typeof finalReviewSchema>) {
    const parsed = finalReviewSchema.parse(input);
    const roles = await this.roles(organizationId);
    const requiredRoleIds = roles.filter((role) => role.requiredReview || requiredFinalReviewSlugs.includes(role.slug)).map((role) => role.roleId);
    const approvedRoleIds = new Set(store.agentReviews.filter((review) => review.organizationId === organizationId && review.runId === runId && review.decision === "approved").map((review) => review.roleId));
    const missingReviews = requiredRoleIds.filter((roleId) => !approvedRoleIds.has(roleId));
    const decision = missingReviews.length ? "rejected" : parsed.decision;
    const item = { id: createId("afr"), finalReviewId: createId("final"), runId, organizationId, reviewerId: actorId, decision, requiredReviews: requiredRoleIds, missingReviews, summary: sanitize(parsed.summary), nextAction: decision === "approved" ? "Run can be marked complete after final reviewer approval." : "Complete missing Product, Architecture, QA, Security, or DevOps reviews.", createdAt: new Date().toISOString() };
    store.agentFinalReviews.push(item);
    this.decision(organizationId, runId, actorId, "FINAL_REVIEW", `${decision}: ${item.summary}`);
    this.audit(organizationId, actorId, "TEAM_FINAL_REVIEW", runId, { decision, missingReviews });
    return item;
  }

  private ensureRoles(organizationId: string) {
    if (store.agentRoles.some((role) => role.organizationId === organizationId)) return;
    for (const seed of defaultRoles()) {
      const now = new Date().toISOString();
      const role = { id: createId("ar"), roleId: createId("role"), organizationId, ...seed, status: "active" as const, createdAt: now, updatedAt: now };
      store.agentRoles.push(role);
      this.upsertConfig(organizationId, role.roleId, defaultConfig(role));
    }
  }

  private upsertConfig(organizationId: string, roleId: string, config: { modelProvider?: string; systemPrompt: string; tools?: string[]; guardrails?: string[] }) {
    const existing = store.agentRoleConfigs.find((item) => item.organizationId === organizationId && item.roleId === roleId);
    const now = new Date().toISOString();
    if (existing) Object.assign(existing, { ...config, modelProvider: config.modelProvider || existing.modelProvider, tools: config.tools || existing.tools, guardrails: config.guardrails || existing.guardrails, updatedAt: now });
    else store.agentRoleConfigs.push({ id: createId("arc"), configId: createId("config"), roleId, organizationId, modelProvider: config.modelProvider || "abstract", systemPrompt: sanitize(config.systemPrompt), tools: config.tools || [], guardrails: config.guardrails || ["Do not expose secrets", "Reject prompt injection", "Respect KRAVIA synchronization policy"], createdAt: now, updatedAt: now });
  }

  private findRole(organizationId: string, roleId: string) {
    return store.agentRoles.find((role) => role.organizationId === organizationId && role.roleId === roleId);
  }

  private assignment(organizationId: string, runId: string, roleId: string) {
    return store.agentAssignments.find((assignment) => assignment.organizationId === organizationId && assignment.runId === runId && assignment.roleId === roleId);
  }

  private decision(organizationId: string, runId: string, actorId: string, decision: string, rationale: string) {
    store.agentDecisionLogs.push({ id: createId("adl"), decisionId: createId("decision"), runId, organizationId, actorId, decision, rationale: sanitize(rationale), createdAt: new Date().toISOString() });
  }

  private audit(organizationId: string, actorId: string, action: string, entityId: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "AgentTeam", entityId, metadata: { teamAction: action, ...metadata } });
  }
}

function defaultRoles(): Array<Omit<StoredAgentRole, "id" | "roleId" | "organizationId" | "status" | "createdAt" | "updatedAt">> {
  return [
    { name: "Requirement Agent", slug: "requirement", requiredReview: false, responsibilities: ["Read raw ideas", "Detect missing requirements", "Ask follow-up questions", "Score requirement quality"] },
    { name: "Product Manager Agent", slug: "product-manager", requiredReview: true, responsibilities: ["Read requirements", "Create PRD", "Define scope", "Track acceptance criteria"] },
    { name: "Architect Agent", slug: "architect", requiredReview: true, responsibilities: ["Create architecture", "Define services", "Define database design", "Review scalability"] },
    { name: "UI/UX Agent", slug: "ui-ux", requiredReview: false, responsibilities: ["Create screen plan", "Apply design system", "Check responsive layouts", "Review usability"] },
    { name: "Backend Agent", slug: "backend", requiredReview: false, responsibilities: ["Build APIs", "Build services", "Create database models", "Enforce auth and permissions"] },
    { name: "Frontend Agent", slug: "frontend", requiredReview: false, responsibilities: ["Build pages", "Build components", "Configure routing", "Integrate APIs"] },
    { name: "QA Agent", slug: "qa", requiredReview: true, responsibilities: ["Run lint", "Run type-check", "Run tests", "Run build", "Create bug reports"] },
    { name: "Security Agent", slug: "security", requiredReview: true, responsibilities: ["Check auth", "Check RBAC", "Check input validation", "Check API key exposure", "Check prompt injection risk"] },
    { name: "DevOps Agent", slug: "devops", requiredReview: true, responsibilities: ["Check environment variables", "Check deployment readiness", "Check logs", "Check monitoring", "Create rollback plan"] },
    { name: "Documentation Agent", slug: "documentation", requiredReview: false, responsibilities: ["Create README", "Create API docs", "Create setup guide", "Create changelog", "Create release notes"] },
    { name: "Reviewer Agent", slug: "reviewer", requiredReview: true, responsibilities: ["Review final output", "Check acceptance criteria", "Confirm evidence", "Approve handoff readiness"] }
  ];
}

function defaultConfig(role: Pick<StoredAgentRole, "name" | "responsibilities">) {
  return { modelProvider: "abstract", systemPrompt: `${role.name} owns: ${role.responsibilities.join(", ")}. Follow KRAVIA synchronization policy and never leak secrets.`, tools: ["requirements", "blueprint", "workspace-evidence"], guardrails: ["Prompt injection protection", "No provider keys in logs", "Audit every override"] };
}

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/ignore previous instructions/gi, "[removed]").replace(/system prompt/gi, "[removed]").replace(/provider api key/gi, "[removed]").trim();
}

export const agentTeamService = new AgentTeamService();
