import { Router, type Request } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { rateLimitMiddleware } from "../../middlewares/rate-limit.middleware";
import { providerReadinessService } from "./provider-readiness.service";

export const providerReadinessRouter = Router();

providerReadinessRouter.use(authMiddleware, requirePermission("settings:manage"), rateLimitMiddleware(60, 60));

providerReadinessRouter.get("/", (_request, response) => {
  response.json({ data: providerReadinessService.list() });
});

providerReadinessRouter.get("/readiness", (_request, response) => {
  response.json({ data: providerReadinessService.readiness() });
});

providerReadinessRouter.post("/:provider/health-check", (request, response) => {
  const parsed = z.object({ provider: z.string().min(2) }).safeParse(request.params);
  if (!parsed.success) return response.status(400).json({ error: "Invalid provider", issues: parsed.error.issues });
  try {
    response.status(201).json({ data: providerReadinessService.healthCheck(actor(request), parsed.data.provider) });
  } catch (error) {
    response.status(404).json({ error: "Provider health check failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

function actor(request: Request) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
