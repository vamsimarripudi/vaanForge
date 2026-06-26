import { apiClient } from "@/services/apiClient";
import type { AgentRole, AgentTeamSnapshot } from "../types.team";

export const agentTeamApi = {
  team: () => apiClient<{ roles: AgentRole[]; activeAssignments: unknown[] }>("/admin/agent/team"),
  roles: () => apiClient<AgentRole[]>("/admin/agent/team/roles"),
  createRole: (payload: Partial<AgentRole> & { config?: Record<string, unknown> }) => apiClient<AgentRole>("/admin/agent/team/roles", { method: "POST", body: JSON.stringify(payload) }),
  updateRole: (roleId: string, payload: Partial<AgentRole> & { config?: Record<string, unknown> }) => apiClient<AgentRole>(`/admin/agent/team/roles/${roleId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  runTeam: (runId: string) => apiClient<AgentTeamSnapshot>(`/admin/agent/runs/${runId}/team`),
  assign: (runId: string, payload: Record<string, unknown> = {}) => apiClient<AgentTeamSnapshot>(`/admin/agent/runs/${runId}/team/assign`, { method: "POST", body: JSON.stringify(payload) }),
  handoff: (runId: string, payload: Record<string, unknown>) => apiClient<AgentTeamSnapshot>(`/admin/agent/runs/${runId}/team/handoff`, { method: "POST", body: JSON.stringify(payload) }),
  comment: (runId: string, payload: Record<string, unknown>) => apiClient<Record<string, unknown>>(`/admin/agent/runs/${runId}/team/comment`, { method: "POST", body: JSON.stringify(payload) }),
  conflict: (runId: string, payload: Record<string, unknown>) => apiClient<Record<string, unknown>>(`/admin/agent/runs/${runId}/team/conflict`, { method: "POST", body: JSON.stringify(payload) }),
  review: (runId: string, payload: Record<string, unknown>) => apiClient<AgentTeamSnapshot>(`/admin/agent/runs/${runId}/team/review`, { method: "POST", body: JSON.stringify(payload) }),
  finalReview: (runId: string, payload: Record<string, unknown>) => apiClient<Record<string, unknown>>(`/admin/agent/runs/${runId}/team/final-review`, { method: "POST", body: JSON.stringify(payload) })
};
