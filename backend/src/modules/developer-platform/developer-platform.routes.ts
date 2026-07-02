import { Router, type Request } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { apiKeySchema, developerAppSchema, developerPlatformService, gatewayRequestSchema, pluginSchema, webhookSchema } from "./developer-platform.service";

export const developerPlatformRouter = Router();
export const developerGatewayRouter = Router();

developerPlatformRouter.use(authMiddleware, rateLimitMiddleware(120, 60));

developerPlatformRouter.get("/dashboard", authMiddleware, (request, response) => response.json({ data: developerPlatformService.dashboard(actor(request)) }));
developerPlatformRouter.get("/apps", authMiddleware, (request, response) => response.json({ data: developerPlatformService.apps(actor(request)) }));
developerPlatformRouter.post("/apps", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = developerAppSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid developer app", issues: parsed.error.issues });
  response.status(201).json({ data: developerPlatformService.createApp(actor(request), parsed.data) });
});
developerPlatformRouter.get("/apps/:appId", authMiddleware, (request, response) => {
  const app = developerPlatformService.app(actor(request), String(request.params.appId));
  if (!app) return response.status(404).json({ error: "Developer app not found" });
  response.json({ data: app });
});
developerPlatformRouter.patch("/apps/:appId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const app = developerPlatformService.updateApp(actor(request), String(request.params.appId), request.body || {});
  if (!app) return response.status(404).json({ error: "Developer app not found" });
  response.json({ data: app });
});
developerPlatformRouter.delete("/apps/:appId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const app = developerPlatformService.deleteApp(actor(request), String(request.params.appId));
  if (!app) return response.status(404).json({ error: "Developer app not found" });
  response.json({ data: app });
});

developerPlatformRouter.get("/api-keys", authMiddleware, (request, response) => response.json({ data: developerPlatformService.keys(actor(request)) }));
developerPlatformRouter.post("/api-keys", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = apiKeySchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid API key request", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: developerPlatformService.createKey(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "API key creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.post("/api-keys/:keyId/rotate", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  try {
    response.json({ data: developerPlatformService.rotateKey(actor(request), String(request.params.keyId)) });
  } catch (error) {
    response.status(404).json({ error: "API key rotation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.post("/api-keys/:keyId/revoke", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  try {
    response.json({ data: developerPlatformService.revokeKey(actor(request), String(request.params.keyId)) });
  } catch (error) {
    response.status(404).json({ error: "API key revoke failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.delete("/api-keys/:keyId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  try {
    response.json({ data: developerPlatformService.deleteKey(actor(request), String(request.params.keyId)) });
  } catch (error) {
    response.status(404).json({ error: "API key delete failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

developerPlatformRouter.get("/sdk", authMiddleware, (request, response) => response.json({ data: developerPlatformService.sdkMetadata(actor(request)) }));
developerPlatformRouter.get("/plugins", authMiddleware, (request, response) => response.json({ data: developerPlatformService.plugins(actor(request)) }));
developerPlatformRouter.post("/plugins", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = pluginSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid plugin", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: developerPlatformService.registerPlugin(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Plugin registration failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

developerPlatformRouter.get("/webhooks", authMiddleware, (request, response) => response.json({ data: developerPlatformService.webhooks(actor(request)) }));
developerPlatformRouter.post("/webhooks", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = webhookSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid webhook", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: developerPlatformService.createWebhook(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Webhook creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.get("/webhooks/:webhookId", authMiddleware, (request, response) => {
  const webhook = developerPlatformService.webhook(actor(request), String(request.params.webhookId));
  if (!webhook) return response.status(404).json({ error: "Webhook not found" });
  response.json({ data: webhook });
});
developerPlatformRouter.patch("/webhooks/:webhookId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const webhook = developerPlatformService.updateWebhook(actor(request), String(request.params.webhookId), request.body || {});
  if (!webhook) return response.status(404).json({ error: "Webhook not found" });
  response.json({ data: webhook });
});
developerPlatformRouter.delete("/webhooks/:webhookId", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const webhook = developerPlatformService.deleteWebhook(actor(request), String(request.params.webhookId));
  if (!webhook) return response.status(404).json({ error: "Webhook not found" });
  response.json({ data: webhook });
});
developerPlatformRouter.post("/webhooks/:webhookId/test", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const result = developerPlatformService.testWebhook(actor(request), String(request.params.webhookId));
  if (!result) return response.status(404).json({ error: "Webhook not found" });
  response.status(202).json({ data: result });
});
developerPlatformRouter.get("/usage", authMiddleware, (request, response) => response.json({ data: developerPlatformService.usage(actor(request)) }));
developerPlatformRouter.get("/logs", authMiddleware, (request, response) => response.json({ data: developerPlatformService.logs(actor(request)) }));
developerPlatformRouter.get("/docs", authMiddleware, (request, response) => response.json({ data: developerPlatformService.sdkMetadata(actor(request)).apiSpec }));

developerGatewayRouter.use(rateLimitMiddleware(300, 60));
developerGatewayRouter.all("/:version/*", async (request, response) => {
  const wildcardPath = ((request.params as unknown as Record<string, string>)["0"] || "");
  const parsed = gatewayRequestSchema.safeParse({ method: request.method, path: `/${wildcardPath}`, body: request.body || {} });
  if (!parsed.success) return response.status(400).json({ success: false, apiVersion: request.params.version, error: "Invalid gateway request", issues: parsed.error.issues });
  try {
    const result = await developerPlatformService.gateway(String(request.params.version), request.header("x-kdp-api-key"), parsed.data);
    response.status(result.statusCode).json(result.body);
  } catch (error) {
    response.status(401).json({ success: false, apiVersion: request.params.version, error: error instanceof Error ? error.message : "Gateway authentication failed" });
  }
});

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
