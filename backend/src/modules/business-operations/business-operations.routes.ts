import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  businessOperationsService,
  businessReportSchema,
  healthActionSchema,
  infrastructureCostSchema,
  opportunityPatchSchema,
  opportunitySchema,
  providerCostSchema,
  subscriptionActionSchema,
  type BusinessActor
} from "./business-operations.service";

export const businessOperationsRouter = Router();

businessOperationsRouter.use(authMiddleware);

businessOperationsRouter.get("/", requirePermission("reports:export"), (request, response) => ok(response, businessOperationsService.executiveDashboard(actor(request))));
businessOperationsRouter.get("/executive", requirePermission("reports:export"), (request, response) => ok(response, businessOperationsService.executiveDashboard(actor(request))));
businessOperationsRouter.get("/crm/opportunities", requirePermission("organization:manage"), (request, response) => ok(response, businessOperationsService.opportunities(actor(request))));
businessOperationsRouter.post("/crm/opportunities", requirePermission("organization:manage"), route(opportunitySchema, (request, body) => businessOperationsService.createOpportunity(actor(request), body), 201));
businessOperationsRouter.patch("/crm/opportunities/:id", requirePermission("organization:manage"), route(opportunityPatchSchema, (request, body) => businessOperationsService.updateOpportunity(actor(request), String(request.params.id), body)));

businessOperationsRouter.get("/customer-success", requirePermission("support:manage"), (request, response) => ok(response, businessOperationsService.customerHealth(actor(request))));
businessOperationsRouter.post("/customer-success/:workspaceId/assign", requirePermission("support:manage"), route(healthActionSchema.pick({ successManagerId: true }).required({ successManagerId: true }), (request, body) => businessOperationsService.assignSuccessManager(actor(request), String(request.params.workspaceId), body.successManagerId)));
businessOperationsRouter.post("/customer-success/:workspaceId/follow-up", requirePermission("support:manage"), route(healthActionSchema, (request, body) => businessOperationsService.createFollowUp(actor(request), String(request.params.workspaceId), body), 201));

businessOperationsRouter.get("/subscription-operations", requirePermission("billing:manage"), (request, response) => ok(response, businessOperationsService.subscriptionOperations(actor(request))));
businessOperationsRouter.post("/subscription-operations/actions", requirePermission("billing:manage"), route(subscriptionActionSchema, (request, body) => businessOperationsService.performSubscriptionAction(actor(request), body), 201));

businessOperationsRouter.get("/ai-costs", requirePermission("finance:read"), (request, response) => ok(response, businessOperationsService.aiCosts(actor(request))));
businessOperationsRouter.post("/ai-costs", requirePermission("finance:write"), route(providerCostSchema, (request, body) => businessOperationsService.addProviderCost(actor(request), body), 201));
businessOperationsRouter.get("/infrastructure-costs", requirePermission("finance:read"), (request, response) => ok(response, businessOperationsService.infrastructureCosts(actor(request))));
businessOperationsRouter.post("/infrastructure-costs", requirePermission("finance:write"), route(infrastructureCostSchema, (request, body) => businessOperationsService.addInfrastructureCost(actor(request), body), 201));

businessOperationsRouter.get("/automation", requirePermission("reports:export"), (request, response) => ok(response, businessOperationsService.automationQueue(actor(request))));
businessOperationsRouter.get("/reports", requirePermission("reports:export"), (request, response) => ok(response, businessOperationsService.reports(actor(request))));
businessOperationsRouter.post("/reports", requirePermission("reports:export"), route(businessReportSchema, (request, body) => businessOperationsService.createBusinessReport(actor(request), body), 201));

function route<T extends z.ZodTypeAny>(schema: T, handler: (request: Request, body: z.infer<T>) => unknown, status = 200) {
  return (request: Request, response: Response) => {
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) return response.status(400).json({ error: "Validation failed", issues: parsed.error.issues, recoverable: true, nextAction: "Correct the request payload and retry." });
    try {
      response.status(status).json({ data: handler(request, parsed.data) });
    } catch (error) {
      response.status(404).json({ error: error instanceof Error ? error.message : "Request failed", recoverable: true, nextAction: "Refresh the resource and retry." });
    }
  };
}

function ok(response: Response, data: unknown) {
  response.json({ data });
}

function actor(request: Request): BusinessActor {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
