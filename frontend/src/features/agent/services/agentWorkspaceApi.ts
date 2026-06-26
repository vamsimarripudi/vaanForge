import { apiClient, API_BASE_URL } from "@/services/apiClient";
import type { AgentRunListItem } from "../types";
import type { AgentWorkspaceEvidence, AgentWorkspaceInstruction, AgentWorkspaceSnapshot } from "../types.workspace";

export const agentWorkspaceApi = {
  overview: () => apiClient<AgentRunListItem[]>("/admin/agent/workspace"),
  workspace: (runId: string) => apiClient<AgentWorkspaceSnapshot>(`/admin/agent/workspace/${runId}`),
  evidence: (runId: string) => apiClient<AgentWorkspaceEvidence[]>(`/admin/agent/workspace/${runId}/evidence`),
  instructions: (runId: string) => apiClient<AgentWorkspaceInstruction[]>(`/admin/agent/workspace/${runId}/instructions`),
  control: (runId: string, action: "pause" | "resume" | "stop" | "approve-step" | "reject-step" | "regenerate", payload: { reason?: string; stepId?: string } = {}) =>
    apiClient<AgentWorkspaceSnapshot>(`/admin/agent/workspace/${runId}/${action}`, { method: "POST", body: JSON.stringify(payload) }),
  addInstruction: (runId: string, payload: { instructionType: AgentWorkspaceInstruction["instructionType"]; content: string }) =>
    apiClient<AgentWorkspaceInstruction>(`/admin/agent/workspace/${runId}/instructions`, { method: "POST", body: JSON.stringify(payload) }),
  liveUrl: (runId: string) => `${API_BASE_URL}/admin/agent/workspace/${runId}/live`
};
