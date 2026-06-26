import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { workspacesService } from "./workspaces.service";

export const workspacesRouter = Router();

const createWorkspaceSchema = z.object({
  organizationName: z.string().min(2),
  workspaceName: z.string().min(2),
  suiteType: z.enum(["EDUCATION_SUITE", "VMETRON_SUITE"]),
  planId: z.string()
});

workspacesRouter.post("/", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const parsed = createWorkspaceSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid workspace request", issues: parsed.error.issues });
    return;
  }

  try {
    const result = await workspacesService.create({ ...parsed.data, founderUserId: request.session!.userId });
    auditService.record({
      actorId: request.session!.userId,
      organizationId: result.organization.id,
      action: "WORKSPACE_CREATED",
      entityType: "Workspace",
      entityId: result.workspace.id,
      metadata: { suiteType: result.workspace.suiteType, planId: parsed.data.planId }
    });
    response.status(201).json({ data: result });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Workspace creation failed" });
  }
});

workspacesRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await workspacesService.listForOrganization(organizationId) : [] });
});
