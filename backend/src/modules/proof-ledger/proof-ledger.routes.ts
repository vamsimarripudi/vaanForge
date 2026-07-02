import { Router, type Request, type Response } from "express";
import { requirePermission } from "../../guards/permission.guard";
import { sendError, zodFieldErrors } from "../../http/error-response";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { proofLedgerService, proofRecordSchema, type ProofActor } from "./proof-ledger.service";

export const proofLedgerRouter = Router();

proofLedgerRouter.use(authMiddleware);

proofLedgerRouter.get("/", requirePermission("audit:read"), (request, response) => {
  response.json({ data: proofLedgerService.list(actor(request)) });
});

proofLedgerRouter.get("/:proofId", requirePermission("audit:read"), (request, response) => {
  try {
    response.json({ data: proofLedgerService.detail(actor(request), proofId(request)) });
  } catch (error) {
    sendError(response, request, 404, {
      code: "NOT_FOUND",
      message: error instanceof Error ? error.message : "Proof record was not found.",
      recoverable: true,
      nextAction: "check_identifier"
    });
  }
});

proofLedgerRouter.post("/", requirePermission("audit:read"), async (request, response) => {
  const parsed = proofRecordSchema.safeParse(request.body || {});
  if (!parsed.success) {
    return sendError(response, request, 400, {
      code: "VALIDATION_ERROR",
      message: "Please correct the proof record payload.",
      fieldErrors: zodFieldErrors(parsed.error),
      recoverable: true,
      nextAction: "fix_fields"
    });
  }
  response.status(201).json({ data: await proofLedgerService.create(actor(request), parsed.data) });
});

proofLedgerRouter.post("/:proofId/verify", requirePermission("audit:read"), async (request, response) => {
  try {
    response.json({ data: await proofLedgerService.verify(actor(request), proofId(request)) });
  } catch (error) {
    sendError(response, request, 404, {
      code: "NOT_FOUND",
      message: error instanceof Error ? error.message : "Proof record was not found.",
      recoverable: true,
      nextAction: "check_identifier"
    });
  }
});

function actor(request: Request): ProofActor {
  return {
    organizationId: request.session!.organizationId!,
    userId: request.session!.userId,
    role: request.session!.role,
    requestId: request.requestId,
    ipAddress: request.ip,
    userAgent: request.header("user-agent")
  };
}

function proofId(request: Request) {
  const value = request.params.proofId;
  return Array.isArray(value) ? value[0] : value;
}
