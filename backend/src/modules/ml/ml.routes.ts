import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { sendError, zodFieldErrors } from "../../http/error-response";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { mlEnginesService, projectSchema, textSchema, type MlActor } from "./ml-engines.service";

export const mlRouter = Router();

mlRouter.use(authMiddleware);

mlRouter.post("/requirements/score", requirePermission("workspace:create"), route(textSchema, (request, body) => mlEnginesService.run(actor(request), mlEnginesService.requirementsQuality, body)));
mlRouter.post("/projects/complexity", requirePermission("workspace:create"), route(projectSchema, (request, body) => mlEnginesService.complexity(actor(request), body)));
mlRouter.post("/projects/estimate", requirePermission("workspace:create"), route(projectSchema, (request, body) => mlEnginesService.estimate(actor(request), body)));
mlRouter.post("/architecture/recommend", requirePermission("workspace:create"), route(projectSchema, (request, body) => mlEnginesService.architecture(actor(request), body)));
mlRouter.post("/templates/recommend", requirePermission("workspace:create"), route(projectSchema, (request, body) => mlEnginesService.template(actor(request), body)));
mlRouter.post("/risks/score", requirePermission("workspace:create"), route(textSchema, (request, body) => mlEnginesService.run(actor(request), mlEnginesService.riskScoring, body)));
mlRouter.post("/errors/classify", requirePermission("workspace:create"), route(textSchema, (request, body) => mlEnginesService.run(actor(request), mlEnginesService.errorClassification, body)));
mlRouter.post("/anomalies/detect", requirePermission("workspace:create"), route(textSchema, (request, body) => mlEnginesService.run(actor(request), mlEnginesService.anomalyDetection, body)));
mlRouter.post("/churn/predict", requirePermission("workspace:create"), route(z.record(z.unknown()), (request, body) => mlEnginesService.churn(actor(request), body)));
mlRouter.post("/upgrade-likelihood", requirePermission("workspace:create"), route(z.record(z.unknown()), (request, body) => mlEnginesService.upgradeLikelihood(actor(request), body)));
mlRouter.post("/prompts/risk-scan", requirePermission("workspace:create"), route(textSchema, (request, body) => mlEnginesService.run(actor(request), mlEnginesService.promptRiskScanner, body)));

function route<T extends z.ZodTypeAny>(schema: T, handler: (request: Request, body: z.infer<T>) => unknown) {
  return (request: Request, response: Response) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) {
      return sendError(response, request, 400, {
        code: "VALIDATION_ERROR",
        message: "Please correct the ML request payload.",
        fieldErrors: zodFieldErrors(parsed.error),
        recoverable: true,
        nextAction: "fix_fields"
      });
    }
    try {
      response.json({ data: handler(request, parsed.data) });
    } catch (error) {
      sendError(response, request, 400, {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "ML request failed.",
        recoverable: true,
        nextAction: "review_request"
      });
    }
  };
}

function actor(request: Request): MlActor {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
