import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { createId, store, type StoredAgentMemoryEntry } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { planConfigurationService } from "../billing/plan-configuration.service";

export type CompletionActor = {
  organizationId: string;
  userId: string;
  role: string;
};

type Status = "pending" | "running" | "completed" | "blocked" | "failed";

type ProofRecord = {
  id: string;
  proofId: string;
  organizationId: string;
  workspaceId?: string;
  eventType: string;
  entityType: string;
  entityId: string;
  contentHash: string;
  provider: "local-ledger" | "blockchain-adapter";
  providerReference?: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type QueueJob = {
  id: string;
  jobId: string;
  organizationId: string;
  queueName: string;
  status: Status;
  idempotencyKey: string;
  retryPolicy: { attempts: number; backoffMs: number };
  timeoutMs: number;
  logs: Array<{ at: string; level: "info" | "warn" | "error"; message: string }>;
  correlationId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type MlScore = {
  id: string;
  scoreId: string;
  organizationId: string;
  scoreType: string;
  score: number;
  confidence: number;
  reasons: string[];
  engine: "deterministic-heuristic";
  inputHash: string;
  createdAt: string;
};

const proofRecords: ProofRecord[] = [];
const queueJobs: QueueJob[] = [];
const mlScores: MlScore[] = [];

export const proofRecordSchema = z.object({
  eventType: z.enum(["blueprint.approved", "code.generated", "deployment.released", "invoice.issued", "marketplace_app.published"]),
  entityType: z.string().min(2),
  entityId: z.string().min(2),
  contentHash: z.string().min(16).optional(),
  metadata: z.record(z.unknown()).default({})
});

const textInputSchema = z.object({
  text: z.string().min(2).max(20000),
  context: z.record(z.unknown()).default({})
});

const projectEstimateSchema = z.object({
  productType: z.string().min(2),
  features: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  deploymentTarget: z.string().optional()
});

const memorySchema = z.object({
  type: z.string().min(2).default("project_pattern"),
  title: z.string().min(2),
  content: z.string().min(4),
  source: z.string().min(2),
  confidence: z.number().min(0).max(1).default(0.5),
  sensitivityLevel: z.enum(["public", "internal", "confidential"]).default("internal"),
  tags: z.array(z.string()).default([])
});

const queueNames = [
  "ai.generation",
  "blueprint.generation",
  "code.generation",
  "qa.validation",
  "security.review",
  "deployment.jobs",
  "billing.webhooks",
  "notifications.email",
  "files.processing",
  "embeddings.generation",
  "ml.scoring",
  "reports.exports",
  "proof.ledger"
] as const;

export class EnterpriseCompletionService {
  plans() {
    return planConfigurationService.billingPlanSeeds().map((plan) => ({
      planId: plan.planId,
      tier: plan.tier,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      creditsIncluded: plan.creditsIncluded,
      limits: plan.limits,
      features: plan.features,
      status: plan.status
    }));
  }

  projects(actor: CompletionActor, query: Record<string, unknown>) {
    const search = typeof query.search === "string" ? query.search.toLowerCase() : undefined;
    const projects = store.projects
      .filter((project) => project.organizationId === actor.organizationId)
      .filter((project) => !search || project.name.toLowerCase().includes(search))
      .map((project) => ({ ...project, status: "active", nextAction: "Continue project workflow." }));
    return { data: projects, meta: { total: projects.length, page: 1, pageSize: projects.length || 20 } };
  }

  createProject(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      workspaceId: z.string().optional(),
      dueDate: z.string().optional()
    }).parse(input);
    this.enforceFreeProjectLimit(actor);
    const now = new Date().toISOString();
    const project = {
      id: createId("prj"),
      organizationId: actor.organizationId,
      name: sanitize(parsed.name),
      description: parsed.description ? sanitize(parsed.description) : undefined,
      ownerId: actor.userId,
      dueDate: parsed.dueDate,
      createdAt: now
    };
    store.projects.push(project);
    this.audit(actor, "PROJECT_CREATED", "Project", project.id, { workspaceId: parsed.workspaceId });
    return { ...project, status: "active", nextAction: "Complete requirement intake." };
  }

  project(actor: CompletionActor, projectId: string) {
    const project = store.projects.find((item) => item.organizationId === actor.organizationId && item.id === projectId);
    if (!project) return undefined;
    return {
      ...project,
      activity: store.tasks.filter((task) => task.organizationId === actor.organizationId && task.projectId === projectId),
      usage: this.usage(actor),
      nextAction: "Continue the approved workflow."
    };
  }

  updateProject(actor: CompletionActor, projectId: string, input: Record<string, unknown>) {
    const project = store.projects.find((item) => item.organizationId === actor.organizationId && item.id === projectId);
    if (!project) return undefined;
    const parsed = z.object({ name: z.string().min(2).optional(), description: z.string().optional(), dueDate: z.string().optional() }).parse(input);
    Object.assign(project, parsed.name ? { name: sanitize(parsed.name) } : {}, parsed.description !== undefined ? { description: sanitize(parsed.description) } : {}, parsed.dueDate ? { dueDate: parsed.dueDate } : {});
    this.audit(actor, "PROJECT_UPDATED", "Project", project.id, parsed);
    return this.project(actor, projectId);
  }

  archiveProject(actor: CompletionActor, projectId: string) {
    const project = this.project(actor, projectId);
    if (!project) return undefined;
    this.audit(actor, "PROJECT_ARCHIVED", "Project", projectId, {});
    return { ...project, status: "archived", nextAction: "Restore project if active work should resume." };
  }

  usage(actor: CompletionActor) {
    const plan = this.currentPlan(actor.organizationId);
    const activeProjects = store.projects.filter((project) => project.organizationId === actor.organizationId).length + store.factoryProjects.filter((project) => project.organizationId === actor.organizationId).length;
    return {
      plan: plan.name,
      limits: plan.limits,
      usage: {
        agent_run: activeProjects,
        ai_credit: store.customerUsageEvents.filter((event) => event.organizationId === actor.organizationId && event.metric === "ai_credit").reduce((sum, event) => sum + event.quantity, 0),
        deployment: store.agentDeployments.filter((deployment) => deployment.organizationId === actor.organizationId).length,
        storage_mb: store.agentFiles.filter((file) => file.organizationId === actor.organizationId).length
      },
      nextAction: activeProjects >= plan.limits.agent_run ? "Upgrade plan or archive an active project." : "Usage is within current plan limits."
    };
  }

  analyzeRequirements(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = textInputSchema.parse(input);
    return this.score(actor, "requirements.quality", parsed.text, [
      ["roles", /role|admin|user|customer/i],
      ["features", /feature|workflow|screen|api/i],
      ["data", /data|database|model|schema/i],
      ["security", /auth|permission|security|tenant/i],
      ["deployment", /deploy|hosting|cloud|server/i]
    ]);
  }

  scoreComplexity(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = projectEstimateSchema.parse(input);
    const raw = parsed.features.length * 8 + parsed.integrations.length * 10 + parsed.roles.length * 5 + (parsed.deploymentTarget ? 8 : 0);
    return this.persistMlScore(actor, "project.complexity", Math.min(100, 20 + raw), ["Feature count", "Integration count", "Role count", "Deployment target"], parsed);
  }

  estimateProject(actor: CompletionActor, input: Record<string, unknown>) {
    const complexity = this.scoreComplexity(actor, input);
    const weeks = Math.max(2, Math.ceil(complexity.score / 18));
    return { ...complexity, estimate: { weeks, aiCredits: complexity.score * 100, recommendedPlan: complexity.score > 75 ? "Business" : complexity.score > 50 ? "Professional" : "Creator" } };
  }

  recommendTemplate(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = projectEstimateSchema.parse(input);
    const apps = store.agentTemplates.filter((template) => template.organizationId === actor.organizationId || template.status === "published");
    return {
      selectedBecause: ["Product type similarity", "Feature overlap", "Published approval status"],
      templates: apps.slice(0, 5),
      fallback: apps.length ? undefined : { reason: "No approved templates available for this tenant.", nextAction: "Create and approve a reusable template before marketplace recommendation." },
      input: parsed
    };
  }

  classifyError(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = textInputSchema.parse(input);
    const text = parsed.text.toLowerCase();
    const type = text.includes("permission") ? "authorization" : text.includes("timeout") ? "timeout" : text.includes("syntax") ? "syntax" : "general";
    return this.persistMlScore(actor, "error.classification", type === "general" ? 50 : 82, [`Classified as ${type}`], { type, ...parsed });
  }

  detectAnomaly(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = textInputSchema.parse(input);
    const score = /spike|failed|error|latency|timeout|unauthorized/i.test(parsed.text) ? 78 : 24;
    return this.persistMlScore(actor, "anomaly.detect", score, score > 60 ? ["Operational risk terms detected"] : ["No high-risk terms detected"], parsed);
  }

  memory(actor: CompletionActor) {
    return store.agentMemoryEntries.filter((entry) => entry.organizationId === actor.organizationId);
  }

  createMemory(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = memorySchema.parse(input);
    if (containsSecret(parsed.content)) throw new Error("Memory content contains secret-like data.");
    const now = new Date().toISOString();
    const entry: StoredAgentMemoryEntry = {
      id: createId("ame"),
      memoryId: createId("memory"),
      organizationId: actor.organizationId,
      memoryType: memoryType(parsed.type),
      title: sanitize(parsed.title),
      content: sanitize(parsed.content),
      summary: sanitize(parsed.content).slice(0, 180),
      confidenceScore: parsed.confidence,
      tags: parsed.tags,
      status: "pending_review",
      trustLevel: "untrusted",
      ownerId: actor.userId,
      priority: "MEDIUM",
      dueDate: inDays(30),
      nextAction: "Review memory before it can influence future runs.",
      activityHistory: [{ at: now, status: "pending_review", message: `Created from ${parsed.source}. Sensitivity: ${parsed.sensitivityLevel}.` }],
      createdAt: now,
      updatedAt: now
    };
    store.agentMemoryEntries.push(entry);
    store.agentMemorySources.push({
      id: createId("ams"),
      sourceId: createId("source"),
      memoryId: entry.memoryId,
      organizationId: actor.organizationId,
      sourceType: "manual",
      sourceRef: parsed.source,
      evidence: { sensitivityLevel: parsed.sensitivityLevel },
      createdAt: now
    });
    this.audit(actor, "MEMORY_CREATED", "AgentMemoryEntry", entry.memoryId, { source: parsed.source });
    return entry;
  }

  updateMemory(actor: CompletionActor, memoryId: string, input: Record<string, unknown>) {
    const entry = store.agentMemoryEntries.find((item) => item.organizationId === actor.organizationId && item.memoryId === memoryId);
    if (!entry) return undefined;
    Object.assign(entry, input, { updatedAt: new Date().toISOString() });
    this.audit(actor, "MEMORY_UPDATED", "AgentMemoryEntry", memoryId, {});
    return entry;
  }

  reviewMemory(actor: CompletionActor, memoryId: string, decision: "approved" | "rejected") {
    const entry = store.agentMemoryEntries.find((item) => item.organizationId === actor.organizationId && item.memoryId === memoryId);
    if (!entry) return undefined;
    Object.assign(entry, { status: decision, trustLevel: decision === "approved" ? "trusted" : "untrusted", updatedAt: new Date().toISOString() });
    store.agentMemoryReviews.push({
      id: createId("amr"),
      reviewId: createId("review"),
      memoryId,
      organizationId: actor.organizationId,
      reviewerId: actor.userId,
      decision,
      createdAt: new Date().toISOString()
    });
    this.audit(actor, `MEMORY_${decision.toUpperCase()}`, "AgentMemoryEntry", memoryId, {});
    return entry;
  }

  knowledgeSearch(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = z.object({ query: z.string().min(2), limit: z.coerce.number().min(1).max(25).default(10) }).parse(input);
    const query = parsed.query.toLowerCase();
    const entries = [
      ...store.agentKnowledgeEntries.filter((entry) => entry.organizationId === actor.organizationId),
      ...store.agentMemoryEntries.filter((entry) => entry.organizationId === actor.organizationId && entry.status === "approved")
    ].filter((entry) => JSON.stringify(entry).toLowerCase().includes(query)).slice(0, parsed.limit);
    return { entries, whySelected: "Matched approved, tenant-scoped memory or knowledge text.", query: parsed.query };
  }

  createProof(actor: CompletionActor, input: Record<string, unknown>) {
    const parsed = proofRecordSchema.parse(input);
    const now = new Date().toISOString();
    const contentHash = parsed.contentHash || sha256(JSON.stringify({ eventType: parsed.eventType, entityType: parsed.entityType, entityId: parsed.entityId, metadata: parsed.metadata }));
    const record: ProofRecord = {
      id: createId("prf"),
      proofId: createId("proof"),
      organizationId: actor.organizationId,
      eventType: parsed.eventType,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      contentHash,
      provider: process.env.BLOCKCHAIN_PROVIDER ? "blockchain-adapter" : "local-ledger",
      providerReference: process.env.BLOCKCHAIN_PROVIDER ? undefined : "local-provider-not-configured",
      metadata: maskSecrets(parsed.metadata),
      createdBy: actor.userId,
      createdAt: now,
      updatedAt: now
    };
    proofRecords.push(record);
    this.enqueue(actor, "proof.ledger", { proofId: record.proofId }, record.proofId);
    this.audit(actor, "PROOF_CREATED", "ProofRecord", record.proofId, { provider: record.provider });
    return record;
  }

  proofRecords(actor: CompletionActor) {
    return proofRecords.filter((record) => record.organizationId === actor.organizationId);
  }

  verifyProof(actor: CompletionActor, proofId: string) {
    const proof = proofRecords.find((record) => record.organizationId === actor.organizationId && record.proofId === proofId);
    if (!proof) return undefined;
    return { proofId, valid: /^[a-f0-9]{64}$/i.test(proof.contentHash), provider: proof.provider, contentHash: proof.contentHash };
  }

  queues(actor: CompletionActor) {
    return {
      queues: queueNames.map((queueName) => {
        const jobs = queueJobs.filter((job) => job.organizationId === actor.organizationId && job.queueName === queueName);
        return { queueName, pending: jobs.filter((job) => job.status === "pending").length, failed: jobs.filter((job) => job.status === "failed").length, total: jobs.length };
      }),
      jobs: queueJobs.filter((job) => job.organizationId === actor.organizationId).slice(-100)
    };
  }

  enqueue(actor: CompletionActor, queueName: (typeof queueNames)[number], payload: Record<string, unknown>, idempotencyKey = createId("idem")) {
    const existing = queueJobs.find((job) => job.organizationId === actor.organizationId && job.queueName === queueName && job.idempotencyKey === idempotencyKey);
    if (existing) return existing;
    const now = new Date().toISOString();
    const job: QueueJob = {
      id: createId("qjb"),
      jobId: createId("job"),
      organizationId: actor.organizationId,
      queueName,
      status: "pending",
      idempotencyKey,
      retryPolicy: { attempts: 3, backoffMs: 30000 },
      timeoutMs: 300000,
      logs: [{ at: now, level: "info", message: "Job accepted." }],
      correlationId: createId("corr"),
      payload: maskSecrets(payload),
      createdAt: now,
      updatedAt: now
    };
    queueJobs.push(job);
    return job;
  }

  private score(actor: CompletionActor, scoreType: string, text: string, checks: Array<[string, RegExp]>) {
    const matched = checks.filter(([, regex]) => regex.test(text)).map(([label]) => label);
    const score = Math.round((matched.length / checks.length) * 100);
    return this.persistMlScore(actor, scoreType, score, matched.length ? matched.map((item) => `${item} signal present`) : ["Insufficient requirement signals"], { text });
  }

  private persistMlScore(actor: CompletionActor, scoreType: string, score: number, reasons: string[], input: unknown) {
    const record: MlScore = {
      id: createId("mls"),
      scoreId: createId("score"),
      organizationId: actor.organizationId,
      scoreType,
      score,
      confidence: Math.min(0.95, Math.max(0.35, score / 100)),
      reasons,
      engine: "deterministic-heuristic",
      inputHash: sha256(JSON.stringify(input)),
      createdAt: new Date().toISOString()
    };
    mlScores.push(record);
    this.enqueue(actor, "ml.scoring", { scoreId: record.scoreId, scoreType }, record.scoreId);
    return record;
  }

  private currentPlan(organizationId: string) {
    const subscription = store.customerSubscriptions.find((item) => item.organizationId === organizationId && item.status === "active");
    return this.plans().find((plan) => plan.planId === subscription?.planId) || this.plans()[0];
  }

  private enforceFreeProjectLimit(actor: CompletionActor) {
    const plan = this.currentPlan(actor.organizationId);
    const activeProjects = store.projects.filter((project) => project.organizationId === actor.organizationId).length + store.factoryProjects.filter((project) => project.organizationId === actor.organizationId).length;
    if (activeProjects >= plan.limits.agent_run) {
      throw new Error(`Plan limit exceeded. ${plan.name} allows ${plan.limits.agent_run} active project(s).`);
    }
  }

  private audit(actor: CompletionActor, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "VAANFORGE_AGENT_RUN", entityType, entityId, metadata: { completionAction: action, ...maskSecrets(metadata) } });
  }
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function sanitize(value: string) {
  return value.replace(/<script/gi, "&lt;script").trim();
}

function containsSecret(value: string) {
  return /(sk-|api[_-]?key|secret|password|token=|-----BEGIN)/i.test(value);
}

function memoryType(value: string): "project" | "user_preference" | "product" | "error_fix" | "template_usage" | "deployment" | "approval" {
  const normalized = value.toLowerCase();
  if (normalized.includes("preference")) return "user_preference";
  if (normalized.includes("error") || normalized.includes("fix")) return "error_fix";
  if (normalized.includes("template")) return "template_usage";
  if (normalized.includes("deployment")) return "deployment";
  if (normalized.includes("approval")) return "approval";
  if (normalized.includes("product")) return "product";
  return "project";
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function maskSecrets<T>(value: T): T {
  return JSON.parse(JSON.stringify(value).replace(/(sk-|api[_-]?key|secret|password|token=)[^"',}\s]+/gi, "$1[MASKED]")) as T;
}

export function createEphemeralApiKey() {
  const raw = `vf_${randomBytes(24).toString("hex")}`;
  return { raw, hash: sha256(raw) };
}

export const enterpriseCompletionService = new EnterpriseCompletionService();
