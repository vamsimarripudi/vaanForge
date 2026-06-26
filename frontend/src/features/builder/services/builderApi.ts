import { apiClient } from "@/services/apiClient";
import type { BuilderBlueprint, BuilderChangeRequest, BuilderListResponse, BuilderOutput, BuilderProgress, BuilderProject } from "../types";

export type BuilderProjectPayload = {
  name: string;
  description: string;
  templateId?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  targetUsers: string[];
  goals: string[];
  features: string[];
  successMetrics: string[];
};

export type BuilderRequirementPayload = {
  problemStatement: string;
  targetUsers: string[];
  goals: string[];
  features: string[];
  successMetrics: string[];
  constraints: string[];
  integrations: string[];
  dataEntities: string[];
};

export const builderApi = {
  list: () => apiClient<BuilderListResponse>("/builder/projects"),
  create: (payload: BuilderProjectPayload) => apiClient<BuilderProject>("/builder/projects", { method: "POST", body: JSON.stringify(payload) }),
  project: (projectId: string) => apiClient<BuilderProject>(`/builder/projects/${projectId}`),
  update: (projectId: string, payload: Partial<BuilderProjectPayload>) => apiClient<BuilderProject>(`/builder/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  requirements: (projectId: string, payload: BuilderRequirementPayload) => apiClient<BuilderProject>(`/builder/projects/${projectId}/requirements`, { method: "POST", body: JSON.stringify(payload) }),
  blueprint: (projectId: string) => apiClient<BuilderBlueprint>(`/builder/projects/${projectId}/blueprint`),
  approveBlueprint: (projectId: string) => apiClient<BuilderProject>(`/builder/projects/${projectId}/blueprint/approve`, { method: "POST", body: JSON.stringify({}) }),
  rejectBlueprint: (projectId: string, reason: string) => apiClient<BuilderProject>(`/builder/projects/${projectId}/blueprint/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  progress: (projectId: string) => apiClient<BuilderProgress>(`/builder/projects/${projectId}/progress`),
  outputs: (projectId: string) => apiClient<BuilderOutput[]>(`/builder/projects/${projectId}/outputs`),
  changeRequest: (projectId: string, payload: Pick<BuilderChangeRequest, "summary" | "details">) =>
    apiClient<BuilderChangeRequest>(`/builder/projects/${projectId}/change-requests`, { method: "POST", body: JSON.stringify(payload) })
};
