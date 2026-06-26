export type DeveloperMode = "dashboard" | "apps" | "apiKeys" | "docs" | "sdk" | "webhooks" | "plugins" | "usage";

export type DeveloperApp = {
  appId: string;
  name: string;
  description: string;
  status: string;
  scopes: string[];
  redirectUris: string[];
  nextAction: string;
};

export type DeveloperApiKey = {
  keyId: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: string;
  lastUsedAt?: string;
};

export type DeveloperPlugin = {
  pluginId: string;
  name: string;
  pluginType: string;
  version: string;
  status: string;
  nextAction: string;
};

export type DeveloperWebhook = {
  webhookId: string;
  url: string;
  events: string[];
  status: string;
  failureCount: number;
};
