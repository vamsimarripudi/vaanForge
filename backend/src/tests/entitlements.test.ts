import assert from "node:assert/strict";
import { educationSuitePlans } from "../config/plans/education-suite.plans";
import { entitlementsService } from "../modules/entitlements/entitlements.service";
import { authService } from "../modules/auth/auth.service";
import { workspacesService } from "../modules/workspaces/workspaces.service";
import { financeService } from "../modules/finance/finance.service";
import { billingService } from "../modules/billing/billing.service";
import { tasksService } from "../modules/tasks/tasks.service";
import { crmService } from "../modules/crm/crm.service";
import { supportService } from "../modules/support/support.service";
import { hrService } from "../modules/hr/hr.service";
import { legalService } from "../modules/legal/legal.service";
import { complianceService } from "../modules/compliance/compliance.service";
import { creatorsService } from "../modules/creators/creators.service";
import { partnersService } from "../modules/partners/partners.service";
import { communicationService } from "../modules/communication/communication.service";
import { notificationsService } from "../modules/notifications/notifications.service";
import { automationService } from "../modules/automation/automation.service";
import { intelligenceService } from "../modules/intelligence/intelligence.service";
import { settingsService } from "../modules/settings/settings.service";
import { auditService } from "../modules/audit/audit.service";
import { persistenceService } from "../database/persistence.service";
import { localEmailOutbox } from "../infrastructure/email/local-email.adapter";
import { localSmsOutbox } from "../infrastructure/sms/local-sms.adapter";
import { localStorageObjects } from "../infrastructure/storage/local-storage.adapter";
import { csrfMiddleware } from "../middlewares/csrf.middleware";
import { csrfService } from "../services/csrf.service";
import { sessionService } from "../services/session.service";

async function main() {
const growthPlan = educationSuitePlans.find((plan) => plan.planId === "education-growth");

assert.ok(growthPlan, "Education Growth plan should exist");

const allowed = entitlementsService.check({
  plan: growthPlan,
  productType: "VAANMEET",
  featureKey: "meetingsPerMonth",
  usage: { meetingsPerMonth: 10 }
});

assert.equal(allowed.allowed, true);

const blocked = entitlementsService.check({
  plan: growthPlan,
  productType: "VAANMEET",
  featureKey: "meetingsPerMonth",
  usage: { meetingsPerMonth: 300 }
});

assert.equal(blocked.allowed, false);
assert.equal(blocked.reason, "Usage limit reached");

const registered = await authService.register({
  name: "Vamsi Marripudi",
  email: "founder@vmnexus.local",
  password: "secure-demo-password"
});

assert.ok(registered.user?.id, "Registered user should be returned");
const resetRequest = await authService.requestPasswordReset("founder@vmnexus.local");
assert.equal(resetRequest.accepted, true);
assert.ok(resetRequest.resetToken);
assert.equal(resetRequest.delivery?.provider, "local");
assert.equal(localEmailOutbox.some((message) => message.to === "founder@vmnexus.local" && message.text.includes(resetRequest.resetToken!)), true);
await authService.resetPassword(resetRequest.resetToken!, "new-secure-demo-password");
await assert.rejects(() => authService.login("founder@vmnexus.local", "secure-demo-password"));
assert.ok((await authService.login("founder@vmnexus.local", "new-secure-demo-password")).user?.id);
await assert.rejects(() => authService.resetPassword(resetRequest.resetToken!, "another-secure-demo-password"));

const workspace = await workspacesService.create({
  founderUserId: registered.user!.id,
  organizationName: "VM nexus Pvt Ltd",
  workspaceName: "VM Nexus Founder Workspace",
  suiteType: "EDUCATION_SUITE",
  planId: "education-growth"
});

assert.equal(workspace.organization.suiteType, "EDUCATION_SUITE");
assert.equal(workspace.entitlements.length, growthPlan.includedProducts.length);
assert.equal((await authService.publicUser(registered.user!.id))?.organizationId, workspace.organization.id);
assert.equal(authService.health().name, "auth");
assert.equal(authService.health().mode, "memory");
assert.equal(workspacesService.health().name, "workspaces");
assert.equal(workspacesService.health().mode, "memory");
assert.equal((await workspacesService.listForOrganization(workspace.organization.id)).length, 1);

await financeService.addRevenue({
  organizationId: workspace.organization.id,
  source: "Education Suite subscription",
  amount: 100000,
  receivedAt: "2026-06-18",
  product: "Education Suite"
});

await financeService.addExpense({
  organizationId: workspace.organization.id,
  category: "Cloud hosting",
  amount: 25000,
  spentAt: "2026-06-18",
  vendor: "Infrastructure"
});

const summary = await financeService.summary(workspace.organization.id);
assert.equal(summary.revenueTotal, 100000);
assert.equal(summary.expenseTotal, 25000);
assert.equal(summary.grossProfit, 75000);
assert.equal(summary.profitMarginPercent, 75);
assert.equal(summary.gstPayable, 13500);
const reportExport = await financeService.queueExport(workspace.organization.id, "PNL", "EXCEL");
assert.equal(reportExport.status, "READY");
assert.equal(reportExport.mimeType, "text/csv");
assert.ok(reportExport.content.includes("Gross Profit"));
assert.equal(reportExport.storageProvider, "local");
assert.ok(reportExport.storageKey);
assert.equal(localStorageObjects.get(reportExport.storageKey!)?.content.includes("Gross Profit"), true);
assert.equal(financeService.health().name, "finance");
assert.equal(financeService.health().mode, "memory");
const checkout = await billingService.createCheckout({
  organizationId: workspace.organization.id,
  planId: "education-growth",
  billingCycle: "MONTHLY"
});
assert.equal(checkout.status, "PRICE_PENDING");
assert.equal(checkout.planId, "education-growth");
const trial = billingService.startTrial({
  organizationId: workspace.organization.id,
  planId: "education-growth"
});
assert.equal(trial.status, "TRIAL_STARTED");
assert.equal(trial.planId, "education-growth");

const project = await tasksService.createProject({
  organizationId: workspace.organization.id,
  name: "Launch operations",
  ownerId: registered.user!.id
});
const task = await tasksService.createTask({
  organizationId: workspace.organization.id,
  projectId: project.id,
  title: "Prepare founder dashboard",
  ownerId: registered.user!.id,
  priority: "HIGH",
  status: "IN_PROGRESS"
});
assert.equal((await tasksService.summary(workspace.organization.id)).allocated, 1);
assert.equal(task.projectId, project.id);
assert.equal(tasksService.health().name, "tasks");
assert.equal(tasksService.health().mode, "memory");

await crmService.createLead({
  organizationId: workspace.organization.id,
  name: "Demo School",
  company: "Demo School",
  stage: "DEMO_SCHEDULED",
  expectedValue: 50000
});
await crmService.createCustomer({
  organizationId: workspace.organization.id,
  name: "Demo Customer",
  activePlan: "education-growth"
});
assert.equal((await crmService.summary(workspace.organization.id)).expectedPipeline, 50000);
assert.equal((await crmService.summary(workspace.organization.id)).customers, 1);
assert.equal(crmService.health().name, "crm");
assert.equal(crmService.health().mode, "memory");

const ticket = await supportService.createTicket({
  organizationId: workspace.organization.id,
  subject: "Need onboarding help",
  priority: "HIGH",
  status: "OPEN"
});
await supportService.addMessage({ ticketId: ticket.id, authorId: registered.user!.id, message: "We are checking this now." });
assert.equal((await supportService.summary(workspace.organization.id)).open, 1);
assert.equal((await supportService.listMessages(ticket.id)).length, 1);
assert.equal(supportService.health().name, "support");
assert.equal(supportService.health().mode, "memory");

const department = await hrService.createDepartment({
  organizationId: workspace.organization.id,
  name: "Product"
});
await hrService.createEmployee({
  organizationId: workspace.organization.id,
  departmentId: department.id,
  name: "Demo Employee",
  email: "employee@vmnexus.local",
  role: "Product Manager",
  status: "ACTIVE",
  joinedAt: "2026-06-18"
});
const candidate = await hrService.createCandidate({
  organizationId: workspace.organization.id,
  name: "Demo Candidate",
  email: "candidate@vmnexus.local",
  roleApplied: "Full-stack Engineer",
  stage: "SCREENING"
});
const interview = await hrService.createInterview({
  organizationId: workspace.organization.id,
  candidateId: candidate.id,
  round: "TECHNICAL",
  scheduledAt: "2026-06-19T10:00:00.000Z",
  status: "SCHEDULED"
});
await hrService.scoreInterview(interview.id, 8, "Strong fundamentals and clear communication.");
const hrSummary = await hrService.summary(workspace.organization.id);
assert.equal(hrSummary.departments, 1);
assert.equal(hrSummary.activeEmployees, 1);
assert.equal(hrSummary.candidates, 1);
assert.equal(hrSummary.interviews, 1);
assert.equal(hrService.health().name, "hr");
assert.equal(hrService.health().mode, "memory");

const agreement = await legalService.createAgreement({
  organizationId: workspace.organization.id,
  type: "NDA",
  title: "Candidate NDA",
  partyName: "Demo Candidate",
  status: "DRAFT",
  expiresAt: "2026-12-31"
});
await legalService.updateStatus(agreement.id, "IN_REVIEW");
assert.equal((await legalService.summary(workspace.organization.id)).inReview, 1);
assert.equal(legalService.health().name, "legal");
assert.equal(legalService.health().mode, "memory");

const complianceItem = await complianceService.createItem({
  organizationId: workspace.organization.id,
  title: "Quarterly GST filing",
  category: "GST",
  dueDate: "2026-07-20",
  status: "IN_PROGRESS"
});
await complianceService.updateItemStatus(complianceItem.id, "COMPLETED");
await complianceService.createRegistration({
  organizationId: workspace.organization.id,
  type: "MSME_UDYAM",
  title: "MSME/Udyam registration",
  status: "IN_PROGRESS",
  dueDate: "2026-08-01"
});
const complianceSummary = await complianceService.summary(workspace.organization.id);
assert.equal(complianceSummary.completed, 1);
assert.equal(complianceSummary.registrations, 1);
assert.equal(complianceService.health().name, "compliance");
assert.equal(complianceService.health().mode, "memory");

const creator = await creatorsService.createProfile({
  organizationId: workspace.organization.id,
  name: "Demo Creator",
  niche: "Education",
  payoutStatus: "PENDING"
});
await creatorsService.createCampaign({
  organizationId: workspace.organization.id,
  creatorId: creator.id,
  title: "Demo creator campaign",
  status: "IN_REVIEW",
  budget: 10000
});
assert.equal((await creatorsService.summary(workspace.organization.id)).approvals, 1);
assert.equal(creatorsService.health().name, "creators");
assert.equal(creatorsService.health().mode, "memory");

await partnersService.createPartner({
  organizationId: workspace.organization.id,
  name: "Demo Partner",
  status: "ACTIVE",
  revenueSharePercent: 10
});
assert.equal((await partnersService.summary(workspace.organization.id)).active, 1);
assert.equal(partnersService.health().name, "partners");
assert.equal(partnersService.health().mode, "memory");

await communicationService.create({
  organizationId: workspace.organization.id,
  channel: "ANNOUNCEMENT",
  title: "Demo announcement",
  message: "Welcome to VM Nexus OS"
});
assert.equal((await communicationService.summary(workspace.organization.id)).announcements, 1);
assert.equal(communicationService.health().name, "communication");
assert.equal(communicationService.health().mode, "memory");

await automationService.createRule({
  organizationId: workspace.organization.id,
  name: "Create task when ticket opens",
  trigger: "TICKET_CREATED",
  action: "CREATE_TASK",
  status: "ACTIVE",
  approvalRequired: true
});
assert.equal((await automationService.summary(workspace.organization.id)).active, 1);
assert.equal(automationService.health().name, "automation");
assert.equal(automationService.health().mode, "memory");

await settingsService.update({
  organizationId: workspace.organization.id,
  themeMode: "system",
  billingEmail: "billing@vmnexus.local",
  notificationEmail: true,
  notificationSms: true
});
assert.equal((await settingsService.summary(workspace.organization.id)).billingEmail, "billing@vmnexus.local");
const smsNotification = await notificationsService.create({
  organizationId: workspace.organization.id,
  title: "SMS enabled",
  message: "Notification delivered through local SMS",
  smsTo: "+919999999999"
});
assert.equal(smsNotification.sms?.provider, "local");
assert.equal(localSmsOutbox.some((message) => message.to === "+919999999999" && message.message.includes("SMS enabled")), true);
assert.equal(settingsService.health().name, "settings");
assert.equal(settingsService.health().mode, "memory");
const intelligenceSummary = await intelligenceService.summary(workspace.organization.id);
assert.equal(intelligenceSummary.provider, "deterministic");
assert.equal(intelligenceSummary.placeholders, 8);
assert.ok(intelligenceSummary.snapshotId);
assert.equal((await intelligenceService.latest(workspace.organization.id))?.id, intelligenceSummary.snapshotId);
assert.equal(intelligenceService.health().name, "intelligence");
assert.equal(intelligenceService.health().mode, "memory");
auditService.record({
  actorId: registered.user!.id,
  organizationId: workspace.organization.id,
  action: "SECURITY_ACTION",
  entityType: "SecurityReview",
  metadata: { checked: true }
});
assert.equal(auditService.summary(workspace.organization.id).security, 1);
const readiness = persistenceService.readiness();
assert.equal(readiness.mode, "memory");
assert.equal(readiness.status, "limited");
assert.ok(readiness.checks.some((check) => check.key === "persistence-mode" && check.status === "warn"));
assert.ok(readiness.checks.some((check) => check.key === "root-domain" && check.status === "warn"));
assert.ok(readiness.checks.some((check) => check.key === "email-provider" && check.status === "warn"));
assert.ok(readiness.checks.some((check) => check.key === "payments-provider" && check.status === "warn"));
assert.ok(readiness.checks.some((check) => check.key === "ai-provider" && check.status === "warn"));
const csrfToken = csrfService.sign(registered.user!.id);
assert.equal(csrfService.verify(registered.user!.id, csrfToken), true);
assert.equal(csrfService.verify("other-user", csrfToken), false);
const sessionToken = sessionService.sign({ userId: registered.user!.id, role: "Founder", organizationId: workspace.organization.id });
const activeSession = sessionService.verify(sessionToken);
assert.equal(activeSession?.userId, registered.user!.id);
assert.ok(activeSession?.sessionId);
assert.ok(activeSession!.expiresAt > activeSession!.issuedAt);
assert.equal(sessionService.verify(sessionToken, (activeSession!.expiresAt + 1) * 1000), null);
assert.equal(await sessionService.isRevoked(activeSession!), false);
let csrfNextCalled = false;
await csrfMiddleware(
  {
    method: "POST",
    path: "/api/v1/tasks",
    headers: { cookie: `vmnexus_session=${sessionToken}; vmnexus_csrf=${csrfToken}` },
    header: (name: string) => (name.toLowerCase() === "x-csrf-token" ? csrfToken : undefined)
  } as any,
  {
    status: () => ({ json: () => undefined }),
    json: () => undefined
  } as any,
  () => {
    csrfNextCalled = true;
  }
);
assert.equal(csrfNextCalled, true);

let csrfFailureStatus = 0;
await csrfMiddleware(
  {
    method: "POST",
    path: "/api/v1/tasks",
    headers: { cookie: `vmnexus_session=${sessionToken}` },
    header: () => undefined
  } as any,
  {
    status: (status: number) => {
      csrfFailureStatus = status;
      return { json: () => undefined };
    },
    json: () => undefined
  } as any,
  () => undefined
);
assert.equal(csrfFailureStatus, 403);
await sessionService.revoke(activeSession!);
assert.equal(await sessionService.isRevoked(activeSession!), true);

console.log("Backend foundation tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
