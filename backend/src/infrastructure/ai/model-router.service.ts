import { createId, store } from "../../database/in-memory-store";

export type AiTaskType = "requirements" | "blueprint" | "architecture" | "code" | "qa" | "security" | "deployment" | "documentation" | "chat";
export type AiProviderName = "openai" | "gemini" | "claude" | "groq" | "hugging_face" | "local";

export interface ModelRouteRequest {
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  agentId?: string;
  userId: string;
  taskType: AiTaskType;
  planId?: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  safetyLevel: "standard" | "high";
  prompt: string;
}

export interface ModelRouteDecision {
  provider: AiProviderName;
  model: string;
  fallbackProviders: AiProviderName[];
  estimatedCredits: number;
  estimatedCost: number;
  promptRiskScore: number;
  allowed: boolean;
  blockedReason?: string;
  explanation: string;
  evidence: Record<string, unknown>;
}

export interface ModelHealthService {
  status(provider: AiProviderName): "healthy" | "degraded" | "not_configured" | "unavailable";
}

export interface ModelCostTracker {
  estimate(provider: AiProviderName, inputTokens: number, outputTokens: number): number;
}

export interface ModelFallbackService {
  fallbacks(provider: AiProviderName): AiProviderName[];
}

export interface ModelUsageMeter {
  estimateCredits(inputTokens: number, outputTokens: number, safetyLevel: "standard" | "high"): number;
  recordUsage(request: ModelRouteRequest, decision: ModelRouteDecision): void;
}

export interface PromptSafetyService {
  score(prompt: string): number;
}

export class StoreBackedModelHealthService implements ModelHealthService {
  status(provider: AiProviderName) {
    if (provider === "local") return "healthy" as const;
    const latest = [...store.providerHealthChecks].reverse().find((check) => check.provider === provider || check.provider === provider.replace("_", "-"));
    if (!latest) return "not_configured" as const;
    if (latest.status === "healthy") return "healthy" as const;
    if (latest.status === "not_configured" || latest.status === "missing_secret") return "not_configured" as const;
    if (latest.status === "unavailable" || latest.status === "invalid_credentials") return "unavailable" as const;
    return "degraded" as const;
  }
}

export class HeuristicModelCostTracker implements ModelCostTracker {
  private readonly perMillionTokens: Record<AiProviderName, number> = { openai: 5, gemini: 2.5, claude: 6, groq: 1.2, hugging_face: 1, local: 0 };

  estimate(provider: AiProviderName, inputTokens: number, outputTokens: number) {
    return Number((((inputTokens + outputTokens) / 1_000_000) * this.perMillionTokens[provider]).toFixed(6));
  }
}

export class OrderedModelFallbackService implements ModelFallbackService {
  fallbacks(provider: AiProviderName): AiProviderName[] {
    const order: AiProviderName[] = ["openai", "gemini", "claude", "groq", "hugging_face", "local"];
    return order.filter((item) => item !== provider);
  }
}

export class StoreBackedModelUsageMeter implements ModelUsageMeter {
  estimateCredits(inputTokens: number, outputTokens: number, safetyLevel: "standard" | "high") {
    const multiplier = safetyLevel === "high" ? 1.25 : 1;
    return Math.max(1, Math.ceil(((inputTokens + outputTokens) / 1000) * multiplier));
  }

  recordUsage(request: ModelRouteRequest, decision: ModelRouteDecision) {
    store.providerCostEvents.push({
      id: createId("provider_cost"),
      eventId: createId("provider_cost_event"),
      organizationId: request.organizationId,
      workspaceId: request.workspaceId,
      provider: decision.provider === "hugging_face" ? "hugging_face" : decision.provider === "local" ? "other" : decision.provider,
      requests: 1,
      inputTokens: request.estimatedInputTokens,
      outputTokens: request.estimatedOutputTokens,
      latencyMs: 0,
      errors: decision.allowed ? 0 : 1,
      estimatedCost: decision.estimatedCost,
      creditsConsumed: decision.allowed ? decision.estimatedCredits : 0,
      projectId: request.projectId,
      agentId: request.agentId,
      createdAt: new Date().toISOString()
    });
  }
}

export class HeuristicPromptSafetyService implements PromptSafetyService {
  score(prompt: string) {
    const patterns = [/ignore previous/i, /system prompt/i, /developer message/i, /api key/i, /private key/i, /token/i, /secret/i, /exfiltrate/i, /leak/i];
    const matches = patterns.filter((pattern) => pattern.test(prompt)).length;
    return Math.min(100, matches * 25);
  }
}

export class ModelRouterService {
  constructor(
    private readonly health: ModelHealthService = new StoreBackedModelHealthService(),
    private readonly costs: ModelCostTracker = new HeuristicModelCostTracker(),
    private readonly fallbacks: ModelFallbackService = new OrderedModelFallbackService(),
    private readonly usage: ModelUsageMeter = new StoreBackedModelUsageMeter(),
    private readonly safety: PromptSafetyService = new HeuristicPromptSafetyService()
  ) {}

  route(request: ModelRouteRequest): ModelRouteDecision {
    const promptRiskScore = this.safety.score(request.prompt);
    const preferred = this.preferredProvider(request);
    const candidates = [preferred, ...this.fallbacks.fallbacks(preferred)];
    const provider = candidates.find((candidate) => this.health.status(candidate) === "healthy") || "local";
    const estimatedCredits = this.usage.estimateCredits(request.estimatedInputTokens, request.estimatedOutputTokens, request.safetyLevel);
    const estimatedCost = this.costs.estimate(provider, request.estimatedInputTokens, request.estimatedOutputTokens);
    const blocked = promptRiskScore >= 75;
    const decision: ModelRouteDecision = {
      provider,
      model: this.modelFor(provider, request.taskType),
      fallbackProviders: candidates.filter((candidate) => candidate !== provider),
      estimatedCredits,
      estimatedCost,
      promptRiskScore,
      allowed: !blocked,
      blockedReason: blocked ? "Prompt risk score requires human review before model execution." : undefined,
      explanation: blocked ? "Routing blocked by deterministic prompt safety rules." : `Selected ${provider} from provider health, task type, and cost rules.`,
      evidence: {
        taskType: request.taskType,
        preferredProvider: preferred,
        providerStatus: Object.fromEntries(candidates.map((candidate) => [candidate, this.health.status(candidate)])),
        engineType: "heuristic",
        ruleVersion: "heuristic-2026-07-02"
      }
    };
    this.usage.recordUsage(request, decision);
    return decision;
  }

  private preferredProvider(request: ModelRouteRequest): AiProviderName {
    if (request.safetyLevel === "high" || request.taskType === "security") return "claude";
    if (request.taskType === "code" || request.taskType === "qa") return "openai";
    if (request.taskType === "chat" && request.planId === "free") return "groq";
    return "gemini";
  }

  private modelFor(provider: AiProviderName, taskType: AiTaskType) {
    const suffix = taskType === "code" ? "code" : taskType === "chat" ? "chat" : "reasoning";
    return `${provider}-${suffix}`;
  }
}

export const modelRouterService = new ModelRouterService();
