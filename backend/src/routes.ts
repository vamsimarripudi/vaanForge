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
import { agentsRouter } from "./modules/vaanforge/agents.routes";
import { vformixAgentAdminRouter } from "./modules/vformix-agent/vformix-agent.routes";
import { builderRouter } from "./modules/builder/builder.routes";
import { settingsRouter } from "./modules/settings/settings.routes";
import { securityRouter } from "./modules/security/security.routes";
import { systemRouter } from "./modules/system/system.routes";
import { operationsRouter } from "./modules/operations/operations.routes";
import { developerGatewayRouter, developerPlatformRouter } from "./modules/developer-platform/developer-platform.routes";
import { marketplaceAdminRouter, marketplacePublisherRouter, marketplaceRouter, marketplaceWorkspaceRouter } from "./modules/marketplace/marketplace.routes";
import { adminFactoryRouter, factoryRouter } from "./modules/factory/factory.routes";
import { enterpriseCompletionRouter } from "./modules/enterprise-completion/enterprise-completion.routes";
import { adminSupportRouter, apiKeysRouter, accountSettingsRouter, customerSupportRouter, profileRouter } from "./modules/account/account.routes";
import {
  docsAdminRouter,
  docsPublicRouter,
  enterpriseAdminRouter,
  enterprisePublicRouter,
  legalPagesAdminRouter,
  legalPagesPublicRouter,
  partnersAdminRouter,
  partnersProgramRouter,
  releasesAdminRouter,
  releasesPublicRouter,
  statusAdminRouter,
  statusPublicRouter
} from "./modules/public-trust/public-trust.routes";
import { providerReadinessRouter } from "./modules/providers/provider-readiness.routes";
import {
  adminFeedbackRouter,
  adminIncidentsRouter,
  alertsRouter,
  customerSuccessRouter,
  deploymentSafetyRouter,
  feedbackRouter,
  monitoringRouter,
  releaseLifecycleRouter
} from "./modules/readiness/release-operations.routes";
import {
  adminAuditExportsRouter,
  adminLegalAcceptanceRouter,
  adminPrivacyRouter,
  adminSecurityCenterRouter,
  auditLogsRouter,
  developerApiKeySecurityRouter,
  legalAcceptanceRouter
} from "./modules/trust/enterprise-trust.routes";
import {
  cloudAiRouter,
  cloudBuildRouter,
  cloudConfigRouter,
  cloudConsoleRouter,
  cloudDeployRouter,
  cloudEventsRouter,
  cloudGatewayRouter,
  cloudIdentityRouter,
  cloudMessagingRouter,
  cloudMonitorRouter,
  cloudSecretsRouter,
  cloudServicesRouter,
  cloudStorageRouter
} from "./modules/cloud-platform/cloud-platform.routes";
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
  response.json({ status: "ok", service: "kravia-api" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/auth", cloudIdentityRouter);
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
apiRouter.use("/profile", profileRouter);
apiRouter.use("/api-keys", apiKeysRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/crm", crmRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/support", customerSupportRouter);
apiRouter.use("/hr", hrRouter);
apiRouter.use("/legal", legalRouter);
apiRouter.use("/legal", legalPagesPublicRouter);
apiRouter.use("/legal", legalAcceptanceRouter);
apiRouter.use("/admin/legal", legalPagesAdminRouter);
apiRouter.use("/admin/legal", adminLegalAcceptanceRouter);
apiRouter.use("/compliance", complianceRouter);
apiRouter.use("/creators", creatorsRouter);
apiRouter.use("/partners", partnersRouter);
apiRouter.use("/partners", partnersProgramRouter);
apiRouter.use("/admin/partners", partnersAdminRouter);
apiRouter.use("/communication", communicationRouter);
apiRouter.use("/automation", automationRouter);
apiRouter.use("/intelligence", intelligenceRouter);
apiRouter.use("/vaanforge", vaanForgeRouter);
apiRouter.use("/agents", agentsRouter);
apiRouter.use("/admin/agent", agentAdminRouter);
apiRouter.use("/admin/vformix", vformixAgentAdminRouter);
apiRouter.use("/builder", builderRouter);
apiRouter.use("/settings", accountSettingsRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/security", securityRouter);
apiRouter.use("/system", systemRouter);
apiRouter.use("/admin/operations", operationsRouter);
apiRouter.use("/admin/providers", providerReadinessRouter);
apiRouter.use("/admin/security", adminSecurityCenterRouter);
apiRouter.use("/admin/privacy", adminPrivacyRouter);
apiRouter.use("/audit-logs", auditLogsRouter);
apiRouter.use("/admin/audit/exports", adminAuditExportsRouter);
apiRouter.use("/admin/support", adminSupportRouter);
apiRouter.use("/developers", developerPlatformRouter);
apiRouter.use("/developer", developerApiKeySecurityRouter);
apiRouter.use("/docs", docsPublicRouter);
apiRouter.use("/admin/docs", docsAdminRouter);
apiRouter.use("/status", statusPublicRouter);
apiRouter.use("/admin/status", statusAdminRouter);
apiRouter.use("/releases", releaseLifecycleRouter);
apiRouter.use("/releases", releasesPublicRouter);
apiRouter.use("/admin/releases", releasesAdminRouter);
apiRouter.use("/deployments", deploymentSafetyRouter);
apiRouter.use("/admin/monitoring", monitoringRouter);
apiRouter.use("/admin/alerts", alertsRouter);
apiRouter.use("/admin/customer-success", customerSuccessRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/admin/feedback", adminFeedbackRouter);
apiRouter.use("/admin/incidents", adminIncidentsRouter);
apiRouter.use("/enterprise", enterprisePublicRouter);
apiRouter.use("/admin/enterprise", enterpriseAdminRouter);
apiRouter.use("/gateway", cloudGatewayRouter);
apiRouter.use("/gateway", developerGatewayRouter);
apiRouter.use("/services", cloudServicesRouter);
apiRouter.use("/events", cloudEventsRouter);
apiRouter.use("/storage", cloudStorageRouter);
apiRouter.use("/secrets", cloudSecretsRouter);
apiRouter.use("/config", cloudConfigRouter);
apiRouter.use("/messaging", cloudMessagingRouter);
apiRouter.use("/ai", cloudAiRouter);
apiRouter.use("/build", cloudBuildRouter);
apiRouter.use("/deploy", cloudDeployRouter);
apiRouter.use("/monitor", cloudMonitorRouter);
apiRouter.use("/console", cloudConsoleRouter);
apiRouter.use("/marketplace", marketplaceRouter);
apiRouter.use("/developers/publisher", marketplacePublisherRouter);
apiRouter.use("/admin/marketplace", marketplaceAdminRouter);
apiRouter.use("/builder/workspace", marketplaceWorkspaceRouter);
apiRouter.use("/factory", factoryRouter);
apiRouter.use("/admin/factory", adminFactoryRouter);
apiRouter.use("/", enterpriseCompletionRouter);

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
