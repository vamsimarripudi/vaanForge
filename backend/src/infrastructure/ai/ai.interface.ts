export type IntelligenceContext = {
  finance: {
    revenueTotal: number;
    expenseTotal: number;
    grossProfit: number;
  };
  tasks: {
    blocked: number;
  };
  support: {
    urgent: number;
  };
};

export type IntelligenceGeneration = {
  provider: string;
  placeholders: number;
  reportExplanation: string;
  riskSignals: string[];
  nextTasks: string[];
  disclaimer: string;
};

export type VaanForgeFeatureRequirement = {
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  acceptanceCriteria: string[];
};

export type VaanForgeRequirement = {
  productName: string;
  productSlug: string;
  source: string;
  requestId?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  businessContext: {
    problemStatement: string;
    targetUsers: string[];
    goals: string[];
    successMetrics: string[];
  };
  scope: {
    coreFeatures: VaanForgeFeatureRequirement[];
    outOfScope?: string[];
  };
  constraints: {
    approvedArchitecture: string;
    designSystem: string;
    routing: string[];
    permissions: string[];
  };
  dataEntities?: Array<{
    name: string;
    fields: string[];
    relationships?: string[];
  }>;
  integrations?: string[];
  nonFunctionalRequirements?: string[];
};

export type VaanForgeBlueprint = {
  provider: string;
  productRequirementDocument: string;
  architecturePlan: Record<string, unknown>;
  folderStructure: string[];
  databasePlan: Record<string, unknown>;
  apiPlan: Array<Record<string, unknown>>;
  uiScreenList: Array<Record<string, unknown>>;
  sprintRoadmap: Array<Record<string, unknown>>;
  codexImplementationPrompt: string;
  nextActions: string[];
  validationChecks: string[];
};

export type VaanForgeExecutionTask = {
  taskId: string;
  module: "frontend" | "backend" | "database" | "api" | "auth" | "dashboard" | "tests";
  title: string;
  description: string;
  dependencies: string[];
  outputPaths: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
};

export type VaanForgeTaskGraph = {
  provider: string;
  phaseOneRunId: string;
  tasks: VaanForgeExecutionTask[];
  validationOrder: Array<"lint" | "type-check" | "tests" | "build">;
  synchronizationChecks: string[];
};

export interface AiProvider {
  generateIntelligence(context: IntelligenceContext): Promise<IntelligenceGeneration>;
  generateProjectBlueprint(requirement: VaanForgeRequirement): Promise<VaanForgeBlueprint>;
  generateExecutionTaskGraph(input: { phaseOneRunId: string; blueprint: Record<string, unknown>; ownerId: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }): Promise<VaanForgeTaskGraph>;
}
