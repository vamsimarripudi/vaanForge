import { apiClient } from "@/services/apiClient";
import type { AgentDeployment } from "../types.deployment";

export const agentDeploymentApi = {
  list: () => apiClient<AgentDeployment[]>("/admin/agent/deployments"),
  create: (payload: Record<string, unknown>) => apiClient<AgentDeployment>("/admin/agent/deployments", { method: "POST", body: JSON.stringify(payload) }),
  detail: (deploymentId: string) => apiClient<AgentDeployment>(`/admin/agent/deployments/${deploymentId}`),
  logs: (deploymentId: string) => apiClient<Array<Record<string, unknown>>>(`/admin/agent/deployments/${deploymentId}/logs`),
  action: (deploymentId: string, action: "prepare" | "deploy" | "verify" | "rollback", payload: Record<string, unknown>) =>
    apiClient<AgentDeployment>(`/admin/agent/deployments/${deploymentId}/${action}`, { method: "POST", body: JSON.stringify(payload) }),
  runDeployments: (runId: string) => apiClient<AgentDeployment[]>(`/admin/agent/runs/${runId}/deployment`)
};
