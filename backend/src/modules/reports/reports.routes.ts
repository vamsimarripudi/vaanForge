import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { auditService } from "../audit/audit.service";
import { reportsService } from "./reports.service";

export const reportsRouter = Router();

const exportSchema = z.object({
  reportType: z.enum(["PNL", "GST", "CASH_FLOW", "SALES", "HIRING", "SUPPORT", "COMPLIANCE", "FOUNDER_MONTHLY", "CA_EXPORT"]),
  format: z.enum(["PDF", "EXCEL"])
});

reportsRouter.get("/operating-system", authMiddleware, requirePermission("reports:export"), async (_request, response) => {
  response.json({ data: reportsService.reportsOs() });
});

reportsRouter.get("/exports", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await reportsService.listExports(organizationId) : [] });
});

reportsRouter.post("/exports", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = exportSchema.safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid report export request" });
    return;
  }

  const reportExport = await reportsService.queueExport(organizationId, parsed.data.reportType, parsed.data.format);
  auditService.record({
    actorId: request.session!.userId,
    organizationId,
    action: "FINANCE_ACTION",
    entityType: "ReportExport",
    entityId: reportExport.id,
    metadata: { ...reportExport, module: "reports" }
  });
  response.status(201).json({ data: reportExport });
});

reportsRouter.get("/exports/:exportId/download", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const reportExport = await reportsService.findExport(String(request.params.exportId));
  if (!reportExport) {
    response.status(404).json({ error: "Report export not found" });
    return;
  }

  response.setHeader("Content-Type", reportExport.mimeType);
  response.setHeader("Content-Disposition", `attachment; filename="${reportExport.fileName}"`);
  response.send(reportExport.content);
});
