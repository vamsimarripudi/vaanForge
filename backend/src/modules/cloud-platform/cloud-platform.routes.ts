import { Router, type Request, type Response } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import {
  cloudPlatformService,
  configSchema,
  controlActionSchema,
  eventPublishSchema,
  jobSchema,
  messageSchema,
  secretSchema,
  serviceRegistrationSchema,
  storageObjectSchema
} from "./cloud-platform.service";

export const cloudIdentityRouter = Router();
export const cloudGatewayRouter = Router();
export const cloudServicesRouter = Router();
export const cloudEventsRouter = Router();
export const cloudStorageRouter = Router();
export const cloudSecretsRouter = Router();
export const cloudConfigRouter = Router();
export const cloudMessagingRouter = Router();
export const cloudAiRouter = Router();
export const cloudBuildRouter = Router();
export const cloudDeployRouter = Router();
export const cloudMonitorRouter = Router();
export const cloudConsoleRouter = Router();

for (const router of [
  cloudIdentityRouter,
  cloudGatewayRouter,
  cloudServicesRouter,
  cloudEventsRouter,
  cloudStorageRouter,
  cloudSecretsRouter,
  cloudConfigRouter,
  cloudMessagingRouter,
  cloudAiRouter,
  cloudBuildRouter,
  cloudDeployRouter,
  cloudMonitorRouter,
  cloudConsoleRouter
]) {
  router.use(authMiddleware, requirePermission("audit:read"), rateLimitMiddleware(120, 60));
}

cloudIdentityRouter.get("/cloud", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.identity(actor(request)) }));
cloudGatewayRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.gateway(actor(request)) }));

cloudServicesRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.services(actor(request)) }));
cloudServicesRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = serviceRegistrationSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid service registration", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.registerService(actor(request), parsed.data) });
});

cloudEventsRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.events(actor(request)) }));
cloudEventsRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = eventPublishSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid cloud event", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.publishEvent(actor(request), parsed.data) });
});

cloudStorageRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.storage(actor(request)) }));
cloudStorageRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = storageObjectSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid storage object", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.createStorageObject(actor(request), parsed.data) });
});

cloudSecretsRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.secrets(actor(request)) }));
cloudSecretsRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = secretSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid secret metadata", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.createSecret(actor(request), parsed.data) });
});

cloudConfigRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.configurations(actor(request)) }));
cloudConfigRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = configSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid configuration", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.setConfiguration(actor(request), parsed.data) });
});

cloudMessagingRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.messages(actor(request)) }));
cloudMessagingRouter.post("/", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = messageSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid message", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.queueMessage(actor(request), parsed.data) });
});

cloudAiRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.ai(actor(request)) }));
cloudAiRouter.post("/runs", authMiddleware, requirePermission("settings:manage"), (request, response) => createJob(request, response, "ai_run"));

cloudBuildRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.build(actor(request)) }));
cloudBuildRouter.post("/jobs", authMiddleware, requirePermission("settings:manage"), (request, response) => createJob(request, response, "build"));

cloudDeployRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.deploy(actor(request)) }));
cloudDeployRouter.post("/jobs", authMiddleware, requirePermission("settings:manage"), (request, response) => createJob(request, response, "deploy"));

cloudMonitorRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.monitor(actor(request)) }));
cloudMonitorRouter.get("/observability", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.observability(actor(request)) }));

cloudConsoleRouter.get("/", authMiddleware, (request, response) => response.json({ data: cloudPlatformService.console(actor(request)) }));
cloudConsoleRouter.post("/control", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = controlActionSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid cloud control action", issues: parsed.error.issues });
  try {
    response.json({ data: cloudPlatformService.control(actor(request), parsed.data) });
  } catch (error) {
    response.status(400).json({ error: "Cloud control action failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function createJob(request: Request, response: Response, jobType: "ai_run" | "build" | "deploy") {
  const parsed = jobSchema.safeParse({ ...(request.body || {}), jobType });
  if (!parsed.success) return response.status(400).json({ error: "Invalid cloud job", issues: parsed.error.issues });
  response.status(201).json({ data: cloudPlatformService.createJob(actor(request), parsed.data) });
}

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
