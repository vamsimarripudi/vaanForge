import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../app";

type JsonResponse<T> = {
  response: Response;
  body: T;
};

type ApiEnvelope<T> = {
  data: T;
};

const app = createApp();
const server = app.listen(0);
const address = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
const cookieJar = new Map<string, string>();

function rememberCookies(response: Response) {
  const header = response.headers.get("set-cookie");
  if (!header) {
    return;
  }

  for (const cookie of header.split(/,(?=\s*[^;,\s]+=)/)) {
    const [pair] = cookie.trim().split(";");
    const [name, value] = pair.split("=");
    if (name && value) {
      cookieJar.set(name, value);
    }
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<JsonResponse<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  const cookies = cookieHeader();
  if (cookies) {
    headers.set("cookie", cookies);
  }

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  rememberCookies(response);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  return { response, body: body as T };
}

async function json<T>(path: string, init: RequestInit = {}) {
  return request<ApiEnvelope<T>>(path, init);
}

async function main() {
  try {
    const health = await request<{ status: string }>("/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.body.status, "ok");

    const blocked = await request<{ error: string }>("/tasks/summary");
    assert.equal(blocked.response.status, 401);

    const email = `api-smoke-${Date.now()}@vmnexus.local`;
    const register = await json<{ id: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "API Smoke Founder", email, password: "secure-demo-password" })
    });
    assert.equal(register.response.status, 201);
    assert.equal(register.body.data.email, email);
    assert.ok(cookieJar.get("vmnexus_session"));

    const session = await json<{ id: string; organizationId?: string }>("/auth/session");
    assert.equal(session.response.status, 200);
    assert.equal(session.body.data.id, register.body.data.id);

    const missingCsrf = await request<{ error: string }>("/workspaces", {
      method: "POST",
      body: JSON.stringify({
        organizationName: "VM Nexus API Smoke",
        workspaceName: "Smoke Workspace",
        suiteType: "VMETRON_SUITE",
        planId: "vmetron-growth"
      })
    });
    assert.equal(missingCsrf.response.status, 403);

    const csrf = await json<{ csrfToken: string }>("/security/csrf");
    assert.equal(csrf.response.status, 200);
    assert.ok(cookieJar.get("vmnexus_csrf"));

    const workspace = await json<{ organization: { id: string }; workspace: { id: string } }>("/workspaces", {
      method: "POST",
      headers: { "x-csrf-token": csrf.body.data.csrfToken },
      body: JSON.stringify({
        organizationName: "VM Nexus API Smoke",
        workspaceName: "Smoke Workspace",
        suiteType: "VMETRON_SUITE",
        planId: "vmetron-growth"
      })
    });
    assert.equal(workspace.response.status, 201);
    assert.ok(workspace.body.data.organization.id);

    const login = await json<{ organizationId: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "secure-demo-password" })
    });
    assert.equal(login.response.status, 200);
    assert.equal(login.body.data.organizationId, workspace.body.data.organization.id);

    const organizationsAlias = await json<{ id: string; workspaces: Array<{ id: string }> }>("/organizations");
    assert.equal(organizationsAlias.response.status, 200);
    assert.equal(organizationsAlias.body.data.id, workspace.body.data.organization.id);
    assert.ok(organizationsAlias.body.data.workspaces.some((item) => item.id === workspace.body.data.workspace.id));

    const usersAlias = await json<Array<{ id: string; email: string }>>("/users");
    assert.equal(usersAlias.response.status, 200);
    assert.ok(usersAlias.body.data.some((item) => item.id === register.body.data.id && item.email === email));

    const onboarding = await json<{
      fields: string[];
      recommendedSuites: string[];
      handoffRoute: string;
      workspaceActivation: { method: string; requiredFields: string[] };
    }>("/onboarding");
    assert.equal(onboarding.response.status, 200);
    assert.ok(onboarding.body.data.fields.includes("businessType"));
    assert.ok(onboarding.body.data.recommendedSuites.includes("VMETRON_SUITE"));
    assert.equal(onboarding.body.data.handoffRoute, "/api/v1/workspaces");
    assert.equal(onboarding.body.data.workspaceActivation.method, "POST");

    const activeCsrf = await json<{ csrfToken: string }>("/security/csrf");
    const csrfHeader = { "x-csrf-token": activeCsrf.body.data.csrfToken };

    const invitation = await json<{ email: string; role: string; status: string }>("/users/invite", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ email: "teammate@vmnexus.local", role: "operations_manager" })
    });
    assert.equal(invitation.response.status, 201);
    assert.equal(invitation.body.data.email, "teammate@vmnexus.local");
    assert.equal(invitation.body.data.status, "PENDING");

    const trial = await json<{ status: string; planId: string }>("/billing/trial", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ planId: "vmetron-growth" })
    });
    assert.equal(trial.response.status, 201);
    assert.equal(trial.body.data.status, "TRIAL_STARTED");

    const billingSummary = await json<{
      activePlan: { paymentStatus: string; renewalStatus: string; nextRenewalDate: string };
      invoices: Array<{ number: string; status: string }>;
      renewalReminders: Array<{ label: string; status: string }>;
    }>("/billing/summary");
    assert.equal(billingSummary.response.status, 200);
    assert.equal(billingSummary.body.data.activePlan.paymentStatus, "PRICE_PENDING");
    assert.equal(billingSummary.body.data.activePlan.renewalStatus, "PRICE_APPROVAL_REQUIRED");
    assert.equal(billingSummary.body.data.activePlan.nextRenewalDate.slice(0, 10), "2026-12-31");
    assert.equal(billingSummary.body.data.invoices[0].number, "VMN-LAUNCH-001");
    assert.equal(billingSummary.body.data.invoices[0].status, "PRICE_PENDING");
    assert.ok(billingSummary.body.data.renewalReminders.some((item) => item.label === "Commercial approval" && item.status === "REQUIRED"));

    const revenue = await json<{ id: string; amount: number }>("/finance/revenue", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ source: "HTTP smoke subscription", amount: 125000, receivedAt: "2026-06-19", product: "VMetron" })
    });
    assert.equal(revenue.response.status, 201);
    assert.equal(revenue.body.data.amount, 125000);

    const expense = await json<{ id: string; amount: number }>("/finance/expenses", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ category: "HTTP smoke operations", amount: 25000, spentAt: "2026-06-19", vendor: "Smoke Vendor" })
    });
    assert.equal(expense.response.status, 201);
    assert.equal(expense.body.data.amount, 25000);

    const financeSummary = await json<{ revenueTotal: number; expenseTotal: number; grossProfit: number }>("/finance/summary");
    assert.equal(financeSummary.response.status, 200);
    assert.equal(financeSummary.body.data.grossProfit, 100000);

    const revenueAliasList = await json<Array<{ id: string; amount: number }>>("/revenue");
    assert.equal(revenueAliasList.response.status, 200);
    assert.ok(revenueAliasList.body.data.some((item) => item.id === revenue.body.data.id && item.amount === 125000));

    const expenseAliasList = await json<Array<{ id: string; amount: number }>>("/expenses");
    assert.equal(expenseAliasList.response.status, 200);
    assert.ok(expenseAliasList.body.data.some((item) => item.id === expense.body.data.id && item.amount === 25000));

    const pnlAlias = await json<{ grossProfit: number }>("/pnl");
    assert.equal(pnlAlias.response.status, 200);
    assert.equal(pnlAlias.body.data.grossProfit, 100000);

    const gst = await json<{ gstPayable: number }>("/finance/gst");
    assert.equal(gst.response.status, 200);
    assert.equal(gst.body.data.gstPayable, 18000);

    const gstAlias = await json<{ gstPayable: number }>("/gst");
    assert.equal(gstAlias.response.status, 200);
    assert.equal(gstAlias.body.data.gstPayable, 18000);

    const cashFlow = await json<{ netCashFlow: number }>("/finance/cash-flow");
    assert.equal(cashFlow.response.status, 200);
    assert.equal(cashFlow.body.data.netCashFlow, 100000);

    const cashFlowAlias = await json<{ netCashFlow: number }>("/cash-flow");
    assert.equal(cashFlowAlias.response.status, 200);
    assert.equal(cashFlowAlias.body.data.netCashFlow, 100000);

    const financeAnalytics = await json<{
      founderPayoutPlanning: { suggestedFounderPayout: number; reserve: number };
      productWiseRevenue: Array<{ product: string; revenue: number }>;
      productWiseProfit: Array<{ product: string; profit: number }>;
      caExport: { reportType: string; includes: string[] };
    }>("/finance/analytics");
    assert.equal(financeAnalytics.response.status, 200);
    assert.equal(financeAnalytics.body.data.founderPayoutPlanning.reserve, 40000);
    assert.equal(financeAnalytics.body.data.founderPayoutPlanning.suggestedFounderPayout, 15000);
    assert.ok(financeAnalytics.body.data.productWiseRevenue.some((item) => item.product === "VMetron" && item.revenue === 125000));
    assert.ok(financeAnalytics.body.data.productWiseProfit.some((item) => item.product === "VMetron" && item.profit === 100000));
    assert.equal(financeAnalytics.body.data.caExport.reportType, "CA_EXPORT");
    assert.ok(financeAnalytics.body.data.caExport.includes.includes("founder payout planning"));

    const project = await json<{ id: string }>("/tasks/projects", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP smoke project" })
    });
    assert.equal(project.response.status, 201);

    const projectList = await json<Array<{ id: string }>>("/tasks/projects");
    assert.equal(projectList.response.status, 200);
    assert.equal(projectList.body.data.some((item) => item.id === project.body.data.id), true);

    const projectAliasList = await json<Array<{ id: string }>>("/projects");
    assert.equal(projectAliasList.response.status, 200);
    assert.equal(projectAliasList.body.data.some((item) => item.id === project.body.data.id), true);

    const task = await json<{ id: string; projectId: string }>("/tasks", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ projectId: project.body.data.id, title: "HTTP smoke task", description: "HTTP smoke task comment", priority: "HIGH", status: "IN_PROGRESS" })
    });
    assert.equal(task.response.status, 201);
    assert.equal(task.body.data.projectId, project.body.data.id);

    const assignedTask = await json<{ id: string; ownerId: string }>(`/tasks/${task.body.data.id}/assign`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ ownerId: register.body.data.id })
    });
    assert.equal(assignedTask.response.status, 200);
    assert.equal(assignedTask.body.data.ownerId, register.body.data.id);

    const completedTask = await json<{ id: string; status: string }>(`/tasks/${task.body.data.id}/status`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ status: "DONE" })
    });
    assert.equal(completedTask.response.status, 200);
    assert.equal(completedTask.body.data.status, "DONE");

    const taskList = await json<Array<{ id: string; status: string; ownerId?: string }>>("/tasks");
    assert.equal(taskList.response.status, 200);
    assert.equal(taskList.body.data.some((item) => item.id === task.body.data.id && item.status === "DONE" && item.ownerId === register.body.data.id), true);

    const workAllocation = await json<{
      tasks: unknown[];
      comments: Array<{ taskId: string; count: number }>;
      attachments: Array<{ route: string }>;
      recurringTasks: Array<{ cadence: string }>;
      allocationRules: { priorityLevels: string[]; statusFlow: string[] };
    }>("/tasks/work-allocation");
    assert.equal(workAllocation.response.status, 200);
    assert.ok(workAllocation.body.data.tasks.length >= 1);
    assert.ok(workAllocation.body.data.comments.some((item) => item.taskId === task.body.data.id && item.count >= 1));
    assert.ok(workAllocation.body.data.attachments.some((item) => item.route === "/api/v1/files/uploads"));
    assert.ok(workAllocation.body.data.recurringTasks.some((item) => item.cadence === "weekly"));
    assert.ok(workAllocation.body.data.allocationRules.priorityLevels.includes("URGENT"));
    assert.ok(workAllocation.body.data.allocationRules.statusFlow.includes("BLOCKED"));

    const lead = await json<{ id: string; stage: string }>("/crm/leads", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Lead", company: "Smoke Co", email: "lead@vmnexus.local", stage: "NEW", expectedValue: 64000 })
    });
    assert.equal(lead.response.status, 201);

    const wonLead = await json<{ id: string; stage: string }>(`/crm/leads/${lead.body.data.id}/stage`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ stage: "WON" })
    });
    assert.equal(wonLead.response.status, 200);
    assert.equal(wonLead.body.data.stage, "WON");

    const leadList = await json<Array<{ id: string; stage: string }>>("/crm/leads");
    assert.equal(leadList.response.status, 200);
    assert.equal(leadList.body.data.some((item) => item.id === lead.body.data.id && item.stage === "WON"), true);

    const leadAliasList = await json<Array<{ id: string; stage: string }>>("/leads");
    assert.equal(leadAliasList.response.status, 200);
    assert.equal(leadAliasList.body.data.some((item) => item.id === lead.body.data.id && item.stage === "WON"), true);

    const proposalLead = await json<{ id: string; stage: string }>("/crm/leads", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Proposal Lead", company: "Proposal Co", email: "proposal@vmnexus.local", stage: "PROPOSAL_SENT", expectedValue: 91000 })
    });
    assert.equal(proposalLead.response.status, 201);

    const demoLead = await json<{ id: string; stage: string }>("/crm/leads", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Demo Lead", company: "Demo Co", email: "demo@vmnexus.local", stage: "DEMO_SCHEDULED", expectedValue: 45000 })
    });
    assert.equal(demoLead.response.status, 201);

    const salesAlias = await json<{ leads: number; customers: number; expectedPipeline: number }>("/sales");
    assert.equal(salesAlias.response.status, 200);
    assert.equal(salesAlias.body.data.leads, 3);
    assert.equal(salesAlias.body.data.expectedPipeline, 200000);

    const customer = await json<{ id: string }>("/crm/customers", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Customer", email: "customer@vmnexus.local", activePlan: "vmetron-growth", renewalDate: "2026-12-31" })
    });
    assert.equal(customer.response.status, 201);

    const customerList = await json<Array<{ id: string }>>("/crm/customers");
    assert.equal(customerList.response.status, 200);
    assert.equal(customerList.body.data.some((item) => item.id === customer.body.data.id), true);

    const customerAliasList = await json<Array<{ id: string }>>("/customers");
    assert.equal(customerAliasList.response.status, 200);
    assert.equal(customerAliasList.body.data.some((item) => item.id === customer.body.data.id), true);

    const clientsAliasList = await json<Array<{ id: string }>>("/clients");
    assert.equal(clientsAliasList.response.status, 200);

    const customerPortal = await json<{
      subscription: Array<{ activePlan: string; status: string }>;
      invoices: Array<{ billingRoute: string; status: string }>;
      supportTickets: Array<{ route: string; status: string }>;
      productAccess: Array<{ entitlementRoute: string; status: string }>;
      announcements: Array<{ channel: string }>;
      documents: Array<{ documentTypes: string[] }>;
      renewalStatus: Array<{ renewalDate: string; status: string }>;
    }>("/crm/customer-portal");
    assert.equal(customerPortal.response.status, 200);
    assert.ok(customerPortal.body.data.subscription.some((item) => item.activePlan === "vmetron-growth" && item.status === "ACTIVE"));
    assert.ok(customerPortal.body.data.invoices.some((item) => item.billingRoute === "/api/v1/billing/summary" && item.status === "PRICE_PENDING"));
    assert.ok(customerPortal.body.data.supportTickets.some((item) => item.route === "/api/v1/support/tickets" && item.status === "CONNECTED"));
    assert.ok(customerPortal.body.data.productAccess.some((item) => item.entitlementRoute === "/api/v1/entitlements/check" && item.status === "ENABLED"));
    assert.ok(customerPortal.body.data.announcements.some((item) => item.channel === "CUSTOMER_FOLLOW_UP"));
    assert.ok(customerPortal.body.data.documents.some((item) => item.documentTypes.includes("CUSTOMER")));
    assert.ok(customerPortal.body.data.renewalStatus.some((item) => item.renewalDate === "2026-12-31" && item.status === "TRACKED"));

    const salesOperations = await json<{
      deals: unknown[];
      followUps: unknown[];
      demoScheduling: unknown[];
      proposals: unknown[];
      objections: unknown[];
      renewals: unknown[];
      salesPsychologyAssistant: { prompts: string[]; nextBestAction: string };
    }>("/crm/sales-operations");
    assert.equal(salesOperations.response.status, 200);
    assert.ok(salesOperations.body.data.deals.length >= 3);
    assert.ok(salesOperations.body.data.followUps.length >= 1);
    assert.ok(salesOperations.body.data.demoScheduling.length >= 1);
    assert.ok(salesOperations.body.data.proposals.length >= 1);
    assert.ok(salesOperations.body.data.objections.length >= 3);
    assert.ok(salesOperations.body.data.renewals.length >= 1);
    assert.ok(salesOperations.body.data.salesPsychologyAssistant.prompts.length >= 3);
    assert.ok(salesOperations.body.data.salesPsychologyAssistant.nextBestAction);

    const ticket = await json<{ id: string; status: string }>("/support/tickets", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ customerId: customer.body.data.id, subject: "HTTP smoke support ticket", priority: "HIGH", status: "OPEN" })
    });
    assert.equal(ticket.response.status, 201);

    const ticketMessage = await json<{ id: string }>(`/support/tickets/${ticket.body.data.id}/messages`, {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ message: "HTTP smoke support reply", internal: true })
    });
    assert.equal(ticketMessage.response.status, 201);

    const ticketList = await json<Array<{ id: string; status: string }>>("/support/tickets");
    assert.equal(ticketList.response.status, 200);
    assert.equal(ticketList.body.data.some((item) => item.id === ticket.body.data.id), true);

    const ticketMessages = await json<Array<{ id: string; internal: boolean }>>(`/support/tickets/${ticket.body.data.id}/messages`);
    assert.equal(ticketMessages.response.status, 200);
    assert.equal(ticketMessages.body.data.some((item) => item.id === ticketMessage.body.data.id && item.internal), true);

    const supportOperations = await json<{ liveChat: { status: string }; slaRules: unknown[]; escalationPaths: unknown[]; knowledgeBase: unknown[] }>("/support/operations");
    assert.equal(supportOperations.response.status, 200);
    assert.equal(supportOperations.body.data.liveChat.status, "launch-gated");
    assert.equal(supportOperations.body.data.slaRules.length, 4);
    assert.ok(supportOperations.body.data.escalationPaths.length);
    assert.ok(supportOperations.body.data.knowledgeBase.length);

    const resolvedTicket = await json<{ id: string; status: string }>(`/support/tickets/${ticket.body.data.id}/status`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ status: "RESOLVED" })
    });
    assert.equal(resolvedTicket.response.status, 200);
    assert.equal(resolvedTicket.body.data.status, "RESOLVED");

    const department = await json<{ id: string }>("/hr/departments", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Operations" })
    });
    assert.equal(department.response.status, 201);

    const employee = await json<{ id: string }>("/hr/employees", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ departmentId: department.body.data.id, name: "HTTP Smoke Employee", email: "employee@vmnexus.local", role: "Ops Lead", status: "ACTIVE", joinedAt: "2026-06-19" })
    });
    assert.equal(employee.response.status, 201);

    const employeeAliasList = await json<Array<{ id: string }>>("/employees");
    assert.equal(employeeAliasList.response.status, 200);
    assert.equal(employeeAliasList.body.data.some((item) => item.id === employee.body.data.id), true);

    const teamOperations = await json<{ orgChart: unknown[]; attendance: { presentToday: number }; leaves: { policy: string }; performance: { reviewCadence: string }; accessControl: { permissionCheckRoute: string } }>("/hr/team-operations");
    assert.equal(teamOperations.response.status, 200);
    assert.equal(teamOperations.body.data.attendance.presentToday, 1);
    assert.ok(teamOperations.body.data.orgChart.length);
    assert.equal(teamOperations.body.data.performance.reviewCadence, "monthly");
    assert.equal(teamOperations.body.data.accessControl.permissionCheckRoute, "/api/v1/roles/check");

    const candidate = await json<{ id: string; stage: string }>("/hr/candidates", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Candidate", email: "candidate@vmnexus.local", roleApplied: "Support Specialist", stage: "APPLIED", source: "API smoke" })
    });
    assert.equal(candidate.response.status, 201);

    const screenedCandidate = await json<{ id: string; stage: string }>(`/hr/candidates/${candidate.body.data.id}/stage`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ stage: "SCREENING" })
    });
    assert.equal(screenedCandidate.response.status, 200);
    assert.equal(screenedCandidate.body.data.stage, "SCREENING");

    const candidateAliasList = await json<Array<{ id: string; stage: string }>>("/candidates");
    assert.equal(candidateAliasList.response.status, 200);
    assert.equal(candidateAliasList.body.data.some((item) => item.id === candidate.body.data.id && item.stage === "SCREENING"), true);

    const interview = await json<{ id: string }>("/hr/interviews", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ candidateId: candidate.body.data.id, round: "TECHNICAL", scheduledAt: "2026-06-20T10:00:00.000Z", interviewerId: employee.body.data.id, status: "SCHEDULED" })
    });
    assert.equal(interview.response.status, 201);

    const scoredInterview = await json<{ id: string; score: number }>(`/hr/interviews/${interview.body.data.id}/score`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ score: 8, feedback: "HTTP smoke interview feedback" })
    });
    assert.equal(scoredInterview.response.status, 200);
    assert.equal(scoredInterview.body.data.score, 8);

    const interviewAliasList = await json<Array<{ id: string }>>("/interviews");
    assert.equal(interviewAliasList.response.status, 200);
    assert.equal(interviewAliasList.body.data.some((item) => item.id === interview.body.data.id), true);

    const agreement = await json<{ id: string; status: string }>("/legal/agreements", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ type: "CLIENT_AGREEMENT", title: "HTTP smoke client agreement", partyName: "HTTP Smoke Customer", status: "DRAFT", expiresAt: "2026-12-31" })
    });
    assert.equal(agreement.response.status, 201);

    const approvedAgreement = await json<{ id: string; status: string }>(`/legal/agreements/${agreement.body.data.id}/status`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ status: "APPROVED" })
    });
    assert.equal(approvedAgreement.response.status, 200);
    assert.equal(approvedAgreement.body.data.status, "APPROVED");

    const agreements = await json<Array<{ id: string; status: string; title: string }>>("/legal/agreements");
    assert.equal(agreements.response.status, 200);
    assert.ok(agreements.body.data.some((item) => item.id === agreement.body.data.id && item.status === "APPROVED" && item.title === "HTTP smoke client agreement"));

    const legalOs = await json<{
      agreementCatalog: Array<{ type: string; records: number }>;
      policyRegister: Array<{ route: string; status: string }>;
      awarenessNotes: Array<{ title: string }>;
      disclaimer: string;
    }>("/legal/operating-system");
    assert.equal(legalOs.response.status, 200);
    assert.ok(legalOs.body.data.agreementCatalog.some((item) => item.type === "CLIENT_AGREEMENT" && item.records >= 1));
    assert.ok(legalOs.body.data.agreementCatalog.some((item) => item.type === "FOUNDER_AGREEMENT"));
    assert.ok(legalOs.body.data.policyRegister.some((item) => item.route === "/terms" && item.status === "published"));
    assert.ok(legalOs.body.data.policyRegister.some((item) => item.route === "/privacy"));
    assert.ok(legalOs.body.data.policyRegister.some((item) => item.route === "/refund"));
    assert.ok(legalOs.body.data.policyRegister.some((item) => item.route === "/data-policy"));
    assert.ok(legalOs.body.data.awarenessNotes.length >= 4);
    assert.ok(legalOs.body.data.disclaimer.includes("not legal advice"));

    const complianceItem = await json<{ id: string; status: string }>("/compliance/items", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ title: "HTTP smoke GST filing", category: "GST", dueDate: "2026-07-20", status: "IN_PROGRESS", ownerId: register.body.data.id })
    });
    assert.equal(complianceItem.response.status, 201);

    const completedCompliance = await json<{ id: string; status: string }>(`/compliance/items/${complianceItem.body.data.id}/status`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ status: "COMPLETED" })
    });
    assert.equal(completedCompliance.response.status, 200);
    assert.equal(completedCompliance.body.data.status, "COMPLETED");

    const registration = await json<{ id: string; status: string }>("/compliance/registrations", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ type: "MSME_UDYAM", title: "HTTP smoke MSME registration", status: "IN_PROGRESS", referenceNumber: "HTTP-SMOKE-001", dueDate: "2026-08-01" })
    });
    assert.equal(registration.response.status, 201);

    const finishedRegistration = await json<{ id: string; status: string }>(`/compliance/registrations/${registration.body.data.id}/status`, {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ status: "COMPLETED" })
    });
    assert.equal(finishedRegistration.response.status, 200);
    assert.equal(finishedRegistration.body.data.status, "COMPLETED");

    const complianceOs = await json<{
      registrationCatalog: Array<{ type: string; status: string }>;
      complianceCalendar: Array<{ title: string; category: string }>;
      filingReminders: Array<{ category: string }>;
      riskSummary: { openCalendarItems: number };
    }>("/compliance/operating-system");
    assert.equal(complianceOs.response.status, 200);
    for (const type of ["INCORPORATION", "GST", "PAN_TAN", "DIN_DSC", "MCA_ROC", "TRADEMARK", "STARTUP_INDIA", "MSME_UDYAM"]) {
      assert.ok(complianceOs.body.data.registrationCatalog.some((item) => item.type === type));
    }
    assert.ok(complianceOs.body.data.complianceCalendar.some((item) => item.category === "GST"));
    assert.ok(complianceOs.body.data.filingReminders.some((item) => item.category === "MCA/ROC"));
    assert.ok(complianceOs.body.data.riskSummary.openCalendarItems >= 0);

    const creator = await json<{ id: string }>("/creators/profiles", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Creator", niche: "Events", payoutStatus: "PENDING" })
    });
    assert.equal(creator.response.status, 201);

    const creatorProfiles = await json<Array<{ id: string }>>("/creators/profiles");
    assert.equal(creatorProfiles.response.status, 200);
    assert.equal(creatorProfiles.body.data.some((item) => item.id === creator.body.data.id), true);

    const campaign = await json<{ id: string; status: string }>("/creators/campaigns", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ creatorId: creator.body.data.id, title: "HTTP smoke campaign", status: "IN_REVIEW", budget: 15000 })
    });
    assert.equal(campaign.response.status, 201);
    assert.equal(campaign.body.data.status, "IN_REVIEW");

    const campaigns = await json<Array<{ id: string }>>("/creators/campaigns");
    assert.equal(campaigns.response.status, 200);
    assert.equal(campaigns.body.data.some((item) => item.id === campaign.body.data.id), true);

    const promotions = await json<{
      metrics: { campaigns: number; socialPosts: number; creatorCollaborations: number; budget: number; performanceScore: number };
      socialPosts: unknown[];
      contentCalendar: unknown[];
      performance: { signals: string[] };
    }>("/creators/promotions");
    assert.equal(promotions.response.status, 200);
    assert.equal(promotions.body.data.metrics.campaigns, 1);
    assert.ok(promotions.body.data.metrics.socialPosts >= 3);
    assert.equal(promotions.body.data.metrics.creatorCollaborations, 1);
    assert.equal(promotions.body.data.metrics.budget, 15000);
    assert.ok(promotions.body.data.metrics.performanceScore >= 60);
    assert.ok(promotions.body.data.socialPosts.length);
    assert.ok(promotions.body.data.contentCalendar.length);
    assert.ok(promotions.body.data.performance.signals.includes("creator ROI"));

    const creatorPortal = await json<{
      campaigns: unknown[];
      billing: { status: string; pendingCreators: number; handoffRoute: string };
      contentIdeas: unknown[];
      conceptSharing: unknown[];
      approvalFlow: unknown[];
      brandGuidelines: unknown[];
      payouts: Array<{ payoutStatus: string }>;
      performanceTracking: { signals: string[] };
    }>("/creators/creator-portal");
    assert.equal(creatorPortal.response.status, 200);
    assert.ok(creatorPortal.body.data.campaigns.length >= 1);
    assert.equal(creatorPortal.body.data.billing.status, "PAYOUT_REVIEW_REQUIRED");
    assert.equal(creatorPortal.body.data.billing.pendingCreators, 1);
    assert.equal(creatorPortal.body.data.billing.handoffRoute, "/api/v1/billing/summary");
    assert.ok(creatorPortal.body.data.contentIdeas.length >= 3);
    assert.ok(creatorPortal.body.data.conceptSharing.length >= 1);
    assert.ok(creatorPortal.body.data.approvalFlow.length >= 1);
    assert.ok(creatorPortal.body.data.brandGuidelines.length >= 3);
    assert.ok(creatorPortal.body.data.payouts.some((item) => item.payoutStatus === "PENDING"));
    assert.ok(creatorPortal.body.data.performanceTracking.signals.includes("creator ROI"));

    const partner = await json<{ id: string; status: string }>("/partners", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP Smoke Partner", status: "ACTIVE", revenueSharePercent: 12 })
    });
    assert.equal(partner.response.status, 201);
    assert.equal(partner.body.data.status, "ACTIVE");

    const partnerList = await json<Array<{ id: string }>>("/partners");
    assert.equal(partnerList.response.status, 200);
    assert.equal(partnerList.body.data.some((item) => item.id === partner.body.data.id), true);

    const partnerCollaborationOs = await json<{
      collaborations: unknown[];
      revenueShare: Array<{ percent: number; status: string }>;
      agreements: Array<{ route: string }>;
      tasks: Array<{ route: string }>;
      approvals: Array<{ owner: string }>;
      communications: Array<{ channel: string }>;
    }>("/partners/collaboration-os");
    assert.equal(partnerCollaborationOs.response.status, 200);
    assert.ok(partnerCollaborationOs.body.data.collaborations.length >= 1);
    assert.ok(partnerCollaborationOs.body.data.revenueShare.some((item) => item.percent === 12 && item.status === "CONFIGURED"));
    assert.ok(partnerCollaborationOs.body.data.agreements.some((item) => item.route === "/api/v1/legal/agreements"));
    assert.ok(partnerCollaborationOs.body.data.tasks.some((item) => item.route === "/api/v1/tasks"));
    assert.ok(partnerCollaborationOs.body.data.approvals.some((item) => item.owner === "Founder"));
    assert.ok(partnerCollaborationOs.body.data.communications.some((item) => item.channel === "TEAM"));

    const communication = await json<{ id: string; channel: string }>("/communication", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ channel: "ANNOUNCEMENT", title: "HTTP smoke announcement", message: "HTTP smoke communication", audience: "All" })
    });
    assert.equal(communication.response.status, 201);
    assert.equal(communication.body.data.channel, "ANNOUNCEMENT");

    const communicationList = await json<Array<{ id: string }>>("/communication");
    assert.equal(communicationList.response.status, 200);
    assert.equal(communicationList.body.data.some((item) => item.id === communication.body.data.id), true);

    const communicationOs = await json<{
      notifications: { status: string; generatedFromCommunications: number };
      channelCatalog: Array<{ channel: string; records: number }>;
      emailTemplates: unknown[];
      smsTemplates: unknown[];
      routingRules: unknown[];
    }>("/communication/operating-system");
    assert.equal(communicationOs.response.status, 200);
    for (const channel of ["ANNOUNCEMENT", "DIRECT", "TEAM", "SUPPORT", "CUSTOMER_FOLLOW_UP"]) {
      assert.ok(communicationOs.body.data.channelCatalog.some((item) => item.channel === channel));
    }
    assert.equal(communicationOs.body.data.notifications.status, "active");
    assert.ok(communicationOs.body.data.notifications.generatedFromCommunications >= 1);
    assert.ok(communicationOs.body.data.emailTemplates.length >= 3);
    assert.ok(communicationOs.body.data.smsTemplates.length >= 3);
    assert.ok(communicationOs.body.data.routingRules.length >= 3);

    const automation = await json<{ id: string; status: string }>("/automation/rules", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP smoke automation", trigger: "LEAD_CREATED", action: "SEND_NOTIFICATION", status: "ACTIVE", approvalRequired: false })
    });
    assert.equal(automation.response.status, 201);
    assert.equal(automation.body.data.status, "ACTIVE");

    const renewalAutomation = await json<{ id: string; status: string }>("/automation/rules", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP smoke renewal reminder", trigger: "RENEWAL_DUE", action: "SEND_NOTIFICATION", status: "ACTIVE", approvalRequired: true })
    });
    assert.equal(renewalAutomation.response.status, 201);

    const reportAutomation = await json<{ id: string; status: string }>("/automation/rules", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP smoke report generation", trigger: "REPORT_READY", action: "QUEUE_REPORT", status: "ACTIVE", approvalRequired: false })
    });
    assert.equal(reportAutomation.response.status, 201);

    const taskAutomation = await json<{ id: string; status: string }>("/automation/rules", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ name: "HTTP smoke task creation", trigger: "TASK_OVERDUE", action: "CREATE_TASK", status: "ACTIVE", approvalRequired: false })
    });
    assert.equal(taskAutomation.response.status, 201);

    const automationList = await json<Array<{ id: string }>>("/automation/rules");
    assert.equal(automationList.response.status, 200);
    assert.equal(automationList.body.data.some((item) => item.id === automation.body.data.id), true);

    const automationOs = await json<{
      triggers: Array<{ trigger: string }>;
      actions: Array<{ action: string }>;
      conditions: Array<{ condition: string }>;
      approvalRules: unknown[];
      followUpAutomation: unknown[];
      renewalReminders: unknown[];
      reportGeneration: unknown[];
      taskCreation: unknown[];
      templates: Array<{ title: string }>;
    }>("/automation/operating-system");
    assert.equal(automationOs.response.status, 200);
    for (const trigger of ["LEAD_CREATED", "TICKET_CREATED", "RENEWAL_DUE", "REPORT_READY", "TASK_OVERDUE"]) {
      assert.ok(automationOs.body.data.triggers.some((item) => item.trigger === trigger));
    }
    for (const action of ["CREATE_TASK", "SEND_NOTIFICATION", "QUEUE_REPORT", "REQUEST_APPROVAL"]) {
      assert.ok(automationOs.body.data.actions.some((item) => item.action === action));
    }
    assert.ok(automationOs.body.data.conditions.some((item) => item.condition === "approvalRequired === true"));
    assert.ok(automationOs.body.data.approvalRules.length >= 1);
    assert.ok(automationOs.body.data.followUpAutomation.length >= 1);
    assert.ok(automationOs.body.data.renewalReminders.length >= 1);
    assert.ok(automationOs.body.data.reportGeneration.length >= 1);
    assert.ok(automationOs.body.data.taskCreation.length >= 1);
    assert.ok(automationOs.body.data.templates.some((item) => item.title === "Renewal reminder"));

    const settings = await json<{ themeMode: string; billingEmail: string }>("/settings", {
      method: "PATCH",
      headers: csrfHeader,
      body: JSON.stringify({ themeMode: "system", billingEmail: "billing@vmnexus.local", notificationEmail: true, notificationSms: true })
    });
    assert.equal(settings.response.status, 200);
    assert.equal(settings.body.data.billingEmail, "billing@vmnexus.local");

    const settingsOs = await json<{
      companyProfile: { route: string; status: string };
      users: { route: string; status: string };
      roles: { route: string };
      permissions: { route: string };
      themes: { themeMode: string; options: string[] };
      domains: { keys: string[] };
      billing: { billingEmail: string; route: string };
      notifications: { email: boolean; sms: boolean; route: string };
      templates: Array<{ name: string; route: string }>;
      security: { controls: string[] };
      apiKeysPlaceholder: { configured: boolean; status: string; providerGroups: string[] };
    }>("/settings/operating-system");
    assert.equal(settingsOs.response.status, 200);
    assert.equal(settingsOs.body.data.companyProfile.route, "/api/v1/workspaces");
    assert.equal(settingsOs.body.data.users.route, "/api/v1/auth/session");
    assert.equal(settingsOs.body.data.roles.route, "/api/v1/roles");
    assert.equal(settingsOs.body.data.permissions.route, "/api/v1/roles/check");
    assert.equal(settingsOs.body.data.themes.themeMode, "system");
    assert.ok(settingsOs.body.data.themes.options.includes("dark"));
    assert.ok(settingsOs.body.data.domains.keys.includes("ROOT_DOMAIN"));
    assert.equal(settingsOs.body.data.billing.billingEmail, "billing@vmnexus.local");
    assert.equal(settingsOs.body.data.billing.route, "/api/v1/billing/summary");
    assert.equal(settingsOs.body.data.notifications.email, true);
    assert.equal(settingsOs.body.data.notifications.sms, true);
    assert.ok(settingsOs.body.data.templates.some((item) => item.name === "Email templates"));
    assert.ok(settingsOs.body.data.security.controls.includes("CSRF"));
    assert.equal(settingsOs.body.data.apiKeysPlaceholder.status, "placeholder");
    assert.ok(settingsOs.body.data.apiKeysPlaceholder.providerGroups.includes("payments"));

    const notification = await json<{ id: string; read: boolean }>("/notifications", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ title: "HTTP smoke notification", message: "Notification body", smsTo: "+919999999999" })
    });
    assert.equal(notification.response.status, 201);
    assert.equal(notification.body.data.read, false);

    const readNotification = await json<{ id: string; read: boolean }>(`/notifications/${notification.body.data.id}/read`, {
      method: "PATCH",
      headers: csrfHeader
    });
    assert.equal(readNotification.response.status, 200);
    assert.equal(readNotification.body.data.read, true);

    const upload = await json<{ storageProvider: string; checksum: string; tags: string[]; version: number; documentType: string; expiryReminder: string }>("/files/uploads", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({
        fileName: "api-smoke.txt",
        mimeType: "text/plain",
        contentBase64: Buffer.from("api smoke upload").toString("base64"),
        folder: "smoke",
        tags: ["customer", "legal"],
        version: 2,
        expiresAt: "2026-12-31",
        documentType: "CUSTOMER"
      })
    });
    assert.equal(upload.response.status, 201);
    assert.equal(upload.body.data.storageProvider, "local");
    assert.ok(upload.body.data.checksum);
    assert.equal(upload.body.data.version, 2);
    assert.equal(upload.body.data.documentType, "CUSTOMER");
    assert.deepEqual(upload.body.data.tags, ["customer", "legal"]);
    assert.ok(upload.body.data.expiryReminder.includes("2026-12-31"));

    const documentUpload = await json<{ storageProvider: string; checksum: string }>("/documents/uploads", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({
        fileName: "api-smoke-document.txt",
        mimeType: "text/plain",
        contentBase64: Buffer.from("api smoke document upload").toString("base64"),
        folder: "documents"
      })
    });
    assert.equal(documentUpload.response.status, 201);
    assert.equal(documentUpload.body.data.storageProvider, "local");
    assert.ok(documentUpload.body.data.checksum);

    const reportsOs = await json<{
      reportCatalog: Array<{ reportType: string; label: string }>;
      downloadFormats: Array<{ format: string; label: string }>;
      suiteSeparation: { founderCombined: string[] };
    }>("/reports/operating-system");
    assert.equal(reportsOs.response.status, 200);
    for (const reportType of ["PNL", "GST", "CASH_FLOW", "SALES", "HIRING", "SUPPORT", "COMPLIANCE", "FOUNDER_MONTHLY"]) {
      assert.ok(reportsOs.body.data.reportCatalog.some((item) => item.reportType === reportType));
    }
    assert.ok(reportsOs.body.data.downloadFormats.some((item) => item.format === "EXCEL" && item.label === "Excel download"));
    assert.ok(reportsOs.body.data.downloadFormats.some((item) => item.format === "PDF" && item.label === "PDF download"));
    assert.ok(reportsOs.body.data.suiteSeparation.founderCombined.includes("Monthly founder report"));

    const report = await json<{ id: string; content: string }>("/reports/exports", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ reportType: "PNL", format: "EXCEL" })
    });
    assert.equal(report.response.status, 201);
    assert.ok(report.body.data.content.includes("Gross Profit"));

    const supportReport = await json<{ id: string; reportType: string }>("/reports/exports", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ reportType: "SUPPORT", format: "PDF" })
    });
    assert.equal(supportReport.response.status, 201);
    assert.equal(supportReport.body.data.reportType, "SUPPORT");

    const caExport = await json<{ id: string; content: string }>("/finance/exports", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({ reportType: "CA_EXPORT", format: "EXCEL" })
    });
    assert.equal(caExport.response.status, 201);
    assert.ok(caExport.body.data.content.includes("CA Export,Yes"));

    const reportList = await json<Array<{ id: string }>>("/reports/exports");
    assert.equal(reportList.response.status, 200);
    assert.equal(reportList.body.data.some((item) => item.id === report.body.data.id), true);

    const download = await request<string>(`/reports/exports/${report.body.data.id}/download`);
    assert.equal(download.response.status, 200);
    assert.equal(String(download.body).includes("Gross Profit"), true);

    const dashboard = await json<{ organization: { id: string } }>("/dashboard/founder");
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.body.data.organization.id, workspace.body.data.organization.id);

    const suiteDashboard = await json<{ suiteType: string; activePlan: string; finance: { revenue: number }; operations: { tasks: number } }>("/dashboard/suite/VMETRON_SUITE");
    assert.equal(suiteDashboard.response.status, 200);
    assert.equal(suiteDashboard.body.data.suiteType, "VMETRON_SUITE");
    assert.equal(suiteDashboard.body.data.activePlan, "vmetron-growth");
    assert.equal(suiteDashboard.body.data.finance.revenue, 125000);
    assert.equal(suiteDashboard.body.data.operations.tasks, 1);

    const intelligence = await json<{ provider: string; snapshotId: string }>("/intelligence/summary");
    assert.equal(intelligence.response.status, 200);
    assert.equal(intelligence.body.data.provider, "deterministic");
    assert.ok(intelligence.body.data.snapshotId);

    const latestIntelligence = await json<{ id: string }>("/intelligence/latest");
    assert.equal(latestIntelligence.response.status, 200);
    assert.equal(latestIntelligence.body.data.id, intelligence.body.data.snapshotId);

    const intelligenceOs = await json<{
      explainReports: { summary: string; source: string };
      suggestNextTasks: unknown[];
      detectRisks: unknown[];
      suggestFollowUps: Array<{ route: string }>;
      draftCommunications: Array<{ channel: string }>;
      summarizeTickets: { open: number; resolved: number; summary: string };
      summarizeInterviews: { candidates: number; interviews: number; summary: string };
      financialAssistant: { revenue: number; netCashFlow: number; suggestion: string };
      salesAssistant: { leads: number; expectedPipeline: number; suggestion: string };
      disclaimer: string;
    }>("/intelligence/operating-system");
    assert.equal(intelligenceOs.response.status, 200);
    assert.equal(intelligenceOs.body.data.explainReports.source, "/api/v1/reports/operating-system");
    assert.ok(intelligenceOs.body.data.explainReports.summary);
    assert.ok(intelligenceOs.body.data.suggestNextTasks.length >= 1);
    assert.ok(intelligenceOs.body.data.detectRisks.length >= 1);
    assert.ok(intelligenceOs.body.data.suggestFollowUps.some((item) => item.route === "/api/v1/crm/sales-operations"));
    assert.ok(intelligenceOs.body.data.draftCommunications.some((item) => item.channel === "CUSTOMER_FOLLOW_UP"));
    assert.ok(intelligenceOs.body.data.summarizeTickets.resolved >= 1);
    assert.ok(intelligenceOs.body.data.summarizeInterviews.interviews >= 1);
    assert.equal(intelligenceOs.body.data.financialAssistant.revenue, 125000);
    assert.equal(intelligenceOs.body.data.salesAssistant.expectedPipeline, 200000);
    assert.ok(intelligenceOs.body.data.disclaimer);

    const auditEntry = await json<{ id: string }>("/audit", {
      method: "POST",
      headers: csrfHeader,
      body: JSON.stringify({
        actorId: register.body.data.id,
        organizationId: workspace.body.data.organization.id,
        action: "SECURITY_ACTION",
        entityType: "HttpSmoke",
        metadata: { checked: true }
      })
    });
    assert.equal(auditEntry.response.status, 201);

    const auditSummary = await json<{ security: number }>("/audit/summary");
    assert.equal(auditSummary.response.status, 200);
    assert.ok(auditSummary.body.data.security >= 1);

    for (const summaryPath of [
      "/crm/summary",
      "/support/summary",
      "/hr/summary",
      "/legal/summary",
      "/compliance/summary",
      "/creators/summary",
      "/partners/summary",
      "/communication/summary",
      "/automation/summary",
      "/settings/summary"
    ]) {
      const summary = await request<ApiEnvelope<unknown>>(summaryPath);
      assert.equal(summary.response.status, 200, `${summaryPath} should respond successfully`);
    }

    const readiness = await json<{ status: string }>("/system/readiness");
    assert.equal(readiness.response.status, 200);
    assert.equal(readiness.body.data.status, "limited");

    console.log("API HTTP smoke test passed through auth, CSRF, workspace, billing summary, finance, tasks, CRM, support, HR, legal, compliance, creators, partners, communication, automation, settings, notifications, files, reports, intelligence, audit, dashboard, and readiness routes.");
  } finally {
    server.close();
  }
}

main().catch((error) => {
  server.close();
  console.error(error);
  process.exit(1);
});
