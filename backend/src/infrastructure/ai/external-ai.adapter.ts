import type { AiProvider, IntelligenceContext, IntelligenceGeneration, VaanForgeBlueprint, VaanForgeRequirement, VaanForgeTaskGraph } from "./ai.interface";

export class ExternalAiAdapter implements AiProvider {
  async generateIntelligence(_context: IntelligenceContext): Promise<IntelligenceGeneration> {
    throw new Error("External AI provider is not configured. Set AI_PROVIDER to a reviewed provider and supply credentials before production launch.");
  }

  async generateProjectBlueprint(_requirement: VaanForgeRequirement): Promise<VaanForgeBlueprint> {
    throw new Error("External AI provider is not configured. Set AI_PROVIDER to deterministic, openai, local-llm, or vaanai after adding reviewed credentials.");
  }

  async generateExecutionTaskGraph(_input: { phaseOneRunId: string; blueprint: Record<string, unknown>; ownerId: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }): Promise<VaanForgeTaskGraph> {
    throw new Error("External AI provider is not configured. Set AI_PROVIDER to deterministic, openai, local-llm, or vaanai after adding reviewed credentials.");
  }
}
