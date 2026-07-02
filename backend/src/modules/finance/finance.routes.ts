import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { financeService } from "./finance.service";

export const financeRouter = Router();

const moneySchema = z.number().positive().finite();

financeRouter.get("/summary", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  response.json({ data: await financeService.summary(organizationId) });
});

financeRouter.get("/overview", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) return response.status(404).json({ error: "No organization is active for this session" });
  response.json({ data: await financeService.summary(organizationId) });
});

financeRouter.get("/revenue", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await financeService.listRevenue(organizationId) : [] });
});

financeRouter.post("/revenue", authMiddleware, requirePermission("finance:write"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ source: z.string().min(2), amount: moneySchema, receivedAt: z.string(), product: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid revenue request" });
    return;
  }
  const revenue = await financeService.addRevenue({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "FINANCE_ACTION", entityType: "Revenue", entityId: revenue.id, metadata: { ...revenue } });
  response.status(201).json({ data: revenue });
});

financeRouter.get("/expenses", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await financeService.listExpenses(organizationId) : [] });
});

financeRouter.post("/expenses", authMiddleware, requirePermission("finance:write"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ category: z.string().min(2), amount: moneySchema, spentAt: z.string(), vendor: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid expense request" });
    return;
  }
  const expense = await financeService.addExpense({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "FINANCE_ACTION", entityType: "Expense", entityId: expense.id, metadata: { ...expense } });
  response.status(201).json({ data: expense });
});

financeRouter.get("/pnl", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  response.json({ data: await financeService.summary(organizationId) });
});

financeRouter.get("/gst", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  const summary = await financeService.summary(organizationId);
  response.json({ data: { gstRate: 18, gstPayable: summary.gstPayable, formula: "max(output GST on revenue - input GST credit on expenses, 0)" } });
});

financeRouter.get("/cash-flow", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  const summary = await financeService.summary(organizationId);
  response.json({ data: { cashIn: summary.cashIn, cashOut: summary.cashOut, netCashFlow: summary.netCashFlow } });
});

financeRouter.get("/analytics", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  response.json({ data: await financeService.analytics(organizationId) });
});

financeRouter.get("/reports", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await financeService.listExports(organizationId) : [] });
});

financeRouter.post("/exports", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ reportType: z.enum(["PNL", "GST", "CASH_FLOW", "SALES", "HIRING", "SUPPORT", "COMPLIANCE", "FOUNDER_MONTHLY", "CA_EXPORT"]), format: z.enum(["PDF", "EXCEL"]) }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid report export request" });
    return;
  }
  const reportExport = await financeService.queueExport(organizationId, parsed.data.reportType, parsed.data.format);
  auditService.record({ actorId: request.session!.userId, organizationId, action: "FINANCE_ACTION", entityType: "ReportExport", entityId: reportExport.id, metadata: { ...reportExport } });
  response.status(201).json({ data: reportExport });
});

financeRouter.get("/exports", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await financeService.listExports(organizationId) : [] });
});

financeRouter.get("/exports/:exportId/download", authMiddleware, requirePermission("reports:export"), async (request, response) => {
  const reportExport = await financeService.findExport(String(request.params.exportId));
  if (!reportExport) {
    response.status(404).json({ error: "Report export not found" });
    return;
  }
  response.setHeader("Content-Type", reportExport.mimeType);
  response.setHeader("Content-Disposition", `attachment; filename="${reportExport.fileName}"`);
  response.send(reportExport.content);
});
