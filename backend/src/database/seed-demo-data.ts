import { authService } from "../modules/auth/auth.service";
import { workspacesService } from "../modules/workspaces/workspaces.service";
import { financeService } from "../modules/finance/finance.service";
import { tasksService } from "../modules/tasks/tasks.service";
import { crmService } from "../modules/crm/crm.service";
import { supportService } from "../modules/support/support.service";
import { hrService } from "../modules/hr/hr.service";
import { legalService } from "../modules/legal/legal.service";
import { complianceService } from "../modules/compliance/compliance.service";
import { creatorsService } from "../modules/creators/creators.service";
import { partnersService } from "../modules/partners/partners.service";
import { communicationService } from "../modules/communication/communication.service";
import { automationService } from "../modules/automation/automation.service";
import { settingsService } from "../modules/settings/settings.service";
import { intelligenceService } from "../modules/intelligence/intelligence.service";

export async function seedDemoData() {
  const founder = await authService.register({
    name: "Vamsi Marripudi",
    email: `demo-${Date.now()}@kravia.local`,
    password: "secure-demo-password"
  });

  const workspace = await workspacesService.create({
    founderUserId: founder.user!.id,
    organizationName: "KRAVIA PRIVATE LIMITED",
    workspaceName: "Demo Founder Workspace",
    suiteType: "VMETRON_SUITE",
    planId: "vmetron-growth"
  });

  await financeService.addRevenue({ organizationId: workspace.organization.id, source: "Demo subscription", amount: 150000, receivedAt: "2026-06-18" });
  await financeService.addExpense({ organizationId: workspace.organization.id, category: "Demo operations", amount: 45000, spentAt: "2026-06-18" });
  await financeService.queueExport(workspace.organization.id, "PNL", "EXCEL");

  const project = await tasksService.createProject({
    organizationId: workspace.organization.id,
    name: "Demo launch operations",
    ownerId: founder.user!.id,
    dueDate: "2026-07-01"
  });
  await tasksService.createTask({
    organizationId: workspace.organization.id,
    projectId: project.id,
    title: "Demo launch checklist",
    ownerId: founder.user!.id,
    priority: "HIGH",
    status: "IN_PROGRESS"
  });

  const lead = await crmService.createLead({
    organizationId: workspace.organization.id,
    name: "Demo Event Client",
    company: "Demo Events Co",
    email: "client@kravia.local",
    stage: "CONTACTED",
    expectedValue: 75000
  });
  await crmService.updateLeadStage(lead.id, "DEMO_SCHEDULED");
  const customer = await crmService.createCustomer({
    organizationId: workspace.organization.id,
    name: "Demo Customer",
    email: "customer@kravia.local",
    activePlan: "vmetron-growth",
    renewalDate: "2026-12-31"
  });

  const ticket = await supportService.createTicket({
    organizationId: workspace.organization.id,
    customerId: customer.id,
    subject: "Demo onboarding question",
    priority: "MEDIUM",
    status: "OPEN"
  });
  await supportService.addMessage({ ticketId: ticket.id, authorId: founder.user!.id, message: "Demo support response queued for follow-up." });

  const department = await hrService.createDepartment({ organizationId: workspace.organization.id, name: "Operations" });
  const employee = await hrService.createEmployee({
    organizationId: workspace.organization.id,
    departmentId: department.id,
    name: "Demo Operator",
    email: "operator@kravia.local",
    role: "Operations Lead",
    status: "ACTIVE",
    joinedAt: "2026-06-18"
  });
  const candidate = await hrService.createCandidate({
    organizationId: workspace.organization.id,
    name: "Demo Candidate",
    email: "candidate@kravia.local",
    roleApplied: "Support Specialist",
    stage: "SCREENING",
    source: "Referral"
  });
  await hrService.createInterview({
    organizationId: workspace.organization.id,
    candidateId: candidate.id,
    round: "TECHNICAL",
    scheduledAt: "2026-06-20T10:00:00.000Z",
    interviewerId: employee.id,
    status: "SCHEDULED",
    vaanMeetLink: "https://meet.kravia.local/demo"
  });

  await legalService.createAgreement({
    organizationId: workspace.organization.id,
    type: "CLIENT_AGREEMENT",
    title: "Demo client agreement",
    partyName: "Demo Customer",
    status: "IN_REVIEW",
    expiresAt: "2026-12-31"
  });
  const complianceItem = await complianceService.createItem({
    organizationId: workspace.organization.id,
    title: "Demo GST filing",
    category: "GST",
    dueDate: "2026-07-20",
    status: "IN_PROGRESS",
    ownerId: founder.user!.id
  });
  await complianceService.updateItemStatus(complianceItem.id, "COMPLETED");
  await complianceService.createRegistration({
    organizationId: workspace.organization.id,
    type: "MSME_UDYAM",
    title: "Demo MSME/Udyam registration",
    status: "IN_PROGRESS",
    referenceNumber: "DEMO-UDYAM-001",
    dueDate: "2026-08-01"
  });

  const creator = await creatorsService.createProfile({ organizationId: workspace.organization.id, name: "Demo Creator", niche: "Events", payoutStatus: "PENDING" });
  await creatorsService.createCampaign({ organizationId: workspace.organization.id, creatorId: creator.id, title: "Demo event campaign", status: "IN_REVIEW", budget: 25000 });
  await partnersService.createPartner({ organizationId: workspace.organization.id, name: "Demo Partner", status: "ACTIVE", revenueSharePercent: 12 });
  await communicationService.create({
    organizationId: workspace.organization.id,
    channel: "ANNOUNCEMENT",
    title: "Demo announcement",
    message: "Welcome to the demo workspace.",
    audience: "All team members"
  });
  await automationService.createRule({ organizationId: workspace.organization.id, name: "Notify on new lead", trigger: "LEAD_CREATED", action: "SEND_NOTIFICATION", status: "ACTIVE", approvalRequired: false });
  await settingsService.update({
    organizationId: workspace.organization.id,
    themeMode: "system",
    billingEmail: "billing@kravia.local",
    notificationEmail: true,
    notificationSms: true
  });
  const intelligence = await intelligenceService.summary(workspace.organization.id);

  return {
    founderUserId: founder.user!.id,
    organizationId: workspace.organization.id,
    workspaceId: workspace.workspace.id,
    suiteType: workspace.workspace.suiteType,
    activePlan: workspace.organization.activePlan,
    intelligenceSnapshotId: intelligence.snapshotId,
    seededModules: [
      "workspace",
      "finance",
      "reports",
      "tasks",
      "crm",
      "customer",
      "support",
      "hr",
      "hiring",
      "interviews",
      "legal",
      "compliance",
      "registrations",
      "creators",
      "partners",
      "communication",
      "automation",
      "settings",
      "intelligence"
    ]
  };
}

if (require.main === module) {
  seedDemoData()
    .then((summary) => {
      console.log(JSON.stringify({ status: "seeded", ...summary }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
