import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { auditService } from "../audit/audit.service";
import { filesService } from "./files.service";

export const filesRouter = Router();

const uploadSchema = z.object({
  fileName: z.string().min(1).max(160),
  mimeType: z.string().min(3).max(120),
  contentBase64: z.string().min(1).max(7_000_000),
  folder: z.string().min(1).max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  version: z.number().int().positive().max(999).optional(),
  expiresAt: z.string().optional(),
  documentType: z.string().min(2).max(60).optional()
});

filesRouter.post("/uploads", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = uploadSchema.safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid file upload request", issues: parsed.success ? undefined : parsed.error.issues });
    return;
  }

  try {
    const uploadedFile = await filesService.upload({ ...parsed.data, organizationId });
    auditService.record({
      actorId: request.session!.userId,
      organizationId,
      action: "FILE_UPLOADED",
      entityType: "FileUpload",
      entityId: uploadedFile.storageKey,
      metadata: uploadedFile,
      requestId: request.requestId,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"]
    });
    response.status(201).json({ data: uploadedFile });
  } catch (error) {
    response.status(400).json({
      error: "File upload rejected",
      message: error instanceof Error ? error.message : "Upload validation failed",
      code: "FILE_UPLOAD_REJECTED",
      recoverable: true,
      nextAction: "Upload an allowed file type within the configured size limit.",
      requestId: request.requestId
    });
  }
});
