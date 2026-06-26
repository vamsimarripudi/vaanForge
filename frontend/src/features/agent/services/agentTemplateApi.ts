import { apiClient } from "@/services/apiClient";
import type { AgentRunDetail } from "../types";
import type { AgentTemplate, AgentTemplateVersion } from "../types.templates";

export type TemplatePayload = Omit<AgentTemplate, "templateId" | "status" | "version" | "createdBy" | "approvedBy" | "ownerId" | "nextAction" | "activityHistory" | "versions" | "qualityChecks" | "usageLogs"> & {
  changelog?: string;
};

export const agentTemplateApi = {
  templates: () => apiClient<AgentTemplate[]>("/admin/agent/templates"),
  marketplace: () => apiClient<AgentTemplate[]>("/admin/agent/marketplace"),
  template: (templateId: string) => apiClient<AgentTemplate>(`/admin/agent/templates/${templateId}`),
  marketplaceTemplate: (templateId: string) => apiClient<AgentTemplate>(`/admin/agent/marketplace/${templateId}`),
  create: (payload: TemplatePayload) => apiClient<AgentTemplate>("/admin/agent/templates", { method: "POST", body: JSON.stringify(payload) }),
  update: (templateId: string, payload: Partial<TemplatePayload>) => apiClient<AgentTemplate>(`/admin/agent/templates/${templateId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  versions: (templateId: string) => apiClient<AgentTemplateVersion[]>(`/admin/agent/templates/${templateId}/versions`),
  createVersion: (templateId: string, changelog: string) => apiClient<AgentTemplateVersion>(`/admin/agent/templates/${templateId}/versions`, { method: "POST", body: JSON.stringify({ changelog }) }),
  action: (templateId: string, action: "archive" | "clone" | "publish" | "unpublish" | "rollback", versionId?: string) =>
    apiClient<AgentTemplate>(`/admin/agent/templates/${templateId}/${action}`, { method: "POST", body: JSON.stringify({ versionId }) }),
  use: (templateId: string, inputValues: Record<string, unknown>) =>
    apiClient<AgentRunDetail>(`/admin/agent/templates/${templateId}/use`, { method: "POST", body: JSON.stringify({ inputValues }) })
};
