import type { AiProvider, IntelligenceContext, IntelligenceGeneration, VaanForgeBlueprint, VaanForgeRequirement, VaanForgeTaskGraph } from "./ai.interface";

export class DeterministicAiAdapter implements AiProvider {
  async generateIntelligence(context: IntelligenceContext): Promise<IntelligenceGeneration> {
    return {
      provider: "deterministic",
      placeholders: 8,
      reportExplanation: `Revenue is ${context.finance.revenueTotal}, expenses are ${context.finance.expenseTotal}, and current profit is ${context.finance.grossProfit}.`,
      riskSignals: [
        context.tasks.blocked > 0 ? "Blocked tasks need founder attention." : "No blocked task signal from current data.",
        context.support.urgent > 0 ? "Urgent support tickets need escalation." : "No urgent support signal from current data."
      ],
      nextTasks: ["Review pending approvals", "Check overdue compliance", "Prepare weekly founder report"],
      disclaimer: "This is deterministic local intelligence. Connect a reviewed AI provider before using generated advice."
    };
  }

  async generateProjectBlueprint(requirement: VaanForgeRequirement): Promise<VaanForgeBlueprint> {
    const entities = requirement.dataEntities?.length
      ? requirement.dataEntities
      : [
          { name: `${requirement.productName}Record`, fields: ["id", "organizationId", "ownerId", "status", "priority", "dueDate", "activityHistory", "nextAction"] },
          { name: `${requirement.productName}AuditLog`, fields: ["id", "organizationId", "actorId", "action", "metadata", "createdAt"] }
        ];
    const featureNames = requirement.scope.coreFeatures.map((feature) => feature.name);
    const moduleSlug = requirement.productSlug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

    const productRequirementDocument = [
      `# ${requirement.productName} Product Requirement Document`,
      "",
      `Source: ${requirement.source}${requirement.requestId ? ` (${requirement.requestId})` : ""}`,
      `Owner: ${requirement.ownerId}`,
      `Priority: ${requirement.priority}`,
      `Due date: ${requirement.dueDate}`,
      "",
      "## Problem",
      requirement.businessContext.problemStatement,
      "",
      "## Target Users",
      ...requirement.businessContext.targetUsers.map((user) => `- ${user}`),
      "",
      "## Goals",
      ...requirement.businessContext.goals.map((goal) => `- ${goal}`),
      "",
      "## Success Metrics",
      ...requirement.businessContext.successMetrics.map((metric) => `- ${metric}`),
      "",
      "## Core Features",
      ...requirement.scope.coreFeatures.flatMap((feature) => [
        `### ${feature.name}`,
        feature.description,
        `Priority: ${feature.priority}`,
        "Acceptance criteria:",
        ...feature.acceptanceCriteria.map((criterion) => `- ${criterion}`),
        ""
      ]),
      "## KRAVIA Synchronization",
      `- Architecture: ${requirement.constraints.approvedArchitecture}`,
      `- Design system: ${requirement.constraints.designSystem}`,
      `- Routing: ${requirement.constraints.routing.join(", ")}`,
      `- Permissions: ${requirement.constraints.permissions.join(", ")}`
    ].join("\n");

    const apiPlan = [
      { method: "POST", path: `/api/v1/${moduleSlug}/runs`, purpose: "Create a workflow run from validated requirements.", permission: "workspace:create" },
      { method: "GET", path: `/api/v1/${moduleSlug}/runs`, purpose: "List workflow runs with status, owner, priority, due date, errors, and next action.", permission: "audit:read" },
      { method: "GET", path: `/api/v1/${moduleSlug}/runs/:runId`, purpose: "Read one run with input, generated outputs, audit logs, and activity history.", permission: "audit:read" },
      { method: "GET", path: `/api/v1/${moduleSlug}/runs/:runId/plans`, purpose: "Read generated PRD, architecture, database, API, UI, sprint, and Codex prompt outputs.", permission: "audit:read" }
    ];

    return {
      provider: "deterministic",
      productRequirementDocument,
      architecturePlan: {
        backend: "Express TypeScript module inside backend/src/modules with service, repository, parser, routes, and output storage boundaries.",
        database: "Prisma-backed PostgreSQL models with in-memory fallback for local development.",
        queue: "Internal job queue now; BullMQ adapter can replace the queue service without changing the module contract.",
        aiProvider: "AiProvider.generateProjectBlueprint abstraction supports OpenAI, local LLM, and future VaanAI providers.",
        synchronizationPolicy: requirement.constraints,
        featureModules: featureNames
      },
      folderStructure: [
        `backend/src/modules/${moduleSlug}/${moduleSlug}.routes.ts`,
        `backend/src/modules/${moduleSlug}/${moduleSlug}.service.ts`,
        `backend/src/modules/${moduleSlug}/${moduleSlug}.repository.ts`,
        `backend/src/modules/${moduleSlug}/${moduleSlug}.parser.ts`,
        `backend/src/modules/${moduleSlug}/${moduleSlug}.output-storage.ts`,
        `backend/src/modules/${moduleSlug}/README.md`,
        "backend/prisma/schema.prisma",
        "backend/prisma/migrations/<timestamp>_<module>_agent_runs/migration.sql"
      ],
      databasePlan: {
        entities: entities.map((entity) => ({
          ...entity,
          requiredWorkflowFields: ["ownerId", "status", "priority", "dueDate", "auditLogs", "activityHistory", "nextAction"]
        })),
        indexes: ["organizationId + createdAt", "organizationId + status", "runId + outputType"],
        retention: "Keep immutable inputs and generated outputs; append audit/activity records for every status change."
      },
      apiPlan,
      uiScreenList: [
        { screen: "Agent Runs", route: `/admin/${moduleSlug}/runs`, data: "run list, statuses, owners, due dates, next actions" },
        { screen: "Requirement Detail", route: `/admin/${moduleSlug}/runs/:runId/requirements`, data: "validated VFormix input JSON" },
        { screen: "Generated Plans", route: `/admin/${moduleSlug}/runs/:runId/plans`, data: "PRD, architecture, database, API, UI, sprint, Codex prompt" },
        { screen: "Run Audit", route: `/admin/${moduleSlug}/runs/:runId/audit`, data: "step audit logs, errors, activity history" }
      ],
      sprintRoadmap: requirement.scope.coreFeatures.map((feature, index) => ({
        sprint: index + 1,
        goal: `Deliver ${feature.name}`,
        scope: feature.description,
        validationGate: feature.acceptanceCriteria,
        ownerId: requirement.ownerId,
        priority: feature.priority,
        dueDate: requirement.dueDate
      })),
      codexImplementationPrompt: [
        `Build ${requirement.productName} inside the KRAVIA ecosystem.`,
        `Use ${requirement.constraints.approvedArchitecture}. Follow ${requirement.constraints.designSystem}.`,
        `Implement features: ${featureNames.join(", ")}.`,
        "Track owner, status, priority, due date, audit logs, activity history, and next action for every workflow.",
        "Do not proceed to the next phase until validation passes. Keep typecheck, lint, build, and route contracts clean.",
        `Required permissions: ${requirement.constraints.permissions.join(", ")}. Required routes: ${requirement.constraints.routing.join(", ")}.`
      ].join("\n"),
      nextActions: [
        "Review generated PRD with founder/product owner.",
        "Confirm database migration and permission mapping.",
        "Create implementation branch and execute sprint 1 validation gate."
      ],
      validationChecks: [
        "Required requirement fields parsed successfully.",
        "Every generated output section is non-empty.",
        "All workflow fields include owner, status, priority, due date, audit logs, activity history, and next action.",
        "KRAVIA architecture, routing, permissions, and design constraints are represented in the plan."
      ]
    };
  }

  async generateExecutionTaskGraph(input: { phaseOneRunId: string; blueprint: Record<string, unknown>; ownerId: string; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" }): Promise<VaanForgeTaskGraph> {
    const folderStructure = Array.isArray(input.blueprint.folderStructure) ? input.blueprint.folderStructure.map(String) : [];
    const routeHint = findRouteHint(input.blueprint);
    const modulePaths: Record<VaanForgeTaskGraph["tasks"][number]["module"], string[]> = {
      frontend: folderStructure.filter((path) => path.startsWith("frontend/")),
      backend: folderStructure.filter((path) => path.startsWith("backend/src/modules/")),
      database: folderStructure.filter((path) => path.includes("prisma/migrations/") && !path.includes("<")).concat(`docs/generated/${input.phaseOneRunId}/database.md`),
      api: [routeHint || "backend/src/routes.ts"],
      auth: [`docs/generated/${input.phaseOneRunId}/auth.md`],
      dashboard: folderStructure.filter((path) => path.includes("dashboard")),
      tests: folderStructure.filter((path) => path.includes("test")).concat(`docs/generated/${input.phaseOneRunId}/tests.md`)
    };
    const modules = Object.keys(modulePaths) as Array<VaanForgeTaskGraph["tasks"][number]["module"]>;

    return {
      provider: "deterministic",
      phaseOneRunId: input.phaseOneRunId,
      tasks: modules.map((module, index) => ({
        taskId: `${input.phaseOneRunId}-${module}`,
        module,
        title: `Implement ${module} scope`,
        description: `Generate and validate ${module} files from the approved VaanForge blueprint.`,
        dependencies: index === 0 ? [] : [`${input.phaseOneRunId}-${modules[index - 1]}`],
        outputPaths: modulePaths[module].length ? [...new Set(modulePaths[module])] : [`docs/generated/${input.phaseOneRunId}/${module}.md`],
        priority: input.priority
      })),
      validationOrder: ["lint", "type-check", "tests", "build"],
      synchronizationChecks: [
        "Architecture matches Phase 1 blueprint",
        "Design system references are preserved",
        "Routing is consistent",
        "Permissions are enforced",
        "Services match approved contracts",
        "No broken imports",
        "No unused dead code",
        "lint, type-check, tests, and build pass"
      ]
    };
  }
}

function findRouteHint(blueprint: Record<string, unknown>) {
  const apiPlan = blueprint.apiPlan;
  if (!Array.isArray(apiPlan)) {
    return undefined;
  }
  const first = apiPlan.find((item): item is { path: string } => typeof item === "object" && item !== null && typeof (item as { path?: unknown }).path === "string");
  return first ? `backend/src/modules/${first.path.split("/").filter(Boolean).pop() || "generated"}/routes.ts` : undefined;
}
