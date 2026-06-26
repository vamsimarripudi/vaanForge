import { apiClient } from "@/services/apiClient";
import type { AgentError, AgentFile, AgentLog, AgentRunDetail, AgentRunListItem, AgentSummary, AgentTask, AgentValidation } from "../types";

export const agentAdminApi = {
  summary: () => apiClient<AgentSummary>("/admin/agent/summary"),
  runs: () => apiClient<AgentRunListItem[]>("/admin/agent/runs"),
  run: (runId: string) => apiClient<AgentRunDetail>(`/admin/agent/runs/${runId}`),
  tasks: (runId: string) => apiClient<AgentTask[]>(`/admin/agent/runs/${runId}/tasks`),
  files: (runId: string) => apiClient<AgentFile[]>(`/admin/agent/runs/${runId}/files`),
  validations: (runId: string) => apiClient<AgentValidation[]>(`/admin/agent/runs/${runId}/validations`),
  errors: (runId: string) => apiClient<AgentError[]>(`/admin/agent/runs/${runId}/errors`),
  logs: (runId: string) => apiClient<AgentLog[]>(`/admin/agent/runs/${runId}/logs`),
  action: (runId: string, action: "approve" | "reject" | "block" | "resume" | "cancel", reason?: string) =>
    apiClient<AgentRunDetail>(`/admin/agent/runs/${runId}/${action}`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
};
