import { env } from "../../config/env";
import { DeterministicAiAdapter } from "./deterministic-ai.adapter";
import { ExternalAiAdapter } from "./external-ai.adapter";
import type { AiProvider, IntelligenceContext, IntelligenceGeneration, VaanForgeBlueprint, VaanForgeRequirement, VaanForgeTaskGraph } from "./ai.interface";

const provider: AiProvider = env.aiProvider === "deterministic" ? new DeterministicAiAdapter() : new ExternalAiAdapter();

export class AiService implements AiProvider {
  generateIntelligence(context: IntelligenceContext): Promise<IntelligenceGeneration> {
    return provider.generateIntelligence(context);
  }

  generateProjectBlueprint(requirement: VaanForgeRequirement): Promise<VaanForgeBlueprint> {
    return provider.generateProjectBlueprint(requirement);
  }

  generateExecutionTaskGraph(input: { phaseOneRunId: string; blueprint: Record<string, unknown>; ownerId: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }): Promise<VaanForgeTaskGraph> {
    return provider.generateExecutionTaskGraph(input);
  }
}

export const aiService = new AiService();
