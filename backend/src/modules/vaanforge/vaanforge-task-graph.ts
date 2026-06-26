import { aiService } from "../../infrastructure/ai/ai.service";
import type { VaanForgeTaskGraph } from "../../infrastructure/ai/ai.interface";

export type ApprovedBlueprintContext = {
  phaseOneRunId: string;
  blueprint: Record<string, unknown>;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
};

export class VaanForgeTaskGraphEngine {
  async build(context: ApprovedBlueprintContext): Promise<VaanForgeTaskGraph> {
    const graph = await aiService.generateExecutionTaskGraph({
      phaseOneRunId: context.phaseOneRunId,
      blueprint: context.blueprint,
      ownerId: context.ownerId,
      priority: context.priority
    });

    const missingModules = ["frontend", "backend", "database", "api", "auth", "dashboard", "tests"].filter(
      (module) => !graph.tasks.some((task) => task.module === module)
    );
    if (missingModules.length) {
      throw new Error(`Task graph validation failed. Missing modules: ${missingModules.join(", ")}`);
    }

    return graph;
  }
}

export const vaanForgeTaskGraphEngine = new VaanForgeTaskGraphEngine();
