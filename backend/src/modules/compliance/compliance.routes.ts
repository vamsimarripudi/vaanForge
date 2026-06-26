import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { complianceService } from "./compliance.service";

export const complianceRouter = Router();

const complianceStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]);
const registrationTypeSchema = z.enum(["INCORPORATION", "GST", "PAN_TAN", "DIN_DSC", "MCA_ROC", "TRADEMARK", "STARTUP_INDIA", "MSME_UDYAM"]);

complianceRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await complianceService.summary(organizationId) : { complianceItems: 0, completed: 0, overdue: 0, registrations: 0, registrationCompleted: 0, registrationInProgress: 0 } });
});

complianceRouter.get("/operating-system", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await complianceService.operatingSystem(organizationId)
      : { registrationCatalog: [], complianceCalendar: [], filingReminders: [], riskSummary: { overdue: 0, inProgressRegistrations: 0, openCalendarItems: 0 } }
  });
});

complianceRouter.get("/items", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await complianceService.listItems(organizationId) : [] });
});

complianceRouter.post("/items", authMiddleware, requirePermission("compliance:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ title: z.string().min(2), category: z.string().min(2), dueDate: z.string(), status: complianceStatusSchema.default("NOT_STARTED"), ownerId: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid compliance item request" });
    return;
  }
  const item = await complianceService.createItem({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "LEGAL_ACTION", entityType: "ComplianceItem", entityId: item.id, metadata: { ...item } });
  response.status(201).json({ data: item });
});

complianceRouter.patch("/items/:itemId/status", authMiddleware, requirePermission("compliance:manage"), async (request, response) => {
  const parsed = z.object({ status: complianceStatusSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid compliance status request" });
    return;
  }
  const item = await complianceService.updateItemStatus(String(request.params.itemId), parsed.data.status);
  if (!item) {
    response.status(404).json({ error: "Compliance item not found" });
    return;
  }
  auditService.record({ actorId: request.session!.userId, organizationId: item.organizationId, action: "LEGAL_ACTION", entityType: "ComplianceItem", entityId: item.id, metadata: { status: item.status } });
  response.json({ data: item });
});

complianceRouter.get("/registrations", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await complianceService.listRegistrations(organizationId) : [] });
});

complianceRouter.post("/registrations", authMiddleware, requirePermission("compliance:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ type: registrationTypeSchema, title: z.string().min(2), status: complianceStatusSchema.default("NOT_STARTED"), referenceNumber: z.string().optional(), dueDate: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid government registration request" });
    return;
  }
  const registration = await complianceService.createRegistration({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "LEGAL_ACTION", entityType: "GovernmentRegistration", entityId: registration.id, metadata: { ...registration } });
  response.status(201).json({ data: registration });
});

complianceRouter.patch("/registrations/:registrationId/status", authMiddleware, requirePermission("compliance:manage"), async (request, response) => {
  const parsed = z.object({ status: complianceStatusSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid registration status request" });
    return;
  }
  const registration = await complianceService.updateRegistrationStatus(String(request.params.registrationId), parsed.data.status);
  if (!registration) {
    response.status(404).json({ error: "Government registration not found" });
    return;
  }
  auditService.record({ actorId: request.session!.userId, organizationId: registration.organizationId, action: "LEGAL_ACTION", entityType: "GovernmentRegistration", entityId: registration.id, metadata: { status: registration.status } });
  response.json({ data: registration });
});
