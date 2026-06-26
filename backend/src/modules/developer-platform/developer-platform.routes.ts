import { Router, type Request } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { apiKeySchema, developerAppSchema, developerPlatformService, gatewayRequestSchema, pluginSchema, webhookSchema } from "./developer-platform.service";

export const developerPlatformRouter = Router();
export const developerGatewayRouter = Router();

developerPlatformRouter.use(authMiddleware, rateLimitMiddleware(120, 60));

developerPlatformRouter.get("/dashboard", (request, response) => response.json({ data: developerPlatformService.dashboard(actor(request)) }));
developerPlatformRouter.get("/apps", (request, response) => response.json({ data: developerPlatformService.apps(actor(request)) }));
developerPlatformRouter.post("/apps", (request, response) => {
  const parsed = developerAppSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid developer app", issues: parsed.error.issues });
  response.status(201).json({ data: developerPlatformService.createApp(actor(request), parsed.data) });
});

developerPlatformRouter.get("/api-keys", (request, response) => response.json({ data: developerPlatformService.keys(actor(request)) }));
developerPlatformRouter.post("/api-keys", (request, response) => {
  const parsed = apiKeySchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid API key request", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: developerPlatformService.createKey(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "API key creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.post("/api-keys/:keyId/rotate", (request, response) => {
  try {
    response.json({ data: developerPlatformService.rotateKey(actor(request), String(request.params.keyId)) });
  } catch (error) {
    response.status(404).json({ error: "API key rotation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.post("/api-keys/:keyId/revoke", (request, response) => {
  try {
    response.json({ data: developerPlatformService.revokeKey(actor(request), String(request.params.keyId)) });
  } catch (error) {
    response.status(404).json({ error: "API key revoke failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

developerPlatformRouter.get("/sdk", (request, response) => response.json({ data: developerPlatformService.sdkMetadata(actor(request)) }));
developerPlatformRouter.get("/plugins", (request, response) => response.json({ data: developerPlatformService.plugins(actor(request)) }));
developerPlatformRouter.post("/plugins", (request, response) => {
  const parsed = pluginSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid plugin", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: developerPlatformService.registerPlugin(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Plugin registration failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

developerPlatformRouter.get("/webhooks", (request, response) => response.json({ data: developerPlatformService.webhooks(actor(request)) }));
developerPlatformRouter.post("/webhooks", (request, response) => {
  const parsed = webhookSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid webhook", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: developerPlatformService.createWebhook(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Webhook creation failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});
developerPlatformRouter.get("/usage", (request, response) => response.json({ data: developerPlatformService.usage(actor(request)) }));
developerPlatformRouter.get("/docs", (request, response) => response.json({ data: developerPlatformService.sdkMetadata(actor(request)).apiSpec }));

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
