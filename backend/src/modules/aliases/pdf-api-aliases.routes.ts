import { Router } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { auditService } from "../audit/audit.service";
import { authService } from "../auth/auth.service";
import { crmService } from "../crm/crm.service";
import { filesRouter } from "../files/files.routes";
import { financeService } from "../finance/finance.service";
import { hrService } from "../hr/hr.service";
import { tasksService } from "../tasks/tasks.service";
import { workspacesService } from "../workspaces/workspaces.service";

export const organizationsAliasRouter = Router();
export const usersAliasRouter = Router();
export const revenueAliasRouter = Router();
export const expensesAliasRouter = Router();
export const pnlAliasRouter = Router();
export const gstAliasRouter = Router();
export const cashFlowAliasRouter = Router();
export const customersAliasRouter = Router();
export const leadsAliasRouter = Router();
export const salesAliasRouter = Router();
export const projectsAliasRouter = Router();
export const employeesAliasRouter = Router();
export const candidatesAliasRouter = Router();
export const interviewsAliasRouter = Router();
export const clientsAliasRouter = Router();
export const documentsAliasRouter = Router();

const leadStageSchema = z.enum(["NEW", "CONTACTED", "DEMO_SCHEDULED", "PROPOSAL_SENT", "WON", "LOST"]);
const employeeStatusSchema = z.enum(["ACTIVE", "ON_LEAVE", "EXITED"]);
const candidateStageSchema = z.enum(["APPLIED", "SCREENING", "TECHNICAL", "MANAGERIAL", "HR", "OFFERED", "REJECTED", "HIRED"]);
const interviewStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]);
const moneySchema = z.number().positive().finite();

organizationsAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? { id: organizationId, workspaces: await workspacesService.listForOrganization(organizationId) } : null });
});

usersAliasRouter.get("/", authMiddleware, async (request, response) => {
  response.json({ data: [await authService.publicUser(request.session!.userId)] });
});

usersAliasRouter.post("/invite", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ email: z.string().email(), role: z.string().min(2) }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid invitation request" });
    return;
  }
  const invitation = {
    id: `inv_${Date.now()}`,
    email: parsed.data.email,
    role: parsed.data.role,
    status: "PENDING",
    organizationId
  };
  auditService.record({ actorId: request.session!.userId, organizationId, action: "SECURITY_ACTION", entityType: "TeamInvitation", entityId: invitation.id, metadata: invitation });
  response.status(201).json({ data: invitation });
});

revenueAliasRouter.get("/", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await financeService.listRevenue(organizationId) : [] });
});

revenueAliasRouter.post("/", authMiddleware, requirePermission("finance:write"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ source: z.string().min(2), amount: moneySchema, receivedAt: z.string(), product: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid revenue request" });
    return;
  }
  const revenue = await financeService.addRevenue({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "FINANCE_ACTION", entityType: "Revenue", entityId: revenue.id, metadata: { ...revenue, routeAlias: "/revenue" } });
  response.status(201).json({ data: revenue });
});

expensesAliasRouter.get("/", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await financeService.listExpenses(organizationId) : [] });
});

expensesAliasRouter.post("/", authMiddleware, requirePermission("finance:write"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ category: z.string().min(2), amount: moneySchema, spentAt: z.string(), vendor: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid expense request" });
    return;
  }
  const expense = await financeService.addExpense({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "FINANCE_ACTION", entityType: "Expense", entityId: expense.id, metadata: { ...expense, routeAlias: "/expenses" } });
  response.status(201).json({ data: expense });
});

pnlAliasRouter.get("/", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  response.json({ data: await financeService.summary(organizationId) });
});

gstAliasRouter.get("/", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  const summary = await financeService.summary(organizationId);
  response.json({ data: { gstRate: 18, gstPayable: summary.gstPayable, formula: "max(output GST on revenue - input GST credit on expenses, 0)" } });
});

cashFlowAliasRouter.get("/", authMiddleware, requirePermission("finance:read"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  if (!organizationId) {
    response.status(404).json({ error: "No organization is active for this session" });
    return;
  }
  const summary = await financeService.summary(organizationId);
  response.json({ data: { cashIn: summary.cashIn, cashOut: summary.cashOut, netCashFlow: summary.netCashFlow } });
});

customersAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await crmService.listCustomers(organizationId) : [] });
});

customersAliasRouter.post("/", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), email: z.string().email().optional(), activePlan: z.string().optional(), renewalDate: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid customer request" });
    return;
  }
  response.status(201).json({ data: await crmService.createCustomer({ ...parsed.data, organizationId }) });
});

leadsAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await crmService.listLeads(organizationId) : [] });
});

leadsAliasRouter.post("/", authMiddleware, requirePermission("organization:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), company: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), source: z.string().optional(), stage: leadStageSchema.default("NEW"), expectedValue: z.number().nonnegative().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid lead request" });
    return;
  }
  response.status(201).json({ data: await crmService.createLead({ ...parsed.data, organizationId }) });
});

salesAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await crmService.summary(organizationId) : { leads: 0, customers: 0, expectedPipeline: 0, won: 0, demoScheduled: 0 } });
});

clientsAliasRouter.get("/", authMiddleware, async (_request, response) => {
  response.json({ data: [] });
});

projectsAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await tasksService.listProjects(organizationId) : [] });
});

projectsAliasRouter.post("/", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), description: z.string().optional(), ownerId: z.string().optional(), dueDate: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid project request" });
    return;
  }
  response.status(201).json({ data: await tasksService.createProject({ ...parsed.data, organizationId }) });
});

employeesAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listEmployees(organizationId) : [] });
});

employeesAliasRouter.post("/", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ departmentId: z.string().optional(), name: z.string().min(2), email: z.string().email(), role: z.string().min(2), status: employeeStatusSchema.default("ACTIVE"), joinedAt: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid employee request" });
    return;
  }
  response.status(201).json({ data: await hrService.createEmployee({ ...parsed.data, organizationId }) });
});

candidatesAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listCandidates(organizationId) : [] });
});

candidatesAliasRouter.post("/", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), email: z.string().email().optional(), roleApplied: z.string().min(2), stage: candidateStageSchema.default("APPLIED"), source: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid candidate request" });
    return;
  }
  response.status(201).json({ data: await hrService.createCandidate({ ...parsed.data, organizationId }) });
});

interviewsAliasRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listInterviews(organizationId) : [] });
});

interviewsAliasRouter.post("/", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ candidateId: z.string().min(2), round: z.enum(["SCREENING", "TECHNICAL", "MANAGERIAL", "HR"]), scheduledAt: z.string(), interviewerId: z.string().optional(), status: interviewStatusSchema.default("SCHEDULED") }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid interview request" });
    return;
  }
  response.status(201).json({ data: await hrService.createInterview({ ...parsed.data, organizationId }) });
});

documentsAliasRouter.use(filesRouter);
