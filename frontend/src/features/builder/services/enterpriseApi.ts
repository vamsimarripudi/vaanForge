import { apiClient } from "@/services/apiClient";

async function csrf() {
  return apiClient<{ csrfToken: string }>("/security/csrf");
}

async function mutate<T>(path: string, method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown> = {}) {
  const token = await csrf();
  return apiClient<T>(path, { method, headers: { "x-csrf-token": token.csrfToken }, body: method === "DELETE" ? undefined : JSON.stringify(body) });
}

export const enterpriseApi = {
  pricing: () => apiClient<unknown[]>("/public/pricing"),
  workspace: () => apiClient<Record<string, unknown>>("/builder/workspace"),
  updateWorkspace: (payload: Record<string, unknown>) => mutate<Record<string, unknown>>("/builder/workspace", "PATCH", payload),
  team: () => apiClient<Record<string, unknown>>("/builder/team"),
  invite: (payload: Record<string, unknown>) => mutate<Record<string, unknown>>("/builder/team/invite", "POST", payload),
  updateMember: (memberId: string, payload: Record<string, unknown>) => mutate<Record<string, unknown>>(`/builder/team/${memberId}`, "PATCH", payload),
  deleteMember: (memberId: string) => mutate<Record<string, unknown>>(`/builder/team/${memberId}`, "DELETE"),
  auditLogs: () => apiClient<unknown[]>("/builder/security/audit-logs"),
  usageReports: () => apiClient<Record<string, unknown>>("/builder/usage/reports"),
  exportData: (exportScope: string[]) => mutate<Record<string, unknown>>("/builder/data/export", "POST", { exportScope }),
  deleteRequest: (reason: string) => mutate<Record<string, unknown>>("/builder/data/delete-request", "POST", { reason }),
  securityReport: () => apiClient<Record<string, unknown>>("/admin/agent/security/report"),
  reliabilityReport: () => apiClient<Record<string, unknown>>("/admin/agent/reliability/report"),
  complianceReport: () => apiClient<Record<string, unknown>>("/admin/agent/compliance/report"),
  launchReadiness: () => apiClient<Record<string, unknown>>("/admin/agent/launch-readiness")
};
