export type AgentDeploymentStatus = "draft" | "preparing" | "ready" | "deploying" | "verifying" | "live" | "failed" | "rollback_required" | "rolled_back";

export type AgentDeployment = {
  deploymentId: string;
  runId: string;
  ownerId: string;
  status: AgentDeploymentStatus;
  targetId: string;
  releaseId: string;
  environment: "staging" | "production";
  priority: string;
  dueDate: string;
  confirmedProduction: boolean;
  errorMessage?: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  target?: Record<string, unknown>;
  checks?: Array<Record<string, unknown>>;
  logs?: Array<Record<string, unknown>>;
  releases?: Array<Record<string, unknown>>;
  rollbacks?: Array<Record<string, unknown>>;
  healthChecks?: Array<Record<string, unknown>>;
};
