import type { AgentTemplate } from "@/features/agent/types.templates";

export type BuilderProjectStatus =
  | "draft"
  | "requirements_submitted"
  | "blueprint_ready"
  | "blueprint_approved"
  | "blueprint_rejected"
  | "coding_started"
  | "change_requested"
  | "delivered"
  | "blocked"
  | "failed";

export type BuilderProject = {
  projectId: string;
  organizationId: string;
  customerId: string;
  ownerId: string;
  name: string;
  description: string;
  templateId?: string;
  agentRunId: string;
  executionId?: string;
  status: BuilderProjectStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
  requirements?: BuilderRequirement[];
  blueprints?: BuilderBlueprint[];
  outputs?: BuilderOutput[];
  changeRequests?: BuilderChangeRequest[];
  activityLogs?: Array<Record<string, unknown>>;
  progress?: BuilderProgress;
};

export type BuilderRequirement = {
  requirementId: string;
  version: number;
  rawInput: Record<string, unknown>;
  normalizedInput: Record<string, unknown>;
  status: "submitted" | "accepted" | "blocked";
  missingFields: string[];
  createdAt: string;
};

export type BuilderBlueprint = {
  blueprintId: string;
  agentRunId: string;
  version: number;
  status: "generated" | "approved" | "rejected" | "superseded";
  content: Record<string, unknown>;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BuilderOutput = {
  outputId: string;
  outputType: string;
  title: string;
  content: string;
  status: "pending" | "in_progress" | "ready" | "failed";
  version: number;
  deliveryDate: string;
};

export type BuilderChangeRequest = {
  changeRequestId: string;
  summary: string;
  details: string;
  targetVersion: number;
  status: "requested" | "accepted" | "in_progress" | "completed" | "rejected";
  agentTaskId?: string;
  nextAction: string;
  createdAt: string;
};

export type BuilderProgress = {
  projectStatus: BuilderProjectStatus;
  agentRunId: string;
  blueprintStatus?: string;
  executionId?: string;
  executionStatus?: string;
  currentTask?: Record<string, unknown> | null;
  validationRuns: Array<Record<string, unknown>>;
  errors: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  nextAction: string;
};

export type BuilderListResponse = {
  projects: BuilderProject[];
  templates: Pick<AgentTemplate, "templateId" | "name" | "category" | "description" | "requiredInputs" | "stack" | "includedScreens" | "includedApis" | "databaseModels" | "status" | "version">[];
};
