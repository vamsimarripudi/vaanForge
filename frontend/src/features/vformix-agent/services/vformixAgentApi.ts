import { apiClient } from "@/services/apiClient";
import type { VFormixAgentConfig, VFormixAgentFieldMapping, VFormixAgentSubmissionStatus, VFormixAgentTrigger } from "../types";

export type VFormixAgentConfigPayload = Pick<VFormixAgentConfig, "enabled" | "defaultTemplateId" | "ownerId" | "priority" | "dueDate" | "status">;

export const vformixAgentApi = {
  config: (formId: string) => apiClient<VFormixAgentConfig>(`/admin/vformix/forms/${formId}/agent`),
  updateConfig: (formId: string, payload: VFormixAgentConfigPayload) =>
    apiClient<VFormixAgentConfig>(`/admin/vformix/forms/${formId}/agent`, { method: "PATCH", body: JSON.stringify(payload) }),
  mapping: (formId: string) => apiClient<VFormixAgentFieldMapping[]>(`/admin/vformix/forms/${formId}/agent/mapping`),
  updateMapping: (formId: string, mappings: VFormixAgentFieldMapping[]) =>
    apiClient<VFormixAgentFieldMapping[]>(`/admin/vformix/forms/${formId}/agent/mapping`, { method: "PATCH", body: JSON.stringify({ mappings }) }),
  triggers: (formId: string) => apiClient<VFormixAgentTrigger[]>(`/admin/vformix/forms/${formId}/agent/triggers`),
  updateTriggers: (formId: string, triggers: VFormixAgentTrigger[]) =>
    apiClient<VFormixAgentTrigger[]>(`/admin/vformix/forms/${formId}/agent/triggers`, { method: "PATCH", body: JSON.stringify({ triggers }) }),
  runSubmission: (submissionId: string, payload: { formId: string; rawSubmission: Record<string, unknown>; allowDuplicate?: boolean; startCodingAfterBlueprint?: boolean }) =>
    apiClient<VFormixAgentSubmissionStatus>(`/admin/vformix/submissions/${submissionId}/agent/run`, {
      method: "POST",
      body: JSON.stringify({ ...payload, triggerType: "manual" })
    }),
  status: (submissionId: string) => apiClient<VFormixAgentSubmissionStatus>(`/admin/vformix/submissions/${submissionId}/agent/status`)
};
