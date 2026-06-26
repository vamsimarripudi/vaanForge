import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { legalService } from "./legal.service";

export const legalRouter = Router();

const agreementTypeSchema = z.enum(["FOUNDER_AGREEMENT", "COFOUNDER_AGREEMENT", "EMPLOYEE_AGREEMENT", "NDA", "CLIENT_AGREEMENT", "VENDOR_AGREEMENT", "TERMS", "PRIVACY", "REFUND_POLICY", "DATA_POLICY"]);
const documentStatusSchema = z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "SIGNED", "EXPIRED"]);

legalRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await legalService.summary(organizationId) : { agreements: 0, drafts: 0, inReview: 0, signed: 0, expiring: 0 } });
});

legalRouter.get("/operating-system", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await legalService.operatingSystem(organizationId)
      : { agreementCatalog: [], policyRegister: [], awarenessNotes: [], disclaimer: "Create a workspace to load legal operations." }
  });
});

legalRouter.get("/agreements", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await legalService.listAgreements(organizationId) : [] });
});

legalRouter.post("/agreements", authMiddleware, requirePermission("legal:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ type: agreementTypeSchema, title: z.string().min(2), partyName: z.string().optional(), status: documentStatusSchema.default("DRAFT"), expiresAt: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid agreement request" });
    return;
  }
  const agreement = await legalService.createAgreement({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "LEGAL_ACTION", entityType: "Agreement", entityId: agreement.id, metadata: { ...agreement } });
  response.status(201).json({ data: agreement });
});

legalRouter.patch("/agreements/:agreementId/status", authMiddleware, requirePermission("legal:manage"), async (request, response) => {
  const parsed = z.object({ status: documentStatusSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid agreement status request" });
    return;
  }
  const agreement = await legalService.updateStatus(String(request.params.agreementId), parsed.data.status);
  if (!agreement) {
    response.status(404).json({ error: "Agreement not found" });
    return;
  }
  auditService.record({ actorId: request.session!.userId, organizationId: agreement.organizationId, action: "LEGAL_ACTION", entityType: "Agreement", entityId: agreement.id, metadata: { status: agreement.status } });
  response.json({ data: agreement });
});
