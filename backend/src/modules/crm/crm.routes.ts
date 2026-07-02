import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { businessOperationsService, opportunityPatchSchema, opportunitySchema } from "../business-operations/business-operations.service";
import { crmService } from "./crm.service";

export const crmRouter = Router();

const leadStageSchema = z.enum(["NEW", "CONTACTED", "DEMO_SCHEDULED", "PROPOSAL_SENT", "WON", "LOST"]);

crmRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await crmService.summary(organizationId) : { leads: 0, customers: 0, expectedPipeline: 0, won: 0, demoScheduled: 0 } });
});

crmRouter.get("/sales-operations", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await crmService.salesOperations(organizationId)
      : {
          deals: [],
          followUps: [],
          demoScheduling: [],
          proposals: [],
          objections: [],
          renewals: [],
          salesPsychologyAssistant: { mode: "empty", prompts: [], nextBestAction: "Create a workspace to load sales operations." }
        }
  });
});

crmRouter.get("/customer-portal", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await crmService.customerPortal(organizationId)
      : {
          subscription: [],
          invoices: [],
          supportTickets: [],
          productAccess: [],
          announcements: [],
          documents: [],
          renewalStatus: []
        }
  });
});

crmRouter.get("/leads", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await crmService.listLeads(organizationId) : [] });
});

crmRouter.post("/leads", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z
    .object({
      name: z.string().min(2),
      company: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      source: z.string().optional(),
      stage: leadStageSchema.default("NEW"),
      expectedValue: z.number().nonnegative().optional()
    })
    .safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid lead request" });
    return;
  }
  response.status(201).json({ data: await crmService.createLead({ ...parsed.data, organizationId }) });
});

crmRouter.patch("/leads/:leadId/stage", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const parsed = z.object({ stage: leadStageSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid lead stage request" });
    return;
  }
  const lead = await crmService.updateLeadStage(String(request.params.leadId), parsed.data.stage);
  if (!lead) {
    response.status(404).json({ error: "Lead not found" });
    return;
  }
  response.json({ data: lead });
});

crmRouter.patch("/leads/:leadId", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const parsed = z.object({ stage: leadStageSchema.optional(), expectedValue: z.number().nonnegative().optional() }).safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid lead update", issues: parsed.error.issues });
  let lead = await crmService.listLeads(request.session!.organizationId!);
  const current = lead.find((item) => item.id === String(request.params.leadId));
  if (!current) return response.status(404).json({ error: "Lead not found" });
  if (parsed.data.stage) await crmService.updateLeadStage(current.id, parsed.data.stage);
  if (parsed.data.expectedValue !== undefined) current.expectedValue = parsed.data.expectedValue;
  response.json({ data: { ...current, ...parsed.data } });
});

crmRouter.get("/opportunities", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  response.json({ data: businessOperationsService.opportunities(actor(request)) });
});

crmRouter.post("/opportunities", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = opportunitySchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid opportunity request", issues: parsed.error.issues });
  response.status(201).json({ data: businessOperationsService.createOpportunity(actor(request), parsed.data) });
});

crmRouter.patch("/opportunities/:id", authMiddleware, requirePermission("organization:manage"), (request, response) => {
  const parsed = opportunityPatchSchema.safeParse(request.body || {});
  if (!parsed.success) return response.status(400).json({ error: "Invalid opportunity update", issues: parsed.error.issues });
  try {
    response.json({ data: businessOperationsService.updateOpportunity(actor(request), String(request.params.id), parsed.data) });
  } catch (error) {
    response.status(404).json({ error: error instanceof Error ? error.message : "Opportunity not found" });
  }
});

crmRouter.get("/customers", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await crmService.listCustomers(organizationId) : [] });
});

crmRouter.post("/customers", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), email: z.string().email().optional(), activePlan: z.string().optional(), renewalDate: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid customer request" });
    return;
  }
  response.status(201).json({ data: await crmService.createCustomer({ ...parsed.data, organizationId }) });
});

function actor(request: any) {
  return { organizationId: request.session!.organizationId!, userId: request.session!.userId, role: request.session!.role };
}
