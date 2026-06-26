export type AgentRunStatus = "pending" | "analyzing" | "planned" | "preparing" | "generating" | "validating" | "repairing" | "completed" | "blocked" | "failed";

export type AgentRunListItem = {
  runId: string;
  kind: "blueprint" | "execution";
  product: string;
  ownerId: string;
  status: AgentRunStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  createdAt: string;
  failedValidations: number;
};

export type AgentSummary = {
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedOrBlockedRuns: number;
  averageValidationSuccessRate: number;
  recentActivity: AgentLog[];
  notifications: Array<{ type: string; message: string; runId: string }>;
};

export type AgentOutput = {
  outputType: string;
  title: string;
  format: "markdown" | "json";
  content: string;
};

export type AgentTask = {
  taskId: string;
  module: string;
  title: string;
  description: string;
  status: AgentRunStatus;
  priority: string;
  ownerId: string;
  dueDate: string;
  nextAction: string;
};

export type AgentFile = {
  fileId: string;
  taskId?: string;
  module: string;
  path: string;
  operation: string;
  status: "planned" | "written" | "skipped" | "blocked";
  diffSummary?: string;
  humanReviewRequired: boolean;
};

export type AgentValidation = {
  validationId: string;
  checkName: string;
  command: string;
  status: "passed" | "failed" | "skipped";
  exitCode?: number;
  output: string;
  completedAt: string;
};

export type AgentError = {
  errorId: string;
  source: string;
  filePath?: string;
  line?: number;
  reason: string;
  fixAttempt?: string;
  status: "open" | "repaired" | "blocked";
};

export type AgentRepairAttempt = {
  repairId: string;
  errorId?: string;
  cycle: number;
  strategy: string;
  status: "attempted" | "succeeded" | "failed";
  notes: string;
};

export type AgentLog = {
  activityId?: string;
  id?: string;
  step: string;
  status: AgentRunStatus;
  message: string;
  createdAt: string;
};

export type AgentRunDetail = AgentRunListItem & {
  kind: "blueprint" | "execution";
  runId?: string;
  executionId?: string;
  inputRequirements?: Record<string, unknown>;
  approvedBlueprint?: Record<string, unknown>;
  taskGraph?: Record<string, unknown>;
  outputs?: AgentOutput[];
  tasks?: AgentTask[];
  files?: AgentFile[];
  validationRuns?: AgentValidation[];
  errors?: AgentError[];
  repairAttempts?: AgentRepairAttempt[];
  activityLogs?: AgentLog[];
  auditLogs?: AgentLog[];
  executionReport?: Record<string, unknown>;
};
