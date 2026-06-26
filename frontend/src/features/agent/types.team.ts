import type { AgentRunDetail } from "./types";

export type AgentRole = {
  roleId: string;
  name: string;
  slug: string;
  responsibilities: string[];
  requiredReview: boolean;
  status: "active" | "inactive";
  config?: { modelProvider: string; systemPrompt: string; tools: string[]; guardrails: string[] };
};

export type AgentAssignment = {
  assignmentId: string;
  runId: string;
  roleId: string;
  ownerId: string;
  status: "created" | "assigned" | "in_progress" | "review_required" | "approved" | "handed_off" | "completed" | "blocked" | "failed";
  priority: string;
  dueDate: string;
  scope: string;
  outputVersion: number;
  nextAction: string;
};

export type AgentTeamSnapshot = {
  run?: AgentRunDetail;
  roles: AgentRole[];
  assignments: AgentAssignment[];
  handoffs: Array<Record<string, unknown>>;
  comments: Array<Record<string, unknown>>;
  conflicts: Array<Record<string, unknown>>;
  decisions: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  finalReviews: Array<Record<string, unknown>>;
};
