import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { plansRouter } from "./modules/plans/plans.routes";
import { entitlementsRouter } from "./modules/entitlements/entitlements.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { rolesRouter } from "./modules/roles/roles.routes";
import { workspacesRouter } from "./modules/workspaces/workspaces.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { financeRouter } from "./modules/finance/finance.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { filesRouter } from "./modules/files/files.routes";
import { agentBillingAdminRouter, billingRouter, billingWebhookRouter, builderBillingRouter } from "./modules/billing/billing.routes";
import { agentEnterpriseAdminRouter, builderEnterpriseRouter, publicRouter } from "./modules/enterprise/enterprise.routes";
import { onboardingRouter } from "./modules/onboarding/onboarding.routes";
import { tasksRouter } from "./modules/tasks/tasks.routes";
import { crmRouter } from "./modules/crm/crm.routes";
import { supportRouter } from "./modules/support/support.routes";
import { hrRouter } from "./modules/hr/hr.routes";
import { legalRouter } from "./modules/legal/legal.routes";
import { complianceRouter } from "./modules/compliance/compliance.routes";
import { creatorsRouter } from "./modules/creators/creators.routes";
import { partnersRouter } from "./modules/partners/partners.routes";
import { communicationRouter } from "./modules/communication/communication.routes";
import { automationRouter } from "./modules/automation/automation.routes";
import { intelligenceRouter } from "./modules/intelligence/intelligence.routes";
import { vaanForgeRouter } from "./modules/vaanforge/vaanforge.routes";
import { agentAdminRouter } from "./modules/vaanforge/agent-admin.routes";
import { vformixAgentAdminRouter } from "./modules/vformix-agent/vformix-agent.routes";
import { builderRouter } from "./modules/builder/builder.routes";
import { settingsRouter } from "./modules/settings/settings.routes";
import { securityRouter } from "./modules/security/security.routes";
import { systemRouter } from "./modules/system/system.routes";
import { operationsRouter } from "./modules/operations/operations.routes";
import { developerGatewayRouter, developerPlatformRouter } from "./modules/developer-platform/developer-platform.routes";
import {
  candidatesAliasRouter,
  cashFlowAliasRouter,
  clientsAliasRouter,
  customersAliasRouter,
  documentsAliasRouter,
  employeesAliasRouter,
  expensesAliasRouter,
  gstAliasRouter,
  interviewsAliasRouter,
  leadsAliasRouter,
  organizationsAliasRouter,
  pnlAliasRouter,
  projectsAliasRouter,
  revenueAliasRouter,
  salesAliasRouter,
  usersAliasRouter
} from "./modules/aliases/pdf-api-aliases.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "vm-nexus-api" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/public", publicRouter);
apiRouter.use("/onboarding", onboardingRouter);
apiRouter.use("/plans", plansRouter);
apiRouter.use("/entitlements", entitlementsRouter);
apiRouter.use("/audit", auditRouter);
apiRouter.use("/roles", rolesRouter);
apiRouter.use("/workspaces", workspacesRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/finance", financeRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/files", filesRouter);
apiRouter.use("/billing", billingRouter);
apiRouter.use("/builder/billing", builderBillingRouter);
apiRouter.use("/builder", builderEnterpriseRouter);
apiRouter.use("/admin/agent/billing", agentBillingAdminRouter);
apiRouter.use("/admin/agent", agentEnterpriseAdminRouter);
apiRouter.use("/webhooks", billingWebhookRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/crm", crmRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/hr", hrRouter);
apiRouter.use("/legal", legalRouter);
apiRouter.use("/compliance", complianceRouter);
apiRouter.use("/creators", creatorsRouter);
apiRouter.use("/partners", partnersRouter);
apiRouter.use("/communication", communicationRouter);
apiRouter.use("/automation", automationRouter);
apiRouter.use("/intelligence", intelligenceRouter);
apiRouter.use("/vaanforge", vaanForgeRouter);
apiRouter.use("/admin/agent", agentAdminRouter);
apiRouter.use("/admin/vformix", vformixAgentAdminRouter);
apiRouter.use("/builder", builderRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/security", securityRouter);
apiRouter.use("/system", systemRouter);
apiRouter.use("/admin/operations", operationsRouter);
apiRouter.use("/developers", developerPlatformRouter);
apiRouter.use("/gateway", developerGatewayRouter);

apiRouter.use("/organizations", organizationsAliasRouter);
apiRouter.use("/users", usersAliasRouter);
apiRouter.use("/revenue", revenueAliasRouter);
apiRouter.use("/expenses", expensesAliasRouter);
apiRouter.use("/pnl", pnlAliasRouter);
apiRouter.use("/gst", gstAliasRouter);
apiRouter.use("/cash-flow", cashFlowAliasRouter);
apiRouter.use("/customers", customersAliasRouter);
apiRouter.use("/clients", clientsAliasRouter);
apiRouter.use("/leads", leadsAliasRouter);
apiRouter.use("/sales", salesAliasRouter);
apiRouter.use("/projects", projectsAliasRouter);
apiRouter.use("/documents", documentsAliasRouter);
apiRouter.use("/candidates", candidatesAliasRouter);
apiRouter.use("/interviews", interviewsAliasRouter);
apiRouter.use("/employees", employeesAliasRouter);
