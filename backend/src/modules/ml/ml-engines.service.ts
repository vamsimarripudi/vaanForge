import { createHash } from "node:crypto";
import { z } from "zod";
import { createId, store, type StoredMlScore } from "../../database/in-memory-store";

export type MlActor = { organizationId: string; userId: string; role: string; workspaceId?: string };

export interface MlEngineResult {
  score: number;
  confidence: number;
  explanation: string;
  evidence: Record<string, unknown>;
  engineType: "heuristic" | "model";
  modelVersion?: string;
  ruleVersion: string;
  recommendedAction: string;
}

export interface MlEngine<TInput> {
  readonly engineName: string;
  readonly taskType: string;
  readonly ruleVersion: string;
  evaluate(input: TInput, actor: MlActor): MlEngineResult;
}

export const textSchema = z.object({ text: z.string().min(2).max(20000), context: z.record(z.unknown()).default({}) });
export const projectSchema = z.object({
  productType: z.string().min(2).default("software"),
  features: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  deploymentTarget: z.string().optional(),
  budgetLevel: z.string().optional(),
  timelineWeeks: z.number().min(1).optional()
});

export class HeuristicTextSignalEngine implements MlEngine<z.infer<typeof textSchema>> {
  readonly engineType = "heuristic" as const;
  constructor(readonly engineName: string, readonly taskType: string, readonly ruleVersion: string, private readonly signals: Array<[string, RegExp]>, private readonly action: string) {}
  evaluate(input: z.infer<typeof textSchema>): MlEngineResult {
    const matched = this.signals.filter(([, regex]) => regex.test(input.text)).map(([label]) => label);
    const score = Math.round((matched.length / this.signals.length) * 100);
    return {
      score,
      confidence: confidence(score, matched.length),
      explanation: matched.length ? `Detected ${matched.join(", ")} signals.` : "Input is missing expected signals for this analysis.",
      evidence: { matchedSignals: matched, totalSignals: this.signals.length, context: input.context },
      engineType: "heuristic",
      ruleVersion: this.ruleVersion,
      recommendedAction: score < 70 ? this.action : "Proceed with the next workflow step."
    };
  }
}

export class ProjectComplexityEngine implements MlEngine<z.infer<typeof projectSchema>> {
  readonly engineName = "ProjectComplexityEngine";
  readonly taskType = "project.complexity";
  readonly ruleVersion = "heuristic-2026-07-02";
  evaluate(input: z.infer<typeof projectSchema>): MlEngineResult {
    const score = clamp(20 + input.features.length * 7 + input.integrations.length * 10 + input.roles.length * 5 + (input.deploymentTarget ? 8 : 0));
    return { score, confidence: confidence(score, input.features.length + input.integrations.length + input.roles.length), explanation: "Complexity is based on feature count, integrations, roles, and deployment target.", evidence: input, engineType: "heuristic", ruleVersion: this.ruleVersion, recommendedAction: score > 75 ? "Use Business plan and architecture review." : "Proceed with standard planning." };
  }
}

export class ProjectEstimateEngine implements MlEngine<z.infer<typeof projectSchema>> {
  readonly engineName = "ProjectEstimateEngine";
  readonly taskType = "project.estimate";
  readonly ruleVersion = "heuristic-2026-07-02";
  evaluate(input: z.infer<typeof projectSchema>): MlEngineResult {
    const complexity = new ProjectComplexityEngine().evaluate(input).score;
    const weeks = Math.max(2, Math.ceil(complexity / 18));
    return { score: complexity, confidence: confidence(complexity, input.features.length + input.integrations.length), explanation: `Estimated ${weeks} week(s) from deterministic complexity rules.`, evidence: { ...input, estimatedWeeks: weeks, estimatedCredits: complexity * 100 }, engineType: "heuristic", ruleVersion: this.ruleVersion, recommendedAction: complexity > 70 ? "Split into milestones and require approval gates." : "Proceed with normal sprint planning." };
  }
}

export class ArchitectureRecommendationEngine implements MlEngine<z.infer<typeof projectSchema>> {
  readonly engineName = "ArchitectureRecommendationEngine";
  readonly taskType = "architecture.recommend";
  readonly ruleVersion = "heuristic-2026-07-02";
  evaluate(input: z.infer<typeof projectSchema>): MlEngineResult {
    const needsEvents = input.integrations.length > 2 || input.features.some((feature) => /realtime|workflow|queue/i.test(feature));
    const score = needsEvents ? 82 : 68;
    return { score, confidence: 0.76, explanation: needsEvents ? "Event-driven modular architecture is recommended because integrations or workflow complexity are high." : "Modular API-first architecture is sufficient for the supplied scope.", evidence: { integrations: input.integrations, features: input.features, recommendedArchitecture: needsEvents ? "event-driven modular services" : "modular API-first service" }, engineType: "heuristic", ruleVersion: this.ruleVersion, recommendedAction: "Create an architecture review before build start." };
  }
}

export class TemplateRecommendationEngine implements MlEngine<z.infer<typeof projectSchema>> {
  readonly engineName = "TemplateRecommendationEngine";
  readonly taskType = "template.recommend";
  readonly ruleVersion = "heuristic-2026-07-02";
  evaluate(input: z.infer<typeof projectSchema>, actor: MlActor): MlEngineResult {
    const templates = store.agentTemplates.filter((template) => (template.organizationId === actor.organizationId || template.status === "published") && JSON.stringify(template).toLowerCase().includes(input.productType.toLowerCase()));
    return { score: templates.length ? 85 : 35, confidence: templates.length ? 0.82 : 0.45, explanation: templates.length ? "Matched approved templates by product type and metadata." : "No approved template matched the supplied product type.", evidence: { templateIds: templates.slice(0, 5).map((item) => item.templateId), productType: input.productType }, engineType: "heuristic", ruleVersion: this.ruleVersion, recommendedAction: templates.length ? "Review the recommended template before blueprint generation." : "Start from requirements or create a reusable template." };
  }
}

export class MlEnginesService {
  requirementsQuality = new HeuristicTextSignalEngine("RequirementQualityEngine", "requirements.quality", "heuristic-2026-07-02", [["roles", /role|admin|user|customer/i], ["features", /feature|workflow|screen|api/i], ["data", /data|database|model|schema/i], ["security", /auth|permission|security|tenant/i], ["deployment", /deploy|hosting|cloud|server/i]], "Ask follow-up questions for missing requirements.");
  riskScoring = new HeuristicTextSignalEngine("RiskScoringEngine", "risk.score", "heuristic-2026-07-02", [["security", /secret|token|permission|auth|tenant/i], ["delivery", /blocked|delay|unknown|unclear/i], ["operations", /latency|timeout|failed|error/i], ["billing", /payment|credit|invoice|subscription/i]], "Create a mitigation task for detected risks.");
  errorClassification = new HeuristicTextSignalEngine("ErrorClassificationEngine", "error.classify", "heuristic-2026-07-02", [["authorization", /permission|unauthorized|forbidden|401|403/i], ["timeout", /timeout|latency|deadline/i], ["syntax", /syntax|parse|compile/i], ["dependency", /module not found|dependency|package/i]], "Route error to owning team.");
  anomalyDetection = new HeuristicTextSignalEngine("AnomalyDetectionEngine", "anomaly.detect", "heuristic-2026-07-02", [["spike", /spike|surge/i], ["failure", /failed|error|timeout/i], ["security", /unauthorized|abuse|attack/i], ["capacity", /queue|latency|saturation/i]], "Open an operations review if anomaly score is high.");
  promptRiskScanner = new HeuristicTextSignalEngine("PromptRiskScanner", "prompt.risk_scan", "heuristic-2026-07-02", [["instruction_override", /ignore previous|system prompt|developer message/i], ["secret_request", /api key|token|password|secret/i], ["exfiltration", /send.*data|leak|exfiltrate/i]], "Quarantine prompt input for review.");

  run<T>(actor: MlActor, engine: MlEngine<T>, input: T) {
    const result = engine.evaluate(input, actor);
    return this.persist(actor, engine, input, result);
  }

  complexity(actor: MlActor, input: z.infer<typeof projectSchema>) {
    return this.run(actor, new ProjectComplexityEngine(), input);
  }

  estimate(actor: MlActor, input: z.infer<typeof projectSchema>) {
    return this.run(actor, new ProjectEstimateEngine(), input);
  }

  architecture(actor: MlActor, input: z.infer<typeof projectSchema>) {
    return this.run(actor, new ArchitectureRecommendationEngine(), input);
  }

  template(actor: MlActor, input: z.infer<typeof projectSchema>) {
    return this.run(actor, new TemplateRecommendationEngine(), input);
  }

  churn(actor: MlActor, input: Record<string, unknown>) {
    const openTickets = Number(input.openTickets || 0);
    const usageDropPercent = Number(input.usageDropPercent || 0);
    const paymentFailures = Number(input.paymentFailures || 0);
    const score = clamp(openTickets * 12 + usageDropPercent + paymentFailures * 20);
    return this.persist(actor, { engineName: "ChurnPredictionEngine", taskType: "churn.predict", ruleVersion: "heuristic-2026-07-02", evaluate: () => ({ score, confidence: confidence(score, openTickets + paymentFailures + 1), explanation: "Churn risk is based on support load, usage drop, and payment failures.", evidence: { openTickets, usageDropPercent, paymentFailures }, engineType: "heuristic", ruleVersion: "heuristic-2026-07-02", recommendedAction: score > 60 ? "Create customer success intervention." : "Continue monitoring customer health." }) }, input, undefined);
  }

  upgradeLikelihood(actor: MlActor, input: Record<string, unknown>) {
    const creditsUsedPercent = Number(input.creditsUsedPercent || 0);
    const projectsUsedPercent = Number(input.projectsUsedPercent || 0);
    const teamGrowth = Number(input.teamGrowth || 0);
    const score = clamp((creditsUsedPercent + projectsUsedPercent) / 2 + teamGrowth * 5);
    return this.persist(actor, { engineName: "UpgradeLikelihoodEngine", taskType: "upgrade.likelihood", ruleVersion: "heuristic-2026-07-02", evaluate: () => ({ score, confidence: confidence(score, 3), explanation: "Upgrade likelihood uses usage saturation and team growth.", evidence: { creditsUsedPercent, projectsUsedPercent, teamGrowth }, engineType: "heuristic", ruleVersion: "heuristic-2026-07-02", recommendedAction: score > 70 ? "Show upgrade path and plan comparison." : "Keep current plan recommendation visible." }) }, input, undefined);
  }

  private persist<T>(actor: MlActor, engine: Pick<MlEngine<T>, "engineName" | "taskType" | "ruleVersion" | "evaluate">, input: T, precomputed?: MlEngineResult) {
    const result = precomputed || engine.evaluate(input, actor);
    const record: StoredMlScore = { id: createId("mls"), scoreId: createId("ml_score"), organizationId: actor.organizationId, workspaceId: actor.workspaceId, engineName: engine.engineName, engineType: result.engineType, modelVersion: result.modelVersion, ruleVersion: result.ruleVersion || engine.ruleVersion, taskType: engine.taskType, score: result.score, confidence: result.confidence, explanation: result.explanation, evidence: result.evidence, recommendedAction: result.recommendedAction, inputHash: sha256(JSON.stringify(input)), createdBy: actor.userId, createdAt: new Date().toISOString() };
    store.mlScores.push(record);
    return record;
  }
}

export const mlEnginesService = new MlEnginesService();

function confidence(score: number, signals: number) {
  return Number(Math.min(0.95, Math.max(0.35, score / 100 + Math.min(0.2, signals * 0.03))).toFixed(2));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
