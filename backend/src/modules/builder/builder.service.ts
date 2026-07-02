import { z } from "zod";
import { roleHasPermission } from "@kravia/shared/permissions";
import type { CoreRole } from "@kravia/shared/roles";
import {
  createId,
  store,
  type StoredAgentTask,
  type StoredBuilderProject,
  type StoredBuilderProjectActivityLog,
  type StoredBuilderProjectBlueprint,
  type StoredBuilderProjectChangeRequest,
  type StoredBuilderProjectOutput,
  type StoredBuilderProjectRequirement,
  type StoredBuilderProjectStatus
} from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { billingService } from "../billing/billing.service";
import { agentTemplateService } from "../vaanforge/agent-template.service";
import { vaanForgeExecutionService } from "../vaanforge/vaanforge-execution.service";
import { vaanForgeService } from "../vaanforge/vaanforge.service";

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const builderProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  templateId: z.string().optional(),
  priority: prioritySchema.default("HIGH"),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Expected a valid due date").optional(),
  targetUsers: z.array(z.string().min(2)).min(1).default(["Customer"]),
  goals: z.array(z.string().min(2)).min(1).default(["Build a production-ready application."]),
  features: z.array(z.string().min(2)).min(1).default(["Customer portal", "Admin dashboard", "API integration"]),
  successMetrics: z.array(z.string().min(2)).min(1).default(["Blueprint approved", "Build completed", "Delivery reviewed"])
});

export const builderProjectPatchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Expected a valid due date").optional(),
  nextAction: z.string().min(2).optional()
});

export const builderRequirementSchema = z.object({
  problemStatement: z.string().min(10),
  targetUsers: z.array(z.string().min(2)).min(1),
  goals: z.array(z.string().min(2)).min(1),
  features: z.array(z.string().min(2)).min(1),
  successMetrics: z.array(z.string().min(2)).min(1),
  constraints: z.array(z.string().min(2)).default([]),
  integrations: z.array(z.string().min(2)).default([]),
  dataEntities: z.array(z.string().min(2)).default([])
});

export const builderBlueprintDecisionSchema = z.object({
  reason: z.string().min(2).optional()
});

export const builderChangeRequestSchema = z.object({
  summary: z.string().min(5),
  details: z.string().min(10)
});

export type BuilderActor = {
  userId: string;
  organizationId: string;
  role: string;
};

export class BuilderService {
  async list(actor: BuilderActor) {
    const templates = await agentTemplateService.marketplace(actor.organizationId);
    return {
      projects: this.visibleProjects(actor).map((project) => this.projectSummary(project)),
      templates: templates.map((template) => ({
        templateId: template.templateId,
        name: template.name,
        category: template.category,
        description: template.description,
        requiredInputs: template.requiredInputs,
        stack: template.stack,
        includedScreens: template.includedScreens,
        includedApis: template.includedApis,
        databaseModels: template.databaseModels,
        status: template.status,
        version: template.version
      }))
    };
  }

  async create(actor: BuilderActor, input: z.infer<typeof builderProjectSchema>) {
    const parsed = builderProjectSchema.parse(input);
    this.assertSafeText(parsed);
    const now = new Date().toISOString();
    const dueDate = parsed.dueDate || inDays(21);
    const requirementInput = this.buildRequirement(actor, {
      name: parsed.name,
      description: parsed.description,
      templateId: parsed.templateId,
      priority: parsed.priority,
      dueDate,
      targetUsers: parsed.targetUsers,
      goals: parsed.goals,
      features: parsed.features,
      successMetrics: parsed.successMetrics
    });
    billingService.checkAndConsume({ organizationId: actor.organizationId, customerId: actor.userId, actorId: actor.userId, metric: "agent_run", quantity: 1, source: "builder_project", sourceId: parsed.name });
    const run = await vaanForgeService.submit({ organizationId: actor.organizationId, requestedById: actor.userId, requirement: requirementInput });
    if (run?.status === "failed") {
      billingService.refund({ organizationId: actor.organizationId, customerId: actor.userId, actorId: actor.userId, metric: "agent_run", quantity: 1, source: "builder_project", sourceId: run.runId, reason: "Blueprint run failed." });
    }
    if (!run?.runId) throw new Error("VaanForge blueprint run was not created.");
    const project: StoredBuilderProject = {
      id: createId("bpr"),
      projectId: createId("builder_project"),
      organizationId: actor.organizationId,
      customerId: actor.userId,
      ownerId: actor.userId,
      name: parsed.name,
      description: parsed.description,
      templateId: parsed.templateId,
      agentRunId: run.runId,
      status: run.status === "completed" ? "blueprint_ready" : "requirements_submitted",
      priority: parsed.priority,
      dueDate,
      nextAction: run.status === "completed" ? "Review and approve the generated blueprint." : "Wait for blueprint generation to complete.",
      activityHistory: [{ at: now, status: "requirements_submitted", message: "Customer project created and linked to VaanForge run." }],
      createdAt: now,
      updatedAt: now
    };
    store.builderProjects.push(project);
    this.storeRequirement(project, actor.userId, parsed, requirementInput, 1, []);
    await this.syncBlueprintAndOutputs(project, actor.userId);
    this.log(project, actor.userId, "project.created", project.status, "Project created and blueprint run linked.", { agentRunId: run.runId });
    return this.detail(actor, project.projectId);
  }

  async detail(actor: BuilderActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    await this.syncBlueprintAndOutputs(project, actor.userId);
    return {
      ...project,
      requirements: store.builderProjectRequirements.filter((item) => item.projectId === project.projectId).sort((a, b) => b.version - a.version),
      blueprints: store.builderProjectBlueprints.filter((item) => item.projectId === project.projectId).sort((a, b) => b.version - a.version),
      outputs: await this.outputs(actor, project.projectId),
      changeRequests: store.builderProjectChangeRequests.filter((item) => item.projectId === project.projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      activityLogs: store.builderProjectActivityLogs.filter((item) => item.projectId === project.projectId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      progress: await this.progress(actor, project.projectId)
    };
  }

  async update(actor: BuilderActor, projectId: string, patch: z.infer<typeof builderProjectPatchSchema>) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    Object.assign(project, patch, {
      updatedAt: new Date().toISOString(),
      nextAction: patch.nextAction || project.nextAction,
      activityHistory: [...project.activityHistory, { at: new Date().toISOString(), status: project.status, message: "Project metadata updated." }]
    });
    this.log(project, actor.userId, "project.updated", project.status, "Project metadata updated.");
    return this.detail(actor, projectId);
  }

  async submitRequirements(actor: BuilderActor, projectId: string, input: z.infer<typeof builderRequirementSchema>) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    const parsed = builderRequirementSchema.parse(input);
    this.assertSafeText(parsed);
    const missing = this.missingRequirementFields(parsed);
    const version = this.nextRequirementVersion(projectId);
    if (missing.length) {
      this.storeRequirement(project, actor.userId, parsed, {}, version, missing);
      project.status = "blocked";
      project.nextAction = `Provide missing requirement fields: ${missing.join(", ")}.`;
      project.updatedAt = new Date().toISOString();
      this.log(project, actor.userId, "requirements.blocked", "blocked", project.nextAction, { missing });
      return this.detail(actor, projectId);
    }
    const requirementInput = this.buildRequirement(actor, {
      name: project.name,
      description: parsed.problemStatement,
      templateId: project.templateId,
      priority: project.priority,
      dueDate: project.dueDate,
      targetUsers: parsed.targetUsers,
      goals: parsed.goals,
      features: parsed.features,
      successMetrics: parsed.successMetrics,
      constraints: parsed.constraints,
      integrations: parsed.integrations,
      dataEntities: parsed.dataEntities
    });
    billingService.checkAndConsume({ organizationId: actor.organizationId, customerId: project.customerId, actorId: actor.userId, metric: "regeneration", quantity: 1, source: "builder_requirements", sourceId: project.projectId });
    const run = await vaanForgeService.submit({ organizationId: actor.organizationId, requestedById: actor.userId, requirement: requirementInput });
    if (run?.status === "failed") {
      billingService.refund({ organizationId: actor.organizationId, customerId: project.customerId, actorId: actor.userId, metric: "regeneration", quantity: 1, source: "builder_requirements", sourceId: project.projectId, reason: "Blueprint regeneration failed." });
    }
    if (!run?.runId) throw new Error("VaanForge requirement run was not created.");
    project.agentRunId = run.runId;
    project.executionId = undefined;
    project.status = run.status === "completed" ? "blueprint_ready" : "requirements_submitted";
    project.nextAction = "Review the regenerated blueprint.";
    project.updatedAt = new Date().toISOString();
    this.supersedeBlueprints(project.projectId);
    this.storeRequirement(project, actor.userId, parsed, requirementInput, version, []);
    await this.syncBlueprintAndOutputs(project, actor.userId);
    this.log(project, actor.userId, "requirements.submitted", project.status, "Requirements submitted and blueprint regenerated.", { agentRunId: run.runId, version });
    return this.detail(actor, projectId);
  }

  async blueprint(actor: BuilderActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    await this.syncBlueprintAndOutputs(project, actor.userId);
    return store.builderProjectBlueprints.filter((item) => item.projectId === project.projectId).sort((a, b) => b.version - a.version)[0];
  }

  async approveBlueprint(actor: BuilderActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    const blueprint = await this.blueprint(actor, projectId);
    if (!blueprint || blueprint.status === "rejected") throw new Error("A generated blueprint is required before approval.");
    blueprint.status = "approved";
    blueprint.approvedAt = new Date().toISOString();
    blueprint.updatedAt = new Date().toISOString();
    project.status = "blueprint_approved";
    project.nextAction = "Start coding execution from the approved blueprint.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor.userId, "blueprint.approved", "approved", "Customer approved blueprint.", { blueprintId: blueprint.blueprintId });
    billingService.checkAndConsume({ organizationId: actor.organizationId, customerId: project.customerId, actorId: actor.userId, metric: "build_minute", quantity: 1, source: "builder_execution", sourceId: project.agentRunId });
    const execution = await vaanForgeExecutionService.submit({ organizationId: actor.organizationId, requestedById: actor.userId, phaseOneRunId: project.agentRunId });
    if (execution?.status === "failed") {
      billingService.refund({ organizationId: actor.organizationId, customerId: project.customerId, actorId: actor.userId, metric: "build_minute", quantity: 1, source: "builder_execution", sourceId: project.agentRunId, reason: "Coding execution failed." });
    }
    project.executionId = execution?.executionId;
    project.status = execution?.status === "completed" ? "delivered" : execution?.status === "failed" ? "failed" : "coding_started";
    project.nextAction = execution?.nextAction || "Track live build progress.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor.userId, "coding.started", project.status, "Coding execution linked to approved blueprint.", { executionId: project.executionId });
    await this.syncExecutionOutputs(project);
    return this.detail(actor, projectId);
  }

  async rejectBlueprint(actor: BuilderActor, projectId: string, reason?: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    const blueprint = await this.blueprint(actor, projectId);
    if (blueprint) {
      blueprint.status = "rejected";
      blueprint.rejectionReason = reason || "Customer requested blueprint changes.";
      blueprint.updatedAt = new Date().toISOString();
    }
    project.status = "blueprint_rejected";
    project.nextAction = "Update requirements and regenerate blueprint.";
    project.updatedAt = new Date().toISOString();
    this.log(project, actor.userId, "blueprint.rejected", "rejected", reason || "Blueprint rejected.", { blueprintId: blueprint?.blueprintId });
    return this.detail(actor, projectId);
  }

  async progress(actor: BuilderActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    const run = await vaanForgeService.detail(project.organizationId, project.agentRunId);
    const execution = project.executionId ? await vaanForgeExecutionService.detail(project.organizationId, project.executionId) : undefined;
    return {
      projectStatus: project.status,
      agentRunId: project.agentRunId,
      blueprintStatus: run?.status,
      executionId: project.executionId,
      executionStatus: execution?.status,
      currentTask: execution?.tasks?.find((task) => !["completed", "failed"].includes(task.status)) || null,
      validationRuns: execution?.validationRuns || [],
      errors: execution?.errors || [],
      activity: [...(run?.auditLogs || []), ...(execution?.activityLogs || []), ...store.builderProjectActivityLogs.filter((item) => item.projectId === project.projectId)].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
      nextAction: project.nextAction
    };
  }

  async outputs(actor: BuilderActor, projectId: string) {
    const project = this.findVisible(actor, projectId);
    if (!project) return [];
    await this.syncBlueprintAndOutputs(project, actor.userId);
    await this.syncExecutionOutputs(project);
    return store.builderProjectOutputs.filter((item) => item.projectId === project.projectId).sort((a, b) => b.version - a.version || a.createdAt.localeCompare(b.createdAt));
  }

  async changeRequest(actor: BuilderActor, projectId: string, input: z.infer<typeof builderChangeRequestSchema>) {
    const project = this.findVisible(actor, projectId);
    if (!project) return undefined;
    const parsed = builderChangeRequestSchema.parse(input);
    this.assertSafeText(parsed);
    billingService.checkAndConsume({ organizationId: actor.organizationId, customerId: project.customerId, actorId: actor.userId, metric: "regeneration", quantity: 1, source: "builder_change_request", sourceId: project.projectId });
    const now = new Date().toISOString();
    const targetVersion = this.nextOutputVersion(projectId);
    const request: StoredBuilderProjectChangeRequest = {
      id: createId("bcr"),
      changeRequestId: createId("change"),
      projectId,
      organizationId: project.organizationId,
      customerId: project.customerId,
      requestedById: actor.userId,
      summary: parsed.summary,
      details: parsed.details,
      targetVersion,
      status: "requested",
      nextAction: "Review change request and create a targeted agent task.",
      createdAt: now,
      updatedAt: now
    };
    store.builderProjectChangeRequests.push(request);
    const task: StoredAgentTask = {
      id: createId("agt"),
      taskId: createId("builder_task"),
      executionId: project.executionId || project.agentRunId,
      organizationId: project.organizationId,
      module: "change_request",
      title: parsed.summary,
      description: parsed.details,
      status: "pending",
      priority: project.priority,
      ownerId: project.ownerId,
      dueDate: project.dueDate,
      dependencies: project.executionId ? [project.executionId] : [project.agentRunId],
      outputPaths: [],
      nextAction: "Convert customer change request into a versioned implementation task.",
      activityHistory: [{ at: now, status: "pending", message: "Change request task created from builder portal." }],
      createdAt: now,
      updatedAt: now
    };
    store.agentTasks.push(task);
    request.agentTaskId = task.taskId;
    project.status = "change_requested";
    project.nextAction = "Review and prioritize customer change request.";
    project.updatedAt = now;
    this.log(project, actor.userId, "change_request.created", "requested", "Customer change request created a new agent task.", { changeRequestId: request.changeRequestId, agentTaskId: task.taskId });
    return request;
  }

  private visibleProjects(actor: BuilderActor) {
    return store.builderProjects
      .filter((project) => project.organizationId === actor.organizationId)
      .filter((project) => this.isAdmin(actor.role) || project.customerId === actor.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private findVisible(actor: BuilderActor, projectId: string) {
    return this.visibleProjects(actor).find((project) => project.projectId === projectId);
  }

  private isAdmin(role: string) {
    return roleHasPermission(role as CoreRole, "audit:read") || roleHasPermission(role as CoreRole, "organization:manage");
  }

  private projectSummary(project: StoredBuilderProject) {
    return {
      ...project,
      blueprintVersion: this.nextBlueprintVersion(project.projectId) - 1,
      outputCount: store.builderProjectOutputs.filter((item) => item.projectId === project.projectId).length,
      changeRequestCount: store.builderProjectChangeRequests.filter((item) => item.projectId === project.projectId).length
    };
  }

  private buildRequirement(
    actor: BuilderActor,
    input: {
      name: string;
      description: string;
      templateId?: string;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
      dueDate: string;
      targetUsers: string[];
      goals: string[];
      features: string[];
      successMetrics: string[];
      constraints?: string[];
      integrations?: string[];
      dataEntities?: string[];
    }
  ) {
    const slug = slugify(input.name);
    return {
      productName: input.name,
      productSlug: slug,
      source: "BUILDER_PORTAL",
      requestId: `builder:${actor.userId}:${Date.now()}`,
      ownerId: actor.userId,
      priority: input.priority,
      dueDate: input.dueDate,
      businessContext: {
        problemStatement: input.description,
        targetUsers: input.targetUsers,
        goals: input.goals,
        successMetrics: input.successMetrics
      },
      scope: {
        coreFeatures: input.features.map((feature) => ({
          name: feature,
          description: `Build ${feature} for ${input.name} with customer review and admin monitoring.`,
          priority: input.priority,
          acceptanceCriteria: [`${feature} is implemented with protected routing, audit logs, status, owner, due date, and next action.`]
        }))
      },
      constraints: {
        approvedArchitecture: ["Node.js", "Express", "PostgreSQL", "Next.js", ...(input.constraints || [])].join(", "),
        designSystem: "KRAVIA design system, responsive light and dark theme, enterprise dashboard styling",
        routing: [`/builder/projects/${slug}`, `/builder/projects/${slug}/requirements`, `/builder/projects/${slug}/blueprint`, `/builder/projects/${slug}/progress`, `/builder/projects/${slug}/outputs`],
        permissions: ["Customer project owner", "Admin audit visibility", "Tenant isolation"]
      },
      dataEntities: (input.dataEntities?.length ? input.dataEntities : ["BuilderProject", "BuilderRequirement", "BuilderBlueprint", "BuilderOutput", "BuilderChangeRequest"]).map((entity) => ({
        name: entity,
        fields: ["id", "organizationId", "ownerId", "status", "priority", "dueDate", "nextAction", "createdAt", "updatedAt"]
      })),
      integrations: ["VaanForge", "VFormix", "Builder Portal", ...(input.integrations || [])],
      nonFunctionalRequirements: ["Input validation", "Prompt injection protection", "No secret exposure", "Audit every customer action", "Blueprint approval before coding"],
      templateId: input.templateId
    };
  }

  private storeRequirement(
    project: StoredBuilderProject,
    actorId: string,
    rawInput: Record<string, unknown>,
    normalizedInput: Record<string, unknown>,
    version: number,
    missingFields: string[]
  ) {
    const requirement: StoredBuilderProjectRequirement = {
      id: createId("brq"),
      requirementId: createId("requirement"),
      projectId: project.projectId,
      organizationId: project.organizationId,
      customerId: project.customerId,
      rawInput,
      normalizedInput,
      version,
      status: missingFields.length ? "blocked" : "accepted",
      missingFields,
      createdAt: new Date().toISOString()
    };
    store.builderProjectRequirements.push(requirement);
    this.log(project, actorId, "requirements.stored", project.status, "Builder requirements stored separately from normalized VaanForge input.", { requirementId: requirement.requirementId, version });
    return requirement;
  }

  private async syncBlueprintAndOutputs(project: StoredBuilderProject, actorId: string) {
    const detail = await vaanForgeService.detail(project.organizationId, project.agentRunId);
    if (!detail?.outputs?.length) return;
    const existing = store.builderProjectBlueprints.find((item) => item.projectId === project.projectId && item.agentRunId === project.agentRunId);
    if (!existing) {
      const now = new Date().toISOString();
      const blueprint: StoredBuilderProjectBlueprint = {
        id: createId("bbp"),
        blueprintId: createId("blueprint"),
        projectId: project.projectId,
        organizationId: project.organizationId,
        customerId: project.customerId,
        agentRunId: project.agentRunId,
        version: this.nextBlueprintVersion(project.projectId),
        status: "generated",
        content: { outputs: detail.outputs, inputRequirements: detail.inputRequirements },
        createdAt: now,
        updatedAt: now
      };
      store.builderProjectBlueprints.push(blueprint);
      project.status = project.status === "requirements_submitted" ? "blueprint_ready" : project.status;
      project.nextAction = project.status === "blueprint_ready" ? "Review and approve the generated blueprint." : project.nextAction;
      this.log(project, actorId, "blueprint.generated", "generated", "VaanForge blueprint synced into builder portal.", { blueprintId: blueprint.blueprintId });
    }
    for (const output of detail.outputs) {
      if (store.builderProjectOutputs.some((item) => item.projectId === project.projectId && item.outputType === output.outputType && item.version === this.currentBlueprintVersion(project.projectId))) continue;
      store.builderProjectOutputs.push({
        id: createId("bot"),
        outputId: createId("output"),
        projectId: project.projectId,
        organizationId: project.organizationId,
        customerId: project.customerId,
        agentRunId: project.agentRunId,
        outputType: output.outputType,
        title: output.title,
        content: output.content,
        status: "ready",
        version: this.currentBlueprintVersion(project.projectId),
        deliveryDate: output.createdAt,
        createdAt: output.createdAt,
        updatedAt: output.updatedAt
      });
    }
  }

  private async syncExecutionOutputs(project: StoredBuilderProject) {
    if (!project.executionId) return;
    const detail = await vaanForgeExecutionService.detail(project.organizationId, project.executionId);
    if (!detail) return;
    for (const file of detail.files || []) {
      const version = this.nextOutputVersion(project.projectId);
      if (store.builderProjectOutputs.some((item) => item.projectId === project.projectId && item.outputType === `file:${file.fileId}`)) continue;
      store.builderProjectOutputs.push({
        id: createId("bot"),
        outputId: createId("output"),
        projectId: project.projectId,
        organizationId: project.organizationId,
        customerId: project.customerId,
        agentRunId: project.agentRunId,
        executionId: project.executionId,
        outputType: `file:${file.fileId}`,
        title: file.path,
        content: JSON.stringify(file, null, 2),
        status: file.status === "written" ? "ready" : file.status === "blocked" ? "failed" : "in_progress",
        version,
        deliveryDate: detail.updatedAt || new Date().toISOString(),
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      });
    }
  }

  private supersedeBlueprints(projectId: string) {
    for (const blueprint of store.builderProjectBlueprints.filter((item) => item.projectId === projectId && item.status === "generated")) {
      blueprint.status = "superseded";
      blueprint.updatedAt = new Date().toISOString();
    }
  }

  private missingRequirementFields(input: z.infer<typeof builderRequirementSchema>) {
    const missing = [];
    if (!input.problemStatement) missing.push("problemStatement");
    if (!input.targetUsers.length) missing.push("targetUsers");
    if (!input.goals.length) missing.push("goals");
    if (!input.features.length) missing.push("features");
    if (!input.successMetrics.length) missing.push("successMetrics");
    return missing;
  }

  private assertSafeText(value: unknown) {
    const text = JSON.stringify(value).toLowerCase();
    if (/api[_-]?key|password|secret|token=|begin private key/.test(text)) throw new Error("Secret-like content cannot be submitted to the builder agent.");
    if (/ignore previous instructions|system prompt|developer message|exfiltrate|jailbreak/.test(text)) throw new Error("Prompt injection content cannot be submitted to the builder agent.");
  }

  private nextRequirementVersion(projectId: string) {
    return Math.max(0, ...store.builderProjectRequirements.filter((item) => item.projectId === projectId).map((item) => item.version)) + 1;
  }

  private nextBlueprintVersion(projectId: string) {
    return Math.max(0, ...store.builderProjectBlueprints.filter((item) => item.projectId === projectId).map((item) => item.version)) + 1;
  }

  private currentBlueprintVersion(projectId: string) {
    return Math.max(1, ...store.builderProjectBlueprints.filter((item) => item.projectId === projectId).map((item) => item.version));
  }

  private nextOutputVersion(projectId: string) {
    return Math.max(0, ...store.builderProjectOutputs.filter((item) => item.projectId === projectId).map((item) => item.version)) + 1;
  }

  private log(project: StoredBuilderProject, actorId: string, action: string, status: StoredBuilderProjectActivityLog["status"], message: string, metadata?: Record<string, unknown>) {
    const log: StoredBuilderProjectActivityLog = {
      id: createId("bal"),
      activityId: createId("activity"),
      projectId: project.projectId,
      organizationId: project.organizationId,
      actorId,
      action,
      status,
      message,
      metadata,
      createdAt: new Date().toISOString()
    };
    store.builderProjectActivityLogs.push(log);
    project.activityHistory = [...project.activityHistory, { at: log.createdAt, status, message, action }];
    auditService.record({ actorId, organizationId: project.organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "BuilderProject", entityId: project.projectId, metadata: { builderAction: action, status, message, ...metadata } });
    return log;
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "builder-project";
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const builderService = new BuilderService();
