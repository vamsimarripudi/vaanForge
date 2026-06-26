import { apiClient } from "@/services/apiClient";
import type { AgentKnowledgeEntry, AgentMemoryEntry } from "../types.memory";

export const agentMemoryApi = {
  memory: () => apiClient<AgentMemoryEntry[]>("/admin/agent/memory"),
  createMemory: (payload: Record<string, unknown>) => apiClient<AgentMemoryEntry>("/admin/agent/memory", { method: "POST", body: JSON.stringify(payload) }),
  memoryDetail: (memoryId: string) => apiClient<AgentMemoryEntry>(`/admin/agent/memory/${memoryId}`),
  updateMemory: (memoryId: string, payload: Record<string, unknown>) => apiClient<AgentMemoryEntry>(`/admin/agent/memory/${memoryId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  action: (memoryId: string, action: "approve" | "reject" | "archive", payload: Record<string, unknown> = {}) => apiClient<AgentMemoryEntry>(`/admin/agent/memory/${memoryId}/${action}`, { method: "POST", body: JSON.stringify(payload) }),
  reviewQueue: () => apiClient<AgentMemoryEntry[]>("/admin/agent/memory/review"),
  knowledge: () => apiClient<AgentKnowledgeEntry[]>("/admin/agent/knowledge-base"),
  search: (payload: Record<string, unknown>) => apiClient<AgentKnowledgeEntry[]>("/admin/agent/knowledge-base/search", { method: "POST", body: JSON.stringify(payload) }),
  retrieve: (payload: Record<string, unknown>) => apiClient<Record<string, unknown>>("/admin/agent/knowledge-base/retrieve", { method: "POST", body: JSON.stringify(payload) })
};
