import { Router } from "express";
import type { Response } from "express";
import { ZodError } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { vaanForgeExecutionService } from "./vaanforge-execution.service";
import { vaanForgeService } from "./vaanforge.service";

export const vaanForgeRouter = Router();

vaanForgeRouter.post("/runs", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const requestedById = request.session?.userId;
  if (!organizationId || !requestedById) {
    response.status(400).json({ error: "Organization context is required" });
    return;
  }

  try {
    const requirement = isRecord(request.body) && "requirements" in request.body ? request.body.requirements : request.body;
    const result = await vaanForgeService.submit({ organizationId, requestedById, requirement });
    response.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "Invalid VaanForge requirement input", issues: error.issues });
      return;
    }
    response.status(500).json({ error: "VaanForge run failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

vaanForgeRouter.get("/runs", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeService.list(organizationId) : [] });
});

vaanForgeRouter.get("/runs/:runId", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  await respondWithRunDetail(request.session?.organizationId, String(request.params.runId), response);
});

vaanForgeRouter.get("/runs/:runId/requirements", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const requirements = organizationId ? await vaanForgeService.requirements(organizationId, String(request.params.runId)) : undefined;
  if (!requirements) {
    response.status(404).json({ error: "VaanForge run not found" });
    return;
  }
  response.json({ data: requirements });
});

vaanForgeRouter.get("/runs/:runId/plans", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeService.plans(organizationId, String(request.params.runId)) : [] });
});

vaanForgeRouter.get("/runs/:runId/audit-logs", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeService.auditLogs(organizationId, String(request.params.runId)) : [] });
});

vaanForgeRouter.post("/executions", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const requestedById = request.session?.userId;
  if (!organizationId || !requestedById || !isRecord(request.body) || typeof request.body.phaseOneRunId !== "string") {
    response.status(400).json({ error: "phaseOneRunId and organization context are required" });
    return;
  }

  try {
    const result = await vaanForgeExecutionService.submit({
      organizationId,
      requestedById,
      phaseOneRunId: request.body.phaseOneRunId,
      allowReviewedOverwrite: request.body.allowReviewedOverwrite === true
    });
    response.status(201).json({ data: result });
  } catch (error) {
    response.status(400).json({ error: "VaanForge execution failed", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

vaanForgeRouter.get("/executions", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeExecutionService.list(organizationId) : [] });
});

vaanForgeRouter.get("/executions/:executionId", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  await respondWithExecutionDetail(request.session?.organizationId, String(request.params.executionId), response);
});

vaanForgeRouter.get("/admin/runs", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeService.list(organizationId) : [] });
});

vaanForgeRouter.get("/admin/runs/:runId", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  await respondWithRunDetail(request.session?.organizationId, String(request.params.runId), response);
});

vaanForgeRouter.get("/admin/runs/:runId/requirements", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const requirements = organizationId ? await vaanForgeService.requirements(organizationId, String(request.params.runId)) : undefined;
  if (!requirements) {
    response.status(404).json({ error: "VaanForge run not found" });
    return;
  }
  response.json({ data: requirements });
});

vaanForgeRouter.get("/admin/runs/:runId/plans", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeService.plans(organizationId, String(request.params.runId)) : [] });
});

vaanForgeRouter.get("/admin/runs/:runId/audit-logs", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeService.auditLogs(organizationId, String(request.params.runId)) : [] });
});

vaanForgeRouter.get("/admin/executions", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await vaanForgeExecutionService.list(organizationId) : [] });
});

vaanForgeRouter.get("/admin/executions/:executionId", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  await respondWithExecutionDetail(request.session?.organizationId, String(request.params.executionId), response);
});

vaanForgeRouter.get("/admin/executions/:executionId/report", authMiddleware, requirePermission("audit:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const detail = organizationId ? await vaanForgeExecutionService.detail(organizationId, String(request.params.executionId)) : undefined;
  if (!detail) {
    response.status(404).json({ error: "VaanForge execution not found" });
    return;
  }
  response.json({
    data: {
      executionId: detail.executionId,
      status: detail.status,
      validationSummary: detail.validationSummary,
      executionReport: detail.executionReport,
      nextAction: detail.nextAction,
      errors: detail.errors,
      repairAttempts: detail.repairAttempts,
      commits: detail.commits
    }
  });
});

vaanForgeRouter.get("/health", authMiddleware, requirePermission("audit:read"), (_request, response) => {
  response.json({ data: vaanForgeService.health() });
});

async function respondWithRunDetail(organizationId: string | undefined, runId: string, response: Response) {
  const detail = organizationId ? await vaanForgeService.detail(organizationId, runId) : undefined;
  if (!detail) {
    response.status(404).json({ error: "VaanForge run not found" });
    return;
  }
  response.json({ data: detail });
}

async function respondWithExecutionDetail(organizationId: string | undefined, executionId: string, response: Response) {
  const detail = organizationId ? await vaanForgeExecutionService.detail(organizationId, executionId) : undefined;
  if (!detail) {
    response.status(404).json({ error: "VaanForge execution not found" });
    return;
  }
  response.json({ data: detail });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
