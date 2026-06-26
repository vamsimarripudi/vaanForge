import { z } from "zod";
import {
  createId,
  store,
  type StoredVFormixAgentConfig,
  type StoredVFormixAgentFieldMapping,
  type StoredVFormixAgentStatus,
  type StoredVFormixAgentSubmissionLink,
  type StoredVFormixAgentTrigger
} from "../../database/in-memory-store";
import { env } from "../../config/env";
import { auditService } from "../audit/audit.service";
import { agentTemplateService } from "../vaanforge/agent-template.service";
import { vaanForgeExecutionService } from "../vaanforge/vaanforge-execution.service";
import { vaanForgeService } from "../vaanforge/vaanforge.service";

export const vformixAgentConfigSchema = z.object({
  enabled: z.boolean().default(false),
  defaultTemplateId: z.string().optional(),
  ownerId: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
  dueDate: z.string().optional(),
  status: z.enum(["draft", "active", "paused"]).default("draft")
});

export const vformixFieldMappingSchema = z.object({
  mappings: z.array(
    z.object({
      formFieldKey: z.string().min(1),
      agentFieldPath: z.string().min(2),
      required: z.boolean().default(false),
      normalizer: z.enum(["text", "slug", "list", "date", "priority"]).default("text"),
      fallbackValue: z.string().optional()
    })
  )
});

export const vformixTriggerSchema = z.object({
  triggers: z.array(
    z.object({
      triggerType: z.enum(["submission", "manual", "approval", "template_selection"]),
      enabled: z.boolean().default(false),
      requiresApproval: z.boolean().default(true)
    })
  )
});

export const vformixRunSchema = z.object({
  formId: z.string().optional(),
  rawSubmission: z.record(z.unknown()).optional(),
  triggerType: z.enum(["submission", "manual", "approval", "template_selection"]).default("manual"),
  allowDuplicate: z.boolean().default(false),
  startCodingAfterBlueprint: z.boolean().default(false)
});

export const vformixWebhookSchema = z.object({
  organizationId: z.string().min(2),
  formId: z.string().min(1),
  submissionId: z.string().min(1),
  eventType: z.string().default("submission.created"),
  rawSubmission: z.record(z.unknown())
});

export class VFormixAgentService {
  async getConfig(organizationId: string, formId: string) {
    return this.ensureConfig(organizationId, formId);
  }

  async updateConfig(organizationId: string, actorId: string, formId: string, input: z.infer<typeof vformixAgentConfigSchema>) {
    const parsed = vformixAgentConfigSchema.parse(input);
    const config = this.ensureConfig(organizationId, formId);
    Object.assign(config, parsed, {
      nextAction: parsed.enabled ? "Review field mappings and trigger rules." : "Enable the agent when this form is ready.",
      updatedAt: new Date().toISOString()
    });
    this.activity(config, config.status, "Agent form configuration updated.");
    await this.audit(organizationId, actorId, "VFORMIX_AGENT_CONFIG_UPDATED", formId, { enabled: config.enabled, defaultTemplateId: config.defaultTemplateId });
    return config;
  }

  async getMapping(organizationId: string, formId: string) {
    this.ensureConfig(organizationId, formId);
    return store.vformixAgentFieldMappings.filter((mapping) => mapping.organizationId === organizationId && mapping.formId === formId);
  }

  async updateMapping(organizationId: string, actorId: string, formId: string, input: z.infer<typeof vformixFieldMappingSchema>) {
    const parsed = vformixFieldMappingSchema.parse(input);
    const now = new Date().toISOString();
    store.vformixAgentFieldMappings = store.vformixAgentFieldMappings.filter((mapping) => !(mapping.organizationId === organizationId && mapping.formId === formId));
    const mappings: StoredVFormixAgentFieldMapping[] = parsed.mappings.map((mapping) => ({
      id: createId("vfm"),
      mappingId: createId("mapping"),
      organizationId,
      formId,
      ...mapping,
      createdAt: now,
      updatedAt: now
    }));
    store.vformixAgentFieldMappings.push(...mappings);
    await this.audit(organizationId, actorId, "VFORMIX_AGENT_MAPPING_UPDATED", formId, { mappingCount: mappings.length });
    return mappings;
  }

  async getTriggers(organizationId: string, formId: string) {
    this.ensureConfig(organizationId, formId);
    this.ensureTriggers(organizationId, formId);
    return store.vformixAgentTriggers.filter((trigger) => trigger.organizationId === organizationId && trigger.formId === formId);
  }

  async updateTriggers(organizationId: string, actorId: string, formId: string, input: z.infer<typeof vformixTriggerSchema>) {
    const parsed = vformixTriggerSchema.parse(input);
    const now = new Date().toISOString();
    store.vformixAgentTriggers = store.vformixAgentTriggers.filter((trigger) => !(trigger.organizationId === organizationId && trigger.formId === formId));
    const triggers: StoredVFormixAgentTrigger[] = parsed.triggers.map((trigger) => ({
      id: createId("vft"),
      triggerId: createId("trigger"),
      organizationId,
      formId,
      ...trigger,
      createdAt: now,
      updatedAt: now
    }));
    store.vformixAgentTriggers.push(...triggers);
    await this.audit(organizationId, actorId, "VFORMIX_AGENT_TRIGGERS_UPDATED", formId, { triggerCount: triggers.length });
    return triggers;
  }

  async status(organizationId: string, submissionId: string) {
    const link = store.vformixAgentSubmissionLinks.find((item) => item.organizationId === organizationId && item.submissionId === submissionId);
    if (!link) return undefined;
    return {
      ...link,
      mappingErrors: store.vformixAgentMappingErrors.filter((error) => error.organizationId === organizationId && error.submissionId === submissionId)
    };
  }

  async runFromSubmission(input: {
    organizationId: string;
    actorId: string;
    formId: string;
    submissionId: string;
    rawSubmission: Record<string, unknown>;
    triggerType: "submission" | "manual" | "approval" | "template_selection";
    allowDuplicate?: boolean;
    startCodingAfterBlueprint?: boolean;
  }) {
    const config = this.ensureConfig(input.organizationId, input.formId);
    const trigger = (await this.getTriggers(input.organizationId, input.formId)).find((item) => item.triggerType === input.triggerType);
    if (!config.enabled && input.triggerType !== "manual") {
      return this.blockedLink(input, config, "failed", "Agent is not enabled for this form.", "Enable the agent toggle before automatic triggers run.");
    }
    if (trigger && !trigger.enabled && input.triggerType !== "manual") {
      return this.blockedLink(input, config, "blocked", `${input.triggerType} trigger is disabled.`, "Enable the trigger rule or run manually.");
    }
    const existing = store.vformixAgentSubmissionLinks.find((link) => link.organizationId === input.organizationId && link.submissionId === input.submissionId && link.runId);
    if (existing && !input.allowDuplicate) {
      return this.blockedLink(input, config, "blocked", "Submission already has a linked agent run.", "Manual approval is required before creating another run.");
    }

    const link = this.upsertLink(input, config, "mapping", "Map VFormix submission fields into VaanForge requirements.");
    const { cleaned, missing, errors } = this.mapSubmission(input.organizationId, input.formId, input.rawSubmission, config, input.submissionId);
    link.cleanedAgentInput = cleaned;
    link.missingFields = missing;
    link.status = "validating";
    link.nextAction = missing.length ? "Fix missing required mapped fields before running the agent." : "Detect project type and select a template.";
    this.activity(link, link.status, "Submission mapping completed.");
    if (errors.length || missing.length) {
      link.status = "failed";
      link.errorMessage = missing.length ? `Missing required fields: ${missing.join(", ")}` : "Mapping failed.";
      link.nextAction = "Update field mapping or resubmit with required values.";
      return link;
    }

    const template = await this.recommendTemplate(input.organizationId, config.defaultTemplateId, cleaned);
    if (template) {
      link.templateId = template.templateId;
      link.templateMatchReason = `Matched ${template.name} from project type and category signals.`;
      link.status = "template_matched";
      link.nextAction = "Generate blueprint from matched template.";
      this.activity(link, link.status, link.templateMatchReason);
    }

    const run = template
      ? await agentTemplateService.use(input.organizationId, input.actorId, template.templateId, this.templateValues(cleaned, config))
      : await vaanForgeService.submit({ organizationId: input.organizationId, requestedById: input.actorId, requirement: cleaned });
    link.runId = run?.runId;
    link.status = run?.status === "completed" ? "blueprint_generated" : "failed";
    link.nextAction = run?.status === "completed" ? "Admin approval is required before Coding Agent execution." : "Review blueprint generation failure.";
    this.activity(link, link.status, link.nextAction);

    if (run?.runId && input.startCodingAfterBlueprint) {
      const execution = await vaanForgeExecutionService.submit({ organizationId: input.organizationId, requestedById: input.actorId, phaseOneRunId: run.runId });
      link.executionId = execution?.executionId;
      link.status = execution?.status === "completed" ? "completed" : "coding_started";
      link.nextAction = execution?.status === "completed" ? "Coding execution completed." : "Monitor Coding Agent execution.";
    }

    await this.audit(input.organizationId, input.actorId, "VFORMIX_AGENT_RUN_TRIGGERED", input.submissionId, { formId: input.formId, runId: link.runId, templateId: link.templateId });
    return link;
  }

  verifyWebhookToken(token?: string) {
    return Boolean(token && token === env.vformixAgentWebhookToken);
  }

  logWebhook(input: { organizationId?: string; formId?: string; submissionId?: string; eventType: string; status: "accepted" | "rejected" | "failed"; reason?: string }) {
    store.vformixAgentWebhookLogs.push({ id: createId("vfw"), webhookId: createId("webhook"), createdAt: new Date().toISOString(), ...input });
  }

  private mapSubmission(organizationId: string, formId: string, raw: Record<string, unknown>, config: StoredVFormixAgentConfig, submissionId: string) {
    const mappings = store.vformixAgentFieldMappings.filter((mapping) => mapping.organizationId === organizationId && mapping.formId === formId);
    const cleaned = this.defaultRequirement(config, formId, submissionId);
    const missing: string[] = [];
    const errors: string[] = [];
    store.vformixAgentMappingErrors = store.vformixAgentMappingErrors.filter((error) => !(error.organizationId === organizationId && error.submissionId === submissionId));
    for (const mapping of mappings) {
      const rawValue = raw[mapping.formFieldKey] ?? mapping.fallbackValue;
      if (mapping.required && (rawValue === undefined || rawValue === null || String(rawValue).trim() === "")) {
        missing.push(mapping.formFieldKey);
        this.mappingError(organizationId, formId, submissionId, mapping.formFieldKey, "Required mapped field is missing.", "Collect the field in VFormix or mark it optional.");
        continue;
      }
      if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "") {
        try {
          setPath(cleaned, mapping.agentFieldPath, normalizeValue(rawValue, mapping.normalizer));
        } catch (error) {
          errors.push(mapping.formFieldKey);
          this.mappingError(organizationId, formId, submissionId, mapping.formFieldKey, error instanceof Error ? error.message : "Mapping failed.", "Fix the field mapping path or normalizer.");
        }
      }
    }
    const requiredPaths = ["productName", "productSlug", "ownerId", "priority", "dueDate", "businessContext.problemStatement", "businessContext.targetUsers", "businessContext.goals", "scope.coreFeatures"];
    for (const path of requiredPaths) {
      if (isEmptyPath(cleaned, path)) missing.push(path);
    }
    return { cleaned, missing: Array.from(new Set(missing)), errors };
  }

  private async recommendTemplate(organizationId: string, defaultTemplateId: string | undefined, requirement: Record<string, unknown>) {
    const marketplace = await agentTemplateService.marketplace(organizationId);
    const fallback = marketplace.find((template) => template.templateId === defaultTemplateId);
    if (fallback) return fallback;
    const haystack = JSON.stringify(requirement).toLowerCase();
    return marketplace.find((template) => haystack.includes(template.category.toLowerCase()) || haystack.includes(template.slug.replace(/-/g, " "))) || marketplace[0];
  }

  private templateValues(requirement: Record<string, unknown>, config: StoredVFormixAgentConfig) {
    return {
      productName: String(requirement.productName),
      targetUsers: ((requirement.businessContext as Record<string, unknown>).targetUsers as string[]) || ["Admin"],
      primaryGoal: (((requirement.businessContext as Record<string, unknown>).goals as string[]) || ["Generate project blueprint"])[0],
      ownerId: String(requirement.ownerId || config.ownerId),
      dueDate: String(requirement.dueDate || config.dueDate)
    };
  }

  private defaultRequirement(config: StoredVFormixAgentConfig, formId: string, submissionId: string): Record<string, unknown> {
    return {
      source: "VFORMIX",
      requestId: `vformix:${formId}:${submissionId}`,
      ownerId: config.ownerId,
      priority: config.priority,
      dueDate: config.dueDate || nextMonth(),
      businessContext: { targetUsers: ["Admin"], goals: ["Convert VFormix submission into an approved build plan."], successMetrics: ["Blueprint generated", "Admin approval captured"] },
      scope: { coreFeatures: [] },
      constraints: {
        approvedArchitecture: "VMNexus approved architecture",
        designSystem: "VMNexus design system",
        routing: ["/admin/agent", "/admin/vformix"],
        permissions: ["audit:read", "workspace:create"]
      },
      integrations: ["VFormix", "VaanForge"],
      nonFunctionalRequirements: ["Input sanitization", "Role-based permissions", "Audit logs"]
    };
  }

  private blockedLink(input: { organizationId: string; actorId: string; formId: string; submissionId: string; rawSubmission: Record<string, unknown> }, config: StoredVFormixAgentConfig, status: StoredVFormixAgentStatus, errorMessage: string, nextAction: string) {
    const link = this.upsertLink(input, config, status, nextAction);
    link.errorMessage = errorMessage;
    this.activity(link, status, errorMessage);
    return link;
  }

  private upsertLink(input: { organizationId: string; actorId: string; formId: string; submissionId: string; rawSubmission: Record<string, unknown> }, config: StoredVFormixAgentConfig, status: StoredVFormixAgentStatus, nextAction: string) {
    const now = new Date().toISOString();
    let link = store.vformixAgentSubmissionLinks.find((item) => item.organizationId === input.organizationId && item.submissionId === input.submissionId && !item.runId);
    if (!link) {
      link = {
        id: createId("vfl"),
        linkId: createId("link"),
        organizationId: input.organizationId,
        formId: input.formId,
        submissionId: input.submissionId,
        rawSubmission: sanitizeRecord(input.rawSubmission),
        status,
        missingFields: [],
        ownerId: config.ownerId,
        priority: config.priority,
        dueDate: config.dueDate || nextMonth(),
        nextAction,
        activityHistory: [],
        createdAt: now,
        updatedAt: now
      };
      store.vformixAgentSubmissionLinks.push(link);
    }
    link.rawSubmission = sanitizeRecord(input.rawSubmission);
    link.status = status;
    link.nextAction = nextAction;
    link.updatedAt = now;
    return link;
  }

  private ensureConfig(organizationId: string, formId: string) {
    let config = store.vformixAgentConfigs.find((item) => item.organizationId === organizationId && item.formId === formId);
    if (!config) {
      const now = new Date().toISOString();
      config = {
        id: createId("vfc"),
        configId: createId("config"),
        organizationId,
        formId,
        enabled: false,
        ownerId: "admin",
        priority: "HIGH",
        status: "draft",
        nextAction: "Enable the agent and define field mappings.",
        activityHistory: [{ at: now, status: "draft", message: "VFormix agent config created." }],
        createdAt: now,
        updatedAt: now
      };
      store.vformixAgentConfigs.push(config);
      this.ensureTriggers(organizationId, formId);
    }
    return config;
  }

  private ensureTriggers(organizationId: string, formId: string) {
    const existing = store.vformixAgentTriggers.filter((trigger) => trigger.organizationId === organizationId && trigger.formId === formId);
    const now = new Date().toISOString();
    for (const triggerType of ["submission", "manual", "approval", "template_selection"] as const) {
      if (!existing.some((trigger) => trigger.triggerType === triggerType)) {
        store.vformixAgentTriggers.push({ id: createId("vft"), triggerId: createId("trigger"), organizationId, formId, triggerType, enabled: triggerType === "manual", requiresApproval: triggerType !== "manual", createdAt: now, updatedAt: now });
      }
    }
  }

  private mappingError(organizationId: string, formId: string, submissionId: string, fieldKey: string, reason: string, nextAction: string) {
    store.vformixAgentMappingErrors.push({ id: createId("vfe"), errorId: createId("error"), organizationId, formId, submissionId, fieldKey, reason, nextAction, status: "open", createdAt: new Date().toISOString() });
  }

  private activity(record: { activityHistory: Array<Record<string, unknown>>; updatedAt?: string }, status: string, message: string) {
    const at = new Date().toISOString();
    record.activityHistory.push({ at, status, message });
    record.updatedAt = at;
  }

  private async audit(organizationId: string, actorId: string, action: string, entityId: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "VFormixAgentIntegration", entityId, metadata: { vformixAction: action, ...metadata } });
  }
}

function normalizeValue(value: unknown, normalizer: StoredVFormixAgentFieldMapping["normalizer"]) {
  const sanitized = sanitizeValue(value);
  if (normalizer === "list") return Array.isArray(sanitized) ? sanitized.filter(Boolean) : String(sanitized).split(",").map((item) => item.trim()).filter(Boolean);
  if (normalizer === "slug") return String(sanitized).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (normalizer === "date") return Number.isNaN(Date.parse(String(sanitized))) ? nextMonth() : new Date(String(sanitized)).toISOString();
  if (normalizer === "priority") {
    const priority = String(sanitized).toUpperCase();
    return ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "HIGH";
  }
  return sanitized;
}

function sanitizeRecord(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, sanitizeValue(value)]));
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeRecord(value as Record<string, unknown>);
  if (typeof value !== "string") return value;
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/ignore previous instructions/gi, "[removed]")
    .replace(/system prompt/gi, "[removed]")
    .replace(/developer message/gi, "[removed]")
    .trim();
}

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

function isEmptyPath(target: Record<string, unknown>, path: string) {
  const value = path.split(".").reduce<unknown>((cursor, part) => (cursor && typeof cursor === "object" ? (cursor as Record<string, unknown>)[part] : undefined), target);
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function nextMonth() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

export const vformixAgentService = new VFormixAgentService();
