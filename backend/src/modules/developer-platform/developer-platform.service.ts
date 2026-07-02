import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createId, store, type StoredApiKey, type StoredDeveloperApp, type StoredPluginRegistryEntry, type StoredWebhookEndpoint } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

type Actor = { organizationId: string; userId: string; role: string };

const webhookEvents = ["agent.lifecycle", "build.completed", "deployment.completed", "validation.failed", "billing.event", "workspace.event"] as const;
const pluginTypes = ["agent", "workflow", "template", "validation", "deployment", "event_hook"] as const;
const sdkLanguages = ["typescript", "flutter", "kotlin", "swift", "python", "java", "go"] as const;

export const developerAppSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(8),
  redirectUris: z.array(z.string().url()).default([]),
  scopes: z.array(z.string().min(2)).default(["agent:read"])
});

export const apiKeySchema = z.object({
  name: z.string().min(2),
  appId: z.string().optional(),
  scopes: z.array(z.string().min(2)).min(1).default(["agent:read"]),
  expiresAt: z.string().optional(),
  ipAllowlist: z.array(z.string()).default([])
});

export const pluginSchema = z.object({
  name: z.string().min(2),
  pluginType: z.enum(pluginTypes),
  version: z.string().min(1),
  manifest: z.record(z.unknown()),
  permissions: z.array(z.string()).default([]),
  status: z.enum(["draft", "review", "published", "disabled"]).default("review")
});

export const webhookSchema = z.object({
  appId: z.string().optional(),
  url: z.string().url(),
  events: z.array(z.enum(webhookEvents)).min(1),
  retryPolicy: z.record(z.unknown()).default({ maxAttempts: 5, backoffSeconds: [30, 120, 600] })
});

export const gatewayRequestSchema = z.object({
  method: z.string().default("GET"),
  path: z.string().min(1),
  body: z.record(z.unknown()).optional()
});

export class DeveloperPlatformService {
  dashboard(actor: Actor) {
    const account = this.ensureAccount(actor);
    const apps = this.apps(actor);
    const keys = this.keys(actor);
    const webhooks = this.webhooks(actor);
    const usage = this.usage(actor);
    return {
      account,
      totals: {
        apps: apps.length,
        activeKeys: keys.filter((key) => key.status === "active").length,
        webhooks: webhooks.length,
        plugins: this.plugins(actor).length,
        requestsToday: usage.requestsToday
      },
      recentUsage: store.apiUsageLogs.filter((log) => log.organizationId === actor.organizationId && log.developerId === account.developerId).slice(-10).reverse(),
      nextAction: "Create an app, issue a scoped API key, configure webhooks, then test through the versioned gateway."
    };
  }

  apps(actor: Actor) {
    const account = this.ensureAccount(actor);
    return store.developerApps.filter((app) => app.organizationId === actor.organizationId && app.developerId === account.developerId).map((app) => {
      const oauthClient = store.oauthClients.find((client) => client.appId === app.appId);
      return { ...app, oauthClient: oauthClient ? { ...oauthClient, clientSecretHash: "[hashed]" } : undefined };
    });
  }

  app(actor: Actor, appId: string) {
    return this.apps(actor).find((app) => app.appId === appId);
  }

  createApp(actor: Actor, input: z.infer<typeof developerAppSchema>) {
    const parsed = developerAppSchema.parse(input);
    const account = this.ensureAccount(actor);
    const now = new Date().toISOString();
    const app: StoredDeveloperApp = {
      id: createId("dapp"),
      appId: createId("app"),
      developerId: account.developerId,
      organizationId: actor.organizationId,
      name: sanitize(parsed.name),
      description: sanitize(parsed.description),
      status: "active",
      redirectUris: parsed.redirectUris,
      scopes: parsed.scopes,
      ownerId: actor.userId,
      priority: "HIGH",
      dueDate: inDays(30),
      nextAction: "Create API keys or OAuth credentials for this app.",
      activityHistory: [{ at: now, status: "active", message: "Developer app created." }],
      createdAt: now,
      updatedAt: now
    };
    store.developerApps.push(app);
    this.createOAuthClient(actor, app);
    this.audit(actor, "DEVELOPER_APP_CREATED", "DeveloperApp", app.appId, { scopes: app.scopes });
    return this.apps(actor).find((item) => item.appId === app.appId);
  }

  updateApp(actor: Actor, appId: string, input: Partial<z.infer<typeof developerAppSchema>>) {
    const account = this.ensureAccount(actor);
    const app = store.developerApps.find((item) => item.organizationId === actor.organizationId && item.developerId === account.developerId && item.appId === appId);
    if (!app) return undefined;
    const parsed = developerAppSchema.partial().parse(input);
    Object.assign(app, parsed.name ? { name: sanitize(parsed.name) } : {}, parsed.description ? { description: sanitize(parsed.description) } : {}, parsed.redirectUris ? { redirectUris: parsed.redirectUris } : {}, parsed.scopes ? { scopes: parsed.scopes } : {}, { updatedAt: new Date().toISOString() });
    app.activityHistory.push({ at: app.updatedAt, status: app.status, message: "Developer app updated." });
    this.audit(actor, "DEVELOPER_APP_UPDATED", "DeveloperApp", app.appId, { fields: Object.keys(parsed) });
    return this.app(actor, appId);
  }

  deleteApp(actor: Actor, appId: string) {
    const account = this.ensureAccount(actor);
    const app = store.developerApps.find((item) => item.organizationId === actor.organizationId && item.developerId === account.developerId && item.appId === appId);
    if (!app) return undefined;
    app.status = "disabled";
    app.updatedAt = new Date().toISOString();
    app.activityHistory.push({ at: app.updatedAt, status: app.status, message: "Developer app disabled." });
    this.audit(actor, "DEVELOPER_APP_DISABLED", "DeveloperApp", app.appId);
    return this.app(actor, appId);
  }

  keys(actor: Actor) {
    const account = this.ensureAccount(actor);
    return store.apiKeys
      .filter((key) => key.organizationId === actor.organizationId && key.developerId === account.developerId)
      .map((key) => this.redactKey(key));
  }

  createKey(actor: Actor, input: z.infer<typeof apiKeySchema>) {
    const parsed = apiKeySchema.parse(input);
    const account = this.ensureAccount(actor);
    if (parsed.appId && !store.developerApps.some((app) => app.organizationId === actor.organizationId && app.developerId === account.developerId && app.appId === parsed.appId)) throw new Error("Developer app not found.");
    const secret = `kdp_${randomBytes(24).toString("hex")}`;
    const now = new Date().toISOString();
    const item: StoredApiKey = {
      id: createId("ak"),
      keyId: createId("key"),
      developerId: account.developerId,
      appId: parsed.appId,
      organizationId: actor.organizationId,
      name: sanitize(parsed.name),
      keyHash: hashSecret(secret),
      prefix: secret.slice(0, 12),
      scopes: parsed.scopes,
      status: "active",
      expiresAt: parsed.expiresAt,
      ipAllowlist: parsed.ipAllowlist,
      createdAt: now,
      updatedAt: now
    };
    store.apiKeys.push(item);
    this.audit(actor, "API_KEY_CREATED", "ApiKey", item.keyId, { scopes: item.scopes, appId: item.appId });
    return { key: this.redactKey(item), secret };
  }

  rotateKey(actor: Actor, keyId: string) {
    const key = this.requireKey(actor, keyId);
    key.status = "rotated";
    key.updatedAt = new Date().toISOString();
    const rotated = this.createKey(actor, { name: `${key.name} rotation`, appId: key.appId, scopes: key.scopes, expiresAt: key.expiresAt, ipAllowlist: key.ipAllowlist });
    const newKey = store.apiKeys.find((item) => item.keyId === rotated.key.keyId);
    if (newKey) newKey.rotatedFromKeyId = key.keyId;
    this.audit(actor, "API_KEY_ROTATED", "ApiKey", key.keyId, { newKeyId: rotated.key.keyId });
    return rotated;
  }

  revokeKey(actor: Actor, keyId: string) {
    const key = this.requireKey(actor, keyId);
    key.status = "revoked";
    key.updatedAt = new Date().toISOString();
    this.audit(actor, "API_KEY_REVOKED", "ApiKey", key.keyId);
    return this.redactKey(key);
  }

  deleteKey(actor: Actor, keyId: string) {
    return this.revokeKey(actor, keyId);
  }

  sdkMetadata(actor: Actor) {
    this.ensureSdks(actor.organizationId);
    return {
      apiSpec: publicApiSpec(),
      sdks: store.sdkVersions.filter((sdk) => sdk.organizationId === actor.organizationId),
      cli: cliManifest(),
      nextAction: "Generate SDK packages from the current OpenAPI specification before publishing releases."
    };
  }

  plugins(actor: Actor) {
    const account = this.ensureAccount(actor);
    return store.pluginRegistry.filter((plugin) => plugin.organizationId === actor.organizationId && plugin.developerId === account.developerId);
  }

  registerPlugin(actor: Actor, input: z.infer<typeof pluginSchema>) {
    const parsed = pluginSchema.parse(input);
    const account = this.ensureAccount(actor);
    const now = new Date().toISOString();
    if (containsInjection(JSON.stringify(parsed.manifest))) throw new Error("Plugin manifest failed prompt-injection review.");
    const plugin: StoredPluginRegistryEntry = {
      id: createId("plg"),
      pluginId: createId("plugin"),
      organizationId: actor.organizationId,
      developerId: account.developerId,
      name: sanitize(parsed.name),
      pluginType: parsed.pluginType,
      version: parsed.version,
      manifest: maskRecord(parsed.manifest),
      permissions: parsed.permissions,
      status: parsed.status,
      ownerId: actor.userId,
      priority: "HIGH",
      dueDate: inDays(14),
      nextAction: parsed.status === "published" ? "Monitor plugin executions and compatibility." : "Review plugin manifest, permissions, and event hooks before publishing.",
      activityHistory: [{ at: now, status: parsed.status, message: "Plugin registered." }],
      createdAt: now,
      updatedAt: now
    };
    store.pluginRegistry.push(plugin);
    this.audit(actor, "PLUGIN_REGISTERED", "Plugin", plugin.pluginId, { pluginType: plugin.pluginType, permissions: plugin.permissions });
    return plugin;
  }

  webhooks(actor: Actor) {
    const account = this.ensureAccount(actor);
    return store.webhookEndpoints
      .filter((webhook) => webhook.organizationId === actor.organizationId && webhook.developerId === account.developerId)
      .map((webhook) => ({ ...webhook, signingSecretHash: "[hashed]" }));
  }

  webhook(actor: Actor, webhookId: string) {
    return this.webhooks(actor).find((webhook) => webhook.webhookId === webhookId);
  }

  createWebhook(actor: Actor, input: z.infer<typeof webhookSchema>) {
    const parsed = webhookSchema.parse(input);
    const account = this.ensureAccount(actor);
    if (parsed.appId && !store.developerApps.some((app) => app.organizationId === actor.organizationId && app.developerId === account.developerId && app.appId === parsed.appId)) throw new Error("Developer app not found.");
    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    const now = new Date().toISOString();
    const webhook: StoredWebhookEndpoint = {
      id: createId("wh"),
      webhookId: createId("webhook"),
      developerId: account.developerId,
      appId: parsed.appId,
      organizationId: actor.organizationId,
      url: parsed.url,
      events: parsed.events,
      signingSecretHash: hashSecret(secret),
      status: "active",
      retryPolicy: parsed.retryPolicy,
      failureCount: 0,
      createdAt: now,
      updatedAt: now
    };
    store.webhookEndpoints.push(webhook);
    this.audit(actor, "WEBHOOK_CREATED", "WebhookEndpoint", webhook.webhookId, { events: webhook.events, appId: webhook.appId });
    return { webhook: { ...webhook, signingSecretHash: "[hashed]" }, signingSecret: secret };
  }

  updateWebhook(actor: Actor, webhookId: string, input: Partial<z.infer<typeof webhookSchema>>) {
    const account = this.ensureAccount(actor);
    const webhook = store.webhookEndpoints.find((item) => item.organizationId === actor.organizationId && item.developerId === account.developerId && item.webhookId === webhookId);
    if (!webhook) return undefined;
    const parsed = webhookSchema.partial().parse(input);
    Object.assign(webhook, parsed.url ? { url: parsed.url } : {}, parsed.events ? { events: parsed.events } : {}, parsed.retryPolicy ? { retryPolicy: parsed.retryPolicy } : {}, { updatedAt: new Date().toISOString() });
    this.audit(actor, "WEBHOOK_UPDATED", "WebhookEndpoint", webhook.webhookId, { fields: Object.keys(parsed) });
    return this.webhook(actor, webhookId);
  }

  deleteWebhook(actor: Actor, webhookId: string) {
    const account = this.ensureAccount(actor);
    const webhook = store.webhookEndpoints.find((item) => item.organizationId === actor.organizationId && item.developerId === account.developerId && item.webhookId === webhookId);
    if (!webhook) return undefined;
    webhook.status = "paused";
    webhook.updatedAt = new Date().toISOString();
    this.audit(actor, "WEBHOOK_DISABLED", "WebhookEndpoint", webhook.webhookId);
    return this.webhook(actor, webhookId);
  }

  testWebhook(actor: Actor, webhookId: string) {
    const webhook = store.webhookEndpoints.find((item) => item.organizationId === actor.organizationId && item.webhookId === webhookId);
    if (!webhook) return undefined;
    const payload = { type: "workspace.event", webhookId, test: true, createdAt: new Date().toISOString() };
    const signature = this.signWebhookPayload(webhookId, payload);
    this.logUsage({ organizationId: actor.organizationId, developerId: webhook.developerId, appId: webhook.appId, apiVersion: "v1", method: "POST", path: `/developer/webhooks/${webhookId}/test`, statusCode: 202, latencyMs: 0 });
    this.audit(actor, "WEBHOOK_TEST_SENT", "WebhookEndpoint", webhookId, { events: webhook.events });
    return { delivered: true, webhookId, payload, signature };
  }

  signWebhookPayload(webhookId: string, payload: Record<string, unknown>, timestamp = Date.now().toString()) {
    const webhook = store.webhookEndpoints.find((item) => item.webhookId === webhookId);
    if (!webhook) throw new Error("Webhook endpoint not found.");
    return {
      timestamp,
      signature: createHmac("sha256", webhook.signingSecretHash).update(`${timestamp}.${JSON.stringify(payload)}`).digest("hex")
    };
  }

  usage(actor: Actor) {
    const account = this.ensureAccount(actor);
    const logs = store.apiUsageLogs.filter((log) => log.organizationId === actor.organizationId && log.developerId === account.developerId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      requestsToday: logs.filter((log) => log.createdAt.startsWith(today)).length,
      totalRequests: logs.length,
      errorCount: logs.filter((log) => log.statusCode >= 400).length,
      averageLatencyMs: logs.length ? Math.round(logs.reduce((sum, log) => sum + log.latencyMs, 0) / logs.length) : 0,
      byVersion: groupCount(logs.map((log) => log.apiVersion)),
      recent: logs.slice(-50).reverse()
    };
  }

  logs(actor: Actor) {
    const account = this.ensureAccount(actor);
    return store.apiUsageLogs.filter((log) => log.organizationId === actor.organizationId && log.developerId === account.developerId).slice(-100).reverse().map((log) => ({ ...log, keyId: log.keyId ? `${String(log.keyId).slice(0, 8)}...` : undefined }));
  }

  async gateway(apiVersion: string, rawKey: string | undefined, request: z.infer<typeof gatewayRequestSchema>) {
    const started = Date.now();
    const parsed = gatewayRequestSchema.parse(request);
    const key = this.authenticateKey(rawKey);
    const rate = this.consumeRateLimit(key);
    const statusCode = rate.allowed ? 200 : 429;
    const payload = rate.allowed ? this.gatewayPayload(apiVersion, parsed.path, parsed.body) : { error: { code: "rate_limited", message: "API rate limit exceeded.", resetAt: rate.resetAt } };
    this.logUsage({
      organizationId: key.organizationId,
      developerId: key.developerId,
      appId: key.appId,
      keyId: key.keyId,
      apiVersion,
      method: parsed.method,
      path: parsed.path,
      statusCode,
      latencyMs: Date.now() - started
    });
    return { statusCode, body: standardResponse(apiVersion, payload, statusCode < 400) };
  }

  private ensureAccount(actor: Actor) {
    let account = store.developerAccounts.find((item) => item.organizationId === actor.organizationId && item.userId === actor.userId);
    if (!account) {
      const now = new Date().toISOString();
      account = { id: createId("dev"), developerId: createId("developer"), organizationId: actor.organizationId, userId: actor.userId, displayName: `Developer ${actor.userId}`, status: "active", ownerId: actor.userId, priority: "HIGH", dueDate: inDays(30), nextAction: "Create a developer app and issue scoped credentials.", activityHistory: [{ at: now, status: "active", message: "Developer account initialized." }], createdAt: now, updatedAt: now };
      store.developerAccounts.push(account);
      this.audit(actor, "DEVELOPER_ACCOUNT_CREATED", "DeveloperAccount", account.developerId);
    }
    return account;
  }

  private createOAuthClient(actor: Actor, app: StoredDeveloperApp) {
    const secret = `oauth_${randomBytes(24).toString("hex")}`;
    store.oauthClients.push({ id: createId("oauth"), clientId: createId("client"), appId: app.appId, developerId: app.developerId, organizationId: app.organizationId, clientSecretHash: hashSecret(secret), redirectUris: app.redirectUris, scopes: app.scopes, grantTypes: ["authorization_code", "refresh_token"], status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    this.audit(actor, "OAUTH_CLIENT_CREATED", "OAuthClient", app.appId, { scopes: app.scopes });
  }

  private ensureSdks(organizationId: string) {
    if (store.sdkVersions.some((sdk) => sdk.organizationId === organizationId)) return;
    const spec = publicApiSpec();
    for (const language of sdkLanguages) {
      const packageName = language === "typescript" ? "@kravia/kdp" : `kravia-kdp-${language}`;
      const checksum = hashSecret(`${spec.version}:${language}:${packageName}`);
      store.sdkVersions.push({ id: createId("sdk"), sdkId: createId("sdk"), organizationId, language, packageName, version: "1.0.0", apiSpecVersion: spec.version, downloadUrl: `/developers/sdk/${language}`, checksum, status: "current", generatedFromSpec: spec.specId, createdAt: new Date().toISOString() });
    }
  }

  private requireKey(actor: Actor, keyId: string) {
    const account = this.ensureAccount(actor);
    const key = store.apiKeys.find((item) => item.organizationId === actor.organizationId && item.developerId === account.developerId && item.keyId === keyId);
    if (!key) throw new Error("API key not found.");
    return key;
  }

  private authenticateKey(rawKey: string | undefined) {
    if (!rawKey) throw new Error("Missing API key.");
    const hashed = hashSecret(rawKey);
    const key = store.apiKeys.find((item) => item.status === "active" && safeEqual(item.keyHash, hashed));
    if (!key) throw new Error("Invalid API key.");
    if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) throw new Error("API key expired.");
    key.lastUsedAt = new Date().toISOString();
    return key;
  }

  private consumeRateLimit(key: StoredApiKey) {
    const now = new Date();
    const windowKey = `${key.keyId}:${now.toISOString().slice(0, 13)}`;
    const reset = new Date(now);
    reset.setHours(reset.getHours() + 1, 0, 0, 0);
    let limit = store.apiRateLimits.find((item) => item.keyId === key.keyId && item.windowKey === windowKey);
    if (!limit) {
      limit = { id: createId("arl"), limitId: createId("limit"), organizationId: key.organizationId, developerId: key.developerId, keyId: key.keyId, windowKey, limit: 1000, used: 0, resetAt: reset.toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString() };
      store.apiRateLimits.push(limit);
    }
    limit.used += 1;
    limit.updatedAt = now.toISOString();
    return { allowed: limit.used <= limit.limit, resetAt: limit.resetAt };
  }

  private gatewayPayload(apiVersion: string, path: string, body?: Record<string, unknown>) {
    if (apiVersion !== "v1") return { error: { code: "unsupported_version", message: "Only v1 is currently supported." } };
    if (path === "/catalog") return { products: ["VaanForge AI", "VFormix", "VMetron", "VaanMeet", "VidyaLuma"], spec: publicApiSpec() };
    if (path === "/events") return { acceptedEvents: webhookEvents, received: body || {} };
    return { path, message: "Gateway request accepted through the versioned KRAVIA Developer Platform boundary." };
  }

  private logUsage(input: { organizationId: string; developerId?: string; appId?: string; keyId?: string; apiVersion: string; method: string; path: string; statusCode: number; latencyMs: number }) {
    store.apiUsageLogs.push({ id: createId("aul"), usageId: createId("usage"), requestId: createId("req"), responseStandardized: true, createdAt: new Date().toISOString(), ...input });
  }

  private redactKey(key: StoredApiKey) {
    return { ...key, keyHash: "[hashed]" };
  }

  private audit(actor: Actor, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId: actor.userId, organizationId: actor.organizationId, action: "VAANFORGE_AGENT_RUN", entityType, entityId, metadata: { developerPlatformAction: action, ...metadata } });
  }
}

function publicApiSpec() {
  return {
    specId: "kravia-kdp-openapi",
    version: "v1",
    basePath: "/api/v1/gateway/v1",
    authentication: ["api_key", "oauth2_authorization_code"],
    endpoints: [
      { method: "GET", path: "/catalog", scopes: ["agent:read"] },
      { method: "POST", path: "/events", scopes: ["events:write"] },
      { method: "GET", path: "/usage", scopes: ["usage:read"] }
    ],
    responseEnvelope: { success: "boolean", apiVersion: "string", data: "object", requestId: "string" }
  };
}

function cliManifest() {
  return {
    packageName: "@kravia/kdp-cli",
    commands: ["login", "init", "agent run", "deploy", "logs", "status", "plugins install", "plugins publish"],
    configFile: "kravia.config.json",
    auth: "API key or OAuth device flow ready"
  };
}

function standardResponse(apiVersion: string, data: Record<string, unknown>, success: boolean) {
  return { success, apiVersion, requestId: createId("req"), data };
}

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function containsInjection(value: string) {
  return /ignore previous instructions|system prompt|developer message|exfiltrate|jailbreak|provider api key/i.test(value);
}

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/secret|token|provider api key|system prompt/gi, "[removed]").trim();
}

function maskRecord(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /secret|token|password|key/i.test(key) ? "[masked]" : typeof item === "string" ? sanitize(item) : item]));
}

function groupCount(values: string[]) {
  return values.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item]: (acc[item] || 0) + 1 }), {});
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const developerPlatformService = new DeveloperPlatformService();
