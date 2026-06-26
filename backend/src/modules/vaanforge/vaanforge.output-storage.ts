import type { VaanForgeBlueprint } from "../../infrastructure/ai/ai.interface";
import type { StoredVaanForgeOutputType } from "../../database/in-memory-store";

export type VaanForgeOutputDraft = {
  outputType: StoredVaanForgeOutputType;
  title: string;
  format: "markdown" | "json";
  content: string;
  metadata?: Record<string, unknown>;
};

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

export function createVaanForgeOutputDrafts(blueprint: VaanForgeBlueprint): VaanForgeOutputDraft[] {
  return [
    {
      outputType: "product_requirement_document",
      title: "Product Requirement Document",
      format: "markdown",
      content: blueprint.productRequirementDocument,
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "architecture_plan",
      title: "Architecture Plan",
      format: "json",
      content: stringify(blueprint.architecturePlan),
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "folder_structure",
      title: "Folder Structure",
      format: "json",
      content: stringify(blueprint.folderStructure),
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "database_plan",
      title: "Database Plan",
      format: "json",
      content: stringify(blueprint.databasePlan),
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "api_plan",
      title: "API Plan",
      format: "json",
      content: stringify(blueprint.apiPlan),
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "ui_screen_list",
      title: "UI Screen List",
      format: "json",
      content: stringify(blueprint.uiScreenList),
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "sprint_roadmap",
      title: "Sprint-wise Execution Roadmap",
      format: "json",
      content: stringify(blueprint.sprintRoadmap),
      metadata: { provider: blueprint.provider }
    },
    {
      outputType: "codex_implementation_prompt",
      title: "Codex-ready Implementation Prompt",
      format: "markdown",
      content: blueprint.codexImplementationPrompt,
      metadata: { provider: blueprint.provider }
    }
  ];
}

export function validateVaanForgeOutputs(outputs: VaanForgeOutputDraft[]) {
  const requiredTypes: StoredVaanForgeOutputType[] = [
    "product_requirement_document",
    "architecture_plan",
    "folder_structure",
    "database_plan",
    "api_plan",
    "ui_screen_list",
    "sprint_roadmap",
    "codex_implementation_prompt"
  ];

  const missing = requiredTypes.filter((type) => !outputs.some((output) => output.outputType === type && output.content.trim().length > 0));
  if (missing.length) {
    throw new Error(`VaanForge output validation failed. Missing: ${missing.join(", ")}`);
  }
}
