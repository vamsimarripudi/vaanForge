import { z } from "zod";
import { createId, store, type StoredAgentKnowledgeEntry, type StoredAgentKnowledgeType, type StoredAgentMemoryEntry } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

export const memoryInputSchema = z.object({
  title: z.string().min(2),
  memoryType: z.enum(["project", "user_preference", "product", "error_fix", "template_usage", "deployment", "approval"]),
  content: z.string().min(8).max(5000),
  summary: z.string().min(4),
  tags: z.array(z.string()).default([]),
  confidenceScore: z.number().min(0).max(1),
  source: z.object({
    sourceType: z.enum(["project", "error", "fix", "template", "deployment", "approval", "manual"]),
    sourceRef: z.string().min(2),
    evidence: z.record(z.unknown()).default({})
  }),
  ownerId: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  retentionUntil: z.string().optional()
});

export const memoryPatchSchema = z.object({
  title: z.string().min(2).optional(),
  content: z.string().min(8).max(5000).optional(),
  summary: z.string().min(4).optional(),
  tags: z.array(z.string()).optional(),
  trustLevel: z.enum(["trusted", "untrusted"]).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  retentionUntil: z.string().optional()
});

export const memoryReviewSchema = z.object({
  reason: z.string().optional(),
  trustLevel: z.enum(["trusted", "untrusted"]).default("trusted")
});

export const knowledgeSearchSchema = z.object({
  query: z.string().min(2),
  tags: z.array(z.string()).default([]),
  knowledgeTypes: z.array(z.enum(["project_pattern", "architecture", "common_error", "verified_fix", "deployment_lesson", "security_rule", "design_rule"])).default([]),
  limit: z.number().min(1).max(20).default(8)
});

export class AgentMemoryService {
  async list(organizationId: string, includeArchived = false) {
    return store.agentMemoryEntries.filter((entry) => entry.organizationId === organizationId && (includeArchived || entry.status !== "archived")).map((entry) => this.withSources(entry));
  }

  async detail(organizationId: string, memoryId: string) {
    const entry = store.agentMemoryEntries.find((item) => item.organizationId === organizationId && item.memoryId === memoryId);
    return entry ? this.withSources(entry) : undefined;
  }

  async create(organizationId: string, actorId: string, input: z.infer<typeof memoryInputSchema>) {
    const parsed = memoryInputSchema.parse(input);
    const scanned = this.scan(`${parsed.title}\n${parsed.summary}\n${parsed.content}\n${JSON.stringify(parsed.source.evidence)}`);
    if (!scanned.safe) throw new Error(scanned.reason);
    const now = new Date().toISOString();
    const memory: StoredAgentMemoryEntry = {
      id: createId("ame"),
      memoryId: createId("memory"),
      organizationId,
      title: sanitize(parsed.title),
      memoryType: parsed.memoryType,
      content: sanitize(parsed.content),
      summary: sanitize(parsed.summary),
      tags: parsed.tags.map(normalizeTag),
      confidenceScore: parsed.confidenceScore,
      status: "pending_review",
      trustLevel: "untrusted",
      ownerId: parsed.ownerId,
      priority: parsed.priority,
      dueDate: parsed.dueDate || nextMonth(),
      nextAction: "Admin review required before memory can affect future runs.",
      activityHistory: [{ at: now, status: "pending_review", message: "Memory created and awaiting review." }],
      retentionUntil: parsed.retentionUntil,
      createdAt: now,
      updatedAt: now
    };
    store.agentMemoryEntries.push(memory);
    store.agentMemorySources.push({ id: createId("ams"), sourceId: createId("source"), memoryId: memory.memoryId, organizationId, sourceType: parsed.source.sourceType, sourceRef: parsed.source.sourceRef, evidence: parsed.source.evidence, createdAt: now });
    this.audit(organizationId, actorId, "MEMORY_CREATED", memory.memoryId, { memoryType: memory.memoryType, sourceRef: parsed.source.sourceRef });
    return this.withSources(memory);
  }

  async update(organizationId: string, actorId: string, memoryId: string, input: z.infer<typeof memoryPatchSchema>) {
    const memory = this.findMemory(organizationId, memoryId);
    if (!memory) return undefined;
    const scanned = this.scan(JSON.stringify(input));
    if (!scanned.safe) throw new Error(scanned.reason);
    Object.assign(memory, {
      ...input,
      title: input.title ? sanitize(input.title) : memory.title,
      content: input.content ? sanitize(input.content) : memory.content,
      summary: input.summary ? sanitize(input.summary) : memory.summary,
      tags: input.tags ? input.tags.map(normalizeTag) : memory.tags,
      updatedAt: new Date().toISOString(),
      nextAction: "Review updated memory before trust changes are used."
    });
    memory.activityHistory.push({ at: memory.updatedAt, status: memory.status, message: "Memory updated." });
    this.audit(organizationId, actorId, "MEMORY_UPDATED", memoryId);
    return this.withSources(memory);
  }

  async review(organizationId: string, actorId: string, memoryId: string, decision: "approved" | "rejected" | "archived", input: z.infer<typeof memoryReviewSchema>) {
    const memory = this.findMemory(organizationId, memoryId);
    if (!memory) return undefined;
    const now = new Date().toISOString();
    memory.status = decision === "approved" ? "approved" : decision;
    memory.trustLevel = decision === "approved" ? input.trustLevel : "untrusted";
    memory.nextAction = decision === "approved" ? "Memory is approved for retrieval." : decision === "archived" ? "Archived memory is excluded from retrieval." : "Rejected memory is excluded from future fixes.";
    memory.updatedAt = now;
    memory.activityHistory.push({ at: now, status: memory.status, message: input.reason || `Memory ${decision}.` });
    store.agentMemoryReviews.push({ id: createId("amr"), reviewId: createId("review"), memoryId, organizationId, reviewerId: actorId, decision, reason: input.reason, createdAt: now });
    if (decision === "approved" && memory.trustLevel === "trusted") this.promoteKnowledge(memory);
    this.audit(organizationId, actorId, `MEMORY_${decision.toUpperCase()}`, memoryId, { trustLevel: memory.trustLevel });
    return this.withSources(memory);
  }

  async knowledge(organizationId: string) {
    return store.agentKnowledgeEntries.filter((entry) => entry.organizationId === organizationId && entry.status === "active").map((entry) => this.withTags(entry));
  }

  async search(organizationId: string, actorId: string, input: z.infer<typeof knowledgeSearchSchema>) {
    const parsed = knowledgeSearchSchema.parse(input);
    const results = this.rank(organizationId, parsed.query, parsed.tags, parsed.knowledgeTypes).slice(0, parsed.limit);
    store.agentKnowledgeRetrievalLogs.push({ id: createId("akl"), retrievalId: createId("retrieval"), organizationId, actorId, query: parsed.query, selectedEntryIds: results.map((item) => item.entry.entryId), rationale: `Matched approved trusted knowledge by query/tags: ${parsed.query}`, createdAt: new Date().toISOString() });
    this.audit(organizationId, actorId, "KNOWLEDGE_SEARCHED", "knowledge-base", { query: parsed.query, selectedEntryIds: results.map((item) => item.entry.entryId) });
    return results.map((item) => ({ ...this.withTags(item.entry), score: item.score, whySelected: item.whySelected }));
  }

  async retrieve(organizationId: string, actorId: string, input: z.infer<typeof knowledgeSearchSchema>) {
    const suggestions = await this.search(organizationId, actorId, input);
    return {
      query: input.query,
      suggestions,
      errorFixes: store.agentErrorFixPatterns.filter((pattern) => pattern.organizationId === organizationId && !pattern.rejected && includesAny(`${pattern.errorSignature} ${pattern.fixSummary}`, input.query)).slice(0, 5),
      architecturePatterns: store.agentArchitecturePatterns.filter((pattern) => pattern.organizationId === organizationId && includesAny(`${pattern.architectureName} ${pattern.applicability}`, input.query)).slice(0, 5)
    };
  }

  private promoteKnowledge(memory: StoredAgentMemoryEntry) {
    if (store.agentKnowledgeEntries.some((entry) => entry.memoryId === memory.memoryId)) return;
    const type = knowledgeTypeFor(memory.memoryType, memory.tags);
    const now = new Date().toISOString();
    const entry: StoredAgentKnowledgeEntry = { id: createId("ake"), entryId: createId("knowledge"), organizationId: memory.organizationId, memoryId: memory.memoryId, title: memory.title, knowledgeType: type, content: memory.content, confidenceScore: memory.confidenceScore, trusted: true, status: "active", sourceRefs: store.agentMemorySources.filter((source) => source.memoryId === memory.memoryId).map((source) => source.sourceRef), createdAt: now, updatedAt: now };
    store.agentKnowledgeEntries.push(entry);
    for (const tag of memory.tags) store.agentKnowledgeTags.push({ id: createId("akt"), tagId: createId("tag"), entryId: entry.entryId, organizationId: memory.organizationId, tag, createdAt: now });
    if (memory.memoryType === "error_fix") store.agentErrorFixPatterns.push({ id: createId("aef"), patternId: createId("fix"), organizationId: memory.organizationId, memoryId: memory.memoryId, errorSignature: memory.title, fixSummary: memory.summary, rejected: false, confidenceScore: memory.confidenceScore, createdAt: now });
    if (type === "architecture") store.agentArchitecturePatterns.push({ id: createId("aap"), patternId: createId("arch"), organizationId: memory.organizationId, memoryId: memory.memoryId, architectureName: memory.title, applicability: memory.summary, securityNotes: memory.tags.filter((tag) => tag.includes("security")), confidenceScore: memory.confidenceScore, createdAt: now });
  }

  private rank(organizationId: string, query: string, tags: string[], types: StoredAgentKnowledgeType[]) {
    const terms = tokenize(query);
    return store.agentKnowledgeEntries
      .filter((entry) => entry.organizationId === organizationId && entry.status === "active" && entry.trusted && (!types.length || types.includes(entry.knowledgeType)))
      .map((entry) => {
        const entryTags = store.agentKnowledgeTags.filter((tag) => tag.entryId === entry.entryId).map((tag) => tag.tag);
        const text = `${entry.title} ${entry.content} ${entryTags.join(" ")}`.toLowerCase();
        const termMatches = terms.filter((term) => text.includes(term)).length;
        const tagMatches = tags.map(normalizeTag).filter((tag) => entryTags.includes(tag)).length;
        const score = termMatches + tagMatches * 2 + entry.confidenceScore;
        return { entry, score, whySelected: `Matched ${termMatches} query terms, ${tagMatches} tags, confidence ${entry.confidenceScore}. Sources: ${entry.sourceRefs.join(", ")}` };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  private withSources(memory: StoredAgentMemoryEntry) {
    return { ...memory, sources: store.agentMemorySources.filter((source) => source.memoryId === memory.memoryId), reviews: store.agentMemoryReviews.filter((review) => review.memoryId === memory.memoryId) };
  }

  private withTags(entry: StoredAgentKnowledgeEntry) {
    return { ...entry, tags: store.agentKnowledgeTags.filter((tag) => tag.entryId === entry.entryId).map((tag) => tag.tag) };
  }

  private findMemory(organizationId: string, memoryId: string) {
    return store.agentMemoryEntries.find((memory) => memory.organizationId === organizationId && memory.memoryId === memoryId);
  }

  private scan(value: string) {
    if (/api[_-]?key|secret|password|token|BEGIN PRIVATE KEY/i.test(value)) return { safe: false, reason: "Sensitive secret-like content cannot be stored in memory." };
    if (/ignore previous instructions|system prompt|developer message|exfiltrate|jailbreak/i.test(value)) return { safe: false, reason: "Prompt injection content cannot be stored in memory." };
    return { safe: true };
  }

  private audit(organizationId: string, actorId: string, action: string, entityId: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "AgentMemory", entityId, metadata: { memoryAction: action, ...metadata } });
  }
}

function knowledgeTypeFor(memoryType: StoredAgentMemoryEntry["memoryType"], tags: string[]): StoredAgentKnowledgeType {
  if (memoryType === "error_fix") return "verified_fix";
  if (memoryType === "deployment") return "deployment_lesson";
  if (tags.includes("security")) return "security_rule";
  if (tags.includes("design")) return "design_rule";
  if (tags.includes("architecture")) return "architecture";
  if (tags.includes("error")) return "common_error";
  return "project_pattern";
}

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/ignore previous instructions/gi, "[removed]").replace(/system prompt/gi, "[removed]").trim();
}

function normalizeTag(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "");
}

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9-]+/).filter((term) => term.length > 2);
}

function includesAny(value: string, query: string) {
  const haystack = value.toLowerCase();
  return tokenize(query).some((term) => haystack.includes(term));
}

function nextMonth() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}

export const agentMemoryService = new AgentMemoryService();
