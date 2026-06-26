import { apiClient } from "@/services/apiClient";
import type { OperationsCommandAction, OperationsIncident } from "../types.operations";

export const operationsApi = {
  summary: () => apiClient<Record<string, unknown>>("/admin/operations/summary"),
  agents: () => apiClient<Record<string, unknown>>("/admin/operations/agents"),
  products: () => apiClient<Record<string, unknown>>("/admin/operations/products"),
  incidents: () => apiClient<OperationsIncident[]>("/admin/operations/incidents"),
  createIncident: (payload: Record<string, unknown>) => apiClient<OperationsIncident>("/admin/operations/incidents", { method: "POST", body: JSON.stringify(payload) }),
  updateIncident: (incidentId: string, payload: Record<string, unknown>) => apiClient<OperationsIncident>(`/admin/operations/incidents/${incidentId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  audit: (query = "") => apiClient<Array<Record<string, unknown>>>(`/admin/operations/audit${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  analytics: () => apiClient<Record<string, unknown>>("/admin/operations/analytics"),
  health: () => apiClient<Record<string, unknown>>("/admin/operations/health"),
  queues: () => apiClient<Record<string, unknown>>("/admin/operations/queues"),
  deployments: () => apiClient<Record<string, unknown>>("/admin/operations/deployments"),
  settings: () => apiClient<Record<string, unknown>>("/admin/operations/settings"),
  command: (action: OperationsCommandAction, payload: Record<string, unknown>) => apiClient<Record<string, unknown>>("/admin/operations/command", { method: "POST", body: JSON.stringify({ action, ...payload }) }),
  agentCommand: (agentId: string, action: "enable" | "disable" | "restart" | "drain", payload: Record<string, unknown>) =>
    apiClient<Record<string, unknown>>(`/admin/operations/agents/${agentId}/${action}`, { method: "POST", body: JSON.stringify(payload) })
};
