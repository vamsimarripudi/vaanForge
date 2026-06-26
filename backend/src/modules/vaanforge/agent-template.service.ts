import { z } from "zod";
import { createId, store, type StoredAgentTemplate, type StoredAgentTemplateQualityCheck, type StoredAgentTemplateVersion } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { builtInAgentTemplates } from "./agent-template.catalog";
import { vaanForgeService } from "./vaanforge.service";

export const templateInputSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  category: z.string().min(2),
  description: z.string().min(10),
  previewImage: z.string().optional(),
  stack: z.array(z.string().min(1)).min(1),
  requiredInputs: z.array(z.record(z.unknown())).min(1),
  optionalInputs: z.array(z.record(z.unknown())).default([]),
  includedScreens: z.array(z.string().min(1)).min(1),
  includedApis: z.array(z.string().min(1)).min(1),
  databaseModels: z.array(z.string().min(1)).min(1),
  designTokens: z.array(z.string().min(1)).min(1),
  securityRules: z.array(z.string().min(1)).min(1),
  validationRules: z.array(z.string().min(1)).min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
  dueDate: z.string().optional(),
  changelog: z.string().default("Template updated.")
});

export const templateUseSchema = z.object({
  inputValues: z.record(z.unknown())
});

export class AgentTemplateService {
  async list(organizationId: string, includeArchived = false) {
    this.ensureBuiltIns(organizationId);
    return store.agentTemplates.filter((template) => template.organizationId === organizationId && (includeArchived || template.status !== "archived"));
  }

  async marketplace(organizationId: string) {
    return (await this.list(organizationId)).filter((template) => template.status === "published");
  }

  async detail(organizationId: string, templateId: string) {
    this.ensureBuiltIns(organizationId);
    const template = store.agentTemplates.find((item) => item.organizationId === organizationId && item.templateId === templateId);
    if (!template) return undefined;
    return {
      ...template,
      versions: await this.versions(organizationId, templateId),
      qualityChecks: store.agentTemplateQualityChecks.filter((check) => check.organizationId === organizationId && check.templateId === templateId),
      usageLogs: store.agentTemplateUsageLogs.filter((log) => log.organizationId === organizationId && log.templateId === templateId),
      reviews: store.agentTemplateReviews.filter((review) => review.organizationId === organizationId && review.templateId === templateId)
    };
  }

  async create(organizationId: string, actorId: string, input: z.infer<typeof templateInputSchema>) {
    const parsed = templateInputSchema.parse(input);
    if (store.agentTemplates.some((template) => template.organizationId === organizationId && template.slug === parsed.slug)) {
      throw new Error("Template slug already exists. Clone or create a new version instead of overwriting.");
    }
    const now = new Date().toISOString();
    const template: StoredAgentTemplate = {
      id: createId("tpl"),
      templateId: createId("template"),
      organizationId,
      ...parsed,
      previewImage: parsed.previewImage || "",
      status: "draft",
      version: "1.0.0",
      createdBy: actorId,
      ownerId: actorId,
      dueDate: parsed.dueDate || nextMonth(),
      nextAction: "Run quality gates before publishing.",
      activityHistory: [{ at: now, status: "draft", message: "Template created." }],
      createdAt: now,
      updatedAt: now
    };
    store.agentTemplates.push(template);
    this.syncChildRecords(template);
    this.createVersion(template, actorId, parsed.changelog, "draft");
    this.audit(organizationId, actorId, "TEMPLATE_CREATED", template.templateId, { slug: template.slug });
    return template;
  }

  async update(organizationId: string, actorId: string, templateId: string, patch: Partial<z.infer<typeof templateInputSchema>>) {
    const template = this.find(organizationId, templateId);
    if (!template || template.status === "archived") return undefined;
    Object.assign(template, patch, {
      version: bumpPatch(template.version),
      status: template.status === "published" ? "unpublished" : template.status,
      nextAction: "Review new version and publish after quality gates pass.",
      updatedAt: new Date().toISOString(),
      activityHistory: [...template.activityHistory, { at: new Date().toISOString(), status: "updated", message: patch.changelog || "Template updated." }]
    });
    this.syncChildRecords(template);
    this.createVersion(template, actorId, patch.changelog || "Template updated.", "draft");
    this.audit(organizationId, actorId, "TEMPLATE_UPDATED", template.templateId);
    return template;
  }

  async archive(organizationId: string, actorId: string, templateId: string) {
    return this.transition(organizationId, actorId, templateId, "archived", "Template archived. It cannot be used until cloned or restored.", "TEMPLATE_ARCHIVED");
  }

  async clone(organizationId: string, actorId: string, templateId: string) {
    const template = this.find(organizationId, templateId);
    if (!template) return undefined;
    return this.create(organizationId, actorId, {
      ...template,
      name: `${template.name} Copy`,
      slug: `${template.slug}-copy-${Date.now().toString(36)}`,
      changelog: `Cloned from ${template.version}.`
    });
  }

  async publish(organizationId: string, actorId: string, templateId: string) {
    const template = this.find(organizationId, templateId);
    if (!template || template.status === "archived") return undefined;
    const checks = this.runQualityGates(template);
    if (checks.some((check) => check.status === "failed")) {
      template.status = "pending_review";
      template.nextAction = "Fix failed quality gates before publishing.";
      this.audit(organizationId, actorId, "TEMPLATE_PUBLISH_FAILED", templateId, { checks });
      return template;
    }
    template.status = "published";
    template.approvedBy = actorId;
    template.nextAction = "Template is published and reusable by VFormix.";
    template.updatedAt = new Date().toISOString();
    this.createVersion(template, actorId, "Published after passing quality gates.", "released", actorId);
    store.agentTemplateReviews.push({ id: createId("tpr"), reviewId: createId("review"), templateId, organizationId, reviewerId: actorId, decision: "approved", createdAt: new Date().toISOString() });
    this.audit(organizationId, actorId, "TEMPLATE_PUBLISHED", templateId);
    return template;
  }

  async unpublish(organizationId: string, actorId: string, templateId: string) {
    return this.transition(organizationId, actorId, templateId, "unpublished", "Template unpublished. Existing versions remain available for rollback.", "TEMPLATE_UNPUBLISHED");
  }

  async rollback(organizationId: string, actorId: string, templateId: string, versionId?: string) {
    const template = this.find(organizationId, templateId);
    if (!template) return undefined;
    const versions = await this.versions(organizationId, templateId);
    const version = versionId ? versions.find((item) => item.versionId === versionId) : versions.find((item) => item.releaseStatus === "released" || item.releaseStatus === "approved");
    if (!version) throw new Error("No approved version available for rollback.");
    Object.assign(template, version.snapshot, { status: "published", nextAction: "Rolled back to approved version.", updatedAt: new Date().toISOString() });
    this.createVersion(template, actorId, `Rolled back to ${version.version}.`, "rolled_back", actorId);
    this.audit(organizationId, actorId, "TEMPLATE_ROLLED_BACK", templateId, { versionId: version.versionId });
    return template;
  }

  async versions(organizationId: string, templateId: string) {
    return store.agentTemplateVersions.filter((version) => version.organizationId === organizationId && version.templateId === templateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createVersion(organizationIdOrTemplate: string | StoredAgentTemplate, actorId: string, changelog: string, releaseStatus: StoredAgentTemplateVersion["releaseStatus"] = "draft", approvedBy?: string) {
    const template = typeof organizationIdOrTemplate === "string" ? this.find("", organizationIdOrTemplate) : organizationIdOrTemplate;
    if (!template) return undefined;
    const version: StoredAgentTemplateVersion = {
      id: createId("tpv"),
      versionId: createId("version"),
      templateId: template.templateId,
      organizationId: template.organizationId,
      version: template.version,
      changelog,
      snapshot: { ...template },
      createdBy: actorId,
      approvedBy,
      releaseStatus,
      createdAt: new Date().toISOString()
    };
    store.agentTemplateVersions.push(version);
    return version;
  }

  async use(organizationId: string, actorId: string, templateId: string, inputValues: Record<string, unknown>) {
    const template = this.find(organizationId, templateId);
    if (!template) throw new Error("Template not found.");
    if (template.status === "archived") throw new Error("Archived templates cannot be used.");
    if (template.status !== "published") throw new Error("Template must be published before use.");
    const missing = template.requiredInputs.map((input) => String(input.key)).filter((key) => !inputValues[key]);
    if (missing.length) throw new Error(`Missing required template inputs: ${missing.join(", ")}`);
    const run = await vaanForgeService.submit({
      organizationId,
      requestedById: actorId,
      requirement: this.toRequirement(template, inputValues, actorId)
    });
    store.agentTemplateUsageLogs.push({
      id: createId("tpu"),
      usageId: createId("usage"),
      templateId,
      organizationId,
      actorId,
      runId: run?.runId,
      inputValues,
      status: run?.status || "failed",
      createdAt: new Date().toISOString()
    });
    this.audit(organizationId, actorId, "TEMPLATE_USED", templateId, { runId: run?.runId });
    return run;
  }

  private ensureBuiltIns(organizationId: string) {
    if (store.agentTemplates.some((template) => template.organizationId === organizationId)) return;
    for (const seed of builtInAgentTemplates) {
      const now = new Date().toISOString();
      const template: StoredAgentTemplate = {
        id: createId("tpl"),
        templateId: createId("template"),
        organizationId,
        ...seed,
        createdBy: "system",
        ownerId: "system",
        dueDate: nextMonth(),
        activityHistory: [{ at: now, status: "published", message: "Built-in approved template persisted to marketplace." }],
        createdAt: now,
        updatedAt: now
      };
      store.agentTemplates.push(template);
      this.syncChildRecords(template);
      this.createVersion(template, "system", "Initial approved marketplace release.", "released", "system");
      this.runQualityGates(template);
    }
  }

  private syncChildRecords(template: StoredAgentTemplate) {
    store.agentTemplateInputs = store.agentTemplateInputs.filter((input) => input.templateId !== template.templateId);
    for (const input of [...template.requiredInputs, ...template.optionalInputs]) {
      store.agentTemplateInputs.push({
        id: createId("tpi"),
        inputId: createId("input"),
        templateId: template.templateId,
        organizationId: template.organizationId,
        key: String(input.key),
        label: String(input.label || input.key),
        inputType: String(input.inputType || "text"),
        required: input.required !== false,
        validation: typeof input.validation === "object" && input.validation ? (input.validation as Record<string, unknown>) : undefined,
        createdAt: new Date().toISOString()
      });
    }
    store.agentTemplateFiles = store.agentTemplateFiles.filter((file) => file.templateId !== template.templateId);
    for (const screen of template.includedScreens) {
      store.agentTemplateFiles.push({ id: createId("tpf"), fileId: createId("file"), templateId: template.templateId, organizationId: template.organizationId, path: `frontend/src/app/${template.slug}/${slugify(screen)}/page.tsx`, module: "frontend", operation: "create", createdAt: new Date().toISOString() });
    }
  }

  private runQualityGates(template: StoredAgentTemplate) {
    store.agentTemplateQualityChecks = store.agentTemplateQualityChecks.filter((check) => check.templateId !== template.templateId);
    const checks = [
      gate(template.stack.length > 0, "architecture", "Template defines stack and architecture."),
      gate(template.designTokens.length > 0, "design_system", "Template declares VMNexus design tokens."),
      gate(template.requiredInputs.length > 0, "required_fields", "Template defines reusable VFormix inputs."),
      gate(template.securityRules.length > 0 && !JSON.stringify(template).toLowerCase().includes("api_key"), "security", "Template avoids provider secrets and declares security rules."),
      gate(template.validationRules.length >= 5, "validation", "Template defines build, lint, type, security, and field validation gates.")
    ];
    const stored = checks.map((check) => ({ id: createId("tpq"), checkId: createId("check"), templateId: template.templateId, organizationId: template.organizationId, ...check, createdAt: new Date().toISOString() }));
    store.agentTemplateQualityChecks.push(...stored);
    return stored;
  }

  private toRequirement(template: StoredAgentTemplate, values: Record<string, unknown>, actorId: string) {
    const productName = String(values.productName || template.name);
    return {
      productName,
      productSlug: template.slug,
      source: "VAANFORGE_TEMPLATE",
      requestId: `template:${template.templateId}`,
      ownerId: String(values.ownerId || actorId),
      priority: template.priority,
      dueDate: String(values.dueDate || template.dueDate),
      businessContext: {
        problemStatement: template.description,
        targetUsers: Array.isArray(values.targetUsers) ? values.targetUsers.map(String) : [String(values.targetUsers || "Admin")],
        goals: [String(values.primaryGoal || `Launch ${productName} using the ${template.name}.`)],
        successMetrics: template.validationRules
      },
      scope: {
        coreFeatures: template.includedScreens.map((screen) => ({ name: screen, description: `Build ${screen} for ${productName}.`, priority: template.priority, acceptanceCriteria: [`${screen} follows VMNexus routing, permissions, and design tokens.`] }))
      },
      constraints: {
        approvedArchitecture: template.stack.join(", "),
        designSystem: template.designTokens.join(", "),
        routing: template.includedScreens.map((screen) => `/${template.slug}/${slugify(screen)}`),
        permissions: ["audit:read", "workspace:create"]
      },
      dataEntities: template.databaseModels.map((model) => ({ name: model, fields: ["id", "organizationId", "ownerId", "status", "priority", "dueDate", "nextAction"] })),
      integrations: ["VFormix", "VaanForge"],
      nonFunctionalRequirements: template.securityRules
    };
  }

  private transition(organizationId: string, actorId: string, templateId: string, status: StoredAgentTemplate["status"], nextAction: string, action: string) {
    const template = this.find(organizationId, templateId);
    if (!template) return undefined;
    template.status = status;
    template.nextAction = nextAction;
    template.updatedAt = new Date().toISOString();
    template.activityHistory.push({ at: template.updatedAt, status, message: nextAction });
    this.audit(organizationId, actorId, action, templateId);
    return template;
  }

  private find(organizationId: string, templateId: string) {
    return store.agentTemplates.find((template) => template.templateId === templateId && (!organizationId || template.organizationId === organizationId));
  }

  private audit(organizationId: string, actorId: string, action: string, templateId: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "AgentTemplate", entityId: templateId, metadata: { templateAction: action, ...metadata } });
  }
}

function gate(condition: boolean, checkName: string, message: string): Omit<StoredAgentTemplateQualityCheck, "id" | "checkId" | "templateId" | "organizationId" | "createdAt"> {
  return { checkName, status: condition ? "passed" : "failed", message };
}

function bumpPatch(version: string) {
  const [major = "1", minor = "0", patch = "0"] = version.split(".");
  return `${major}.${minor}.${Number(patch) + 1}`;
}

function nextMonth() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const agentTemplateService = new AgentTemplateService();
