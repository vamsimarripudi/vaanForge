import type { AgentError, AgentFile, AgentLog, AgentRunDetail, AgentTask, AgentValidation } from "./types";

export type AgentLiveEvent = {
  eventId: string;
  runId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AgentWorkspaceInstruction = {
  instructionId: string;
  runId: string;
  instructionType: "extra" | "constraint" | "design" | "backend" | "security" | "deadline_priority";
  content: string;
  applied: boolean;
  createdAt: string;
};

export type AgentWorkspaceEvidence = {
  evidenceId: string;
  runId: string;
  evidenceType: "files" | "diff" | "validation" | "error" | "repair" | "build" | "final";
  title: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AgentStepApproval = {
  approvalId: string;
  stepId: string;
  decision: "approved" | "rejected";
  reason?: string;
  createdAt: string;
};

export type AgentWorkspaceSnapshot = {
  run: AgentRunDetail;
  activeTask?: AgentTask;
  tasks: AgentTask[];
  files: AgentFile[];
  validations: AgentValidation[];
  errors: AgentError[];
  logs: AgentLog[];
  evidence: AgentWorkspaceEvidence[];
  instructions: AgentWorkspaceInstruction[];
  approvals: AgentStepApproval[];
  liveEvents: AgentLiveEvent[];
  nextAction: string;
};
