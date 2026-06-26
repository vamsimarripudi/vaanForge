export type OperationsMode = "summary" | "agents" | "products" | "incidents" | "audit" | "analytics" | "health" | "queues" | "deployments" | "settings";

export type OperationsIncident = {
  incidentId: string;
  title: string;
  description: string;
  severity: "SEV1" | "SEV2" | "SEV3" | "SEV4";
  status: "open" | "investigating" | "mitigated" | "resolved" | "postmortem";
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  impactedProducts: string[];
  timeline: Array<Record<string, unknown>>;
  rootCause?: string;
  resolution?: string;
  postmortem?: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
};

export type OperationsAgentMetric = {
  agentId: string;
  agentName: string;
  version: string;
  status: "enabled" | "disabled" | "draining" | "restarting";
  health: "healthy" | "degraded" | "down";
  activeRuns: number;
  queuedTasks: number;
  errorRate: number;
  workloadScore: number;
  region: string;
};

export type OperationsProductMetric = {
  product: string;
  activeUsers: number;
  activeWorkspaces: number;
  apiHealth: string;
  queueHealth: string;
  errorRate: number;
  buildStatus: string;
  deploymentStatus: string;
  region: string;
};

export type OperationsCommandAction =
  | "pause_deployments"
  | "pause_agent_generation"
  | "emergency_stop"
  | "resume_services"
  | "maintenance_mode"
  | "scheduled_maintenance"
  | "restart_agent"
  | "drain_agent"
  | "enable_agent"
  | "disable_agent";
