import { apiClient } from "@/services/apiClient";

export const developerApi = {
  dashboard: () => apiClient<Record<string, unknown>>("/developers/dashboard"),
  apps: () => apiClient<Array<Record<string, unknown>>>("/developers/apps"),
  createApp: (payload: Record<string, unknown>) => apiClient<Record<string, unknown>>("/developers/apps", { method: "POST", body: JSON.stringify(payload) }),
  apiKeys: () => apiClient<Array<Record<string, unknown>>>("/developers/api-keys"),
  createApiKey: (payload: Record<string, unknown>) => apiClient<Record<string, unknown>>("/developers/api-keys", { method: "POST", body: JSON.stringify(payload) }),
  rotateApiKey: (keyId: string) => apiClient<Record<string, unknown>>(`/developers/api-keys/${keyId}/rotate`, { method: "POST" }),
  revokeApiKey: (keyId: string) => apiClient<Record<string, unknown>>(`/developers/api-keys/${keyId}/revoke`, { method: "POST" }),
  docs: () => apiClient<Record<string, unknown>>("/developers/docs"),
  sdk: () => apiClient<Record<string, unknown>>("/developers/sdk"),
  webhooks: () => apiClient<Array<Record<string, unknown>>>("/developers/webhooks"),
  createWebhook: (payload: Record<string, unknown>) => apiClient<Record<string, unknown>>("/developers/webhooks", { method: "POST", body: JSON.stringify(payload) }),
  plugins: () => apiClient<Array<Record<string, unknown>>>("/developers/plugins"),
  registerPlugin: (payload: Record<string, unknown>) => apiClient<Record<string, unknown>>("/developers/plugins", { method: "POST", body: JSON.stringify(payload) }),
  usage: () => apiClient<Record<string, unknown>>("/developers/usage")
};
