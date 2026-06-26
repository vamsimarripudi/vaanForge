const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const contracts = [
  {
    name: "founder registration form",
    file: "frontend/src/features/auth/components/RegisterPanel.tsx",
    requires: [
      "action={register}",
      'apiClient("/auth/register"',
      'name="name"',
      'name="email"',
      'name="password"',
      "Create founder account"
    ]
  },
  {
    name: "account access and recovery form",
    file: "frontend/src/features/auth/components/AuthAccessPanel.tsx",
    requires: [
      "action={login}",
      "action={requestReset}",
      'apiClient("/auth/login"',
      'apiClient("/auth/password-reset/request"',
      'href="/account/reset-password"',
      "Send reset link"
    ]
  },
  {
    name: "password reset confirmation form",
    file: "frontend/src/features/auth/components/PasswordResetPanel.tsx",
    requires: [
      "action={confirmReset}",
      'apiClient("/auth/password-reset/confirm"',
      'name="token"',
      'name="password"',
      "Reset password"
    ]
  },
  {
    name: "session visibility and logout controls",
    file: "frontend/src/features/auth/components/SessionPanel.tsx",
    requires: [
      'apiClient<SessionUser | null>("/auth/session")',
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient("/auth/logout"',
      '"x-csrf-token": csrf.csrfToken',
      "Refresh",
      "Sign out"
    ]
  },
  {
    name: "onboarding workspace recommendation form",
    file: "frontend/src/features/onboarding/components/OnboardingFlow.tsx",
    requires: [
      "action={createPreview}",
      'name="businessType"',
      'name="productsNeeded"',
      'name="requiredPortals"',
      "recommendedSuite",
      "recommendedModules",
      "Create workspace preview"
    ]
  },
  {
    name: "workspace activation form",
    file: "frontend/src/features/workspaces/components/WorkspaceActivationPanel.tsx",
    requires: [
      "action={activate}",
      'apiClient("/workspaces"',
      'name="organizationName"',
      'name="workspaceName"',
      "Recommended modules",
      "EDUCATION_SUITE",
      "VMETRON_SUITE",
      "Activate workspace",
      'href="/founder/dashboard"',
      '"/education/dashboard"',
      '"/vmetron/dashboard"',
      'href="/operations"',
      'href="/settings"',
      "Suite dashboard"
    ]
  },
  {
    name: "suite dashboard live summary",
    file: "frontend/src/features/dashboard/components/SuiteDashboard.tsx",
    requires: [
      "apiClient<SuiteSummary>(`/dashboard/suite/${suiteType}`",
      "fallbackSummary",
      "StatePanel",
      "Enabled products",
      "Gross profit",
      "Net cash flow",
      "summary.operations.supportTickets",
      "summary.growth.complianceItems"
    ]
  },
  {
    name: "pricing plan catalog visibility",
    file: "frontend/src/features/billing/components/PlanCatalogPanel.tsx",
    requires: [
      'apiClient<SuitePlan[]>("/plans")',
      "apiClient<SuitePlan>(`/plans/${selectedPlanId}`",
      "Plan Catalog",
      "Refresh catalog",
      "Load selected plan",
      "suiteCounts",
      "selectedPlanId"
    ]
  },
  {
    name: "billing invoice and renewal system",
    file: "frontend/src/features/billing/components/BillingSystemPanel.tsx",
    requires: [
      'apiClient<BillingSummary>("/billing/summary")',
      "Billing & Invoice System",
      "Payment status",
      "Renewal status",
      "Next renewal",
      "Invoices",
      "Renewal Reminders",
      "Refresh billing",
      "PRICE_PENDING",
      "PRICE_APPROVAL_REQUIRED"
    ]
  },
  {
    name: "pricing checkout control",
    file: "frontend/src/features/billing/components/PlanGrid.tsx",
    requires: [
      "onClick={startCheckout}",
      "onClick={startTrial}",
      "onClick={checkEntitlement}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<TrialResponse>("/billing/trial"',
      'apiClient<CheckoutResponse>("/billing/checkout"',
      'apiClient<EntitlementCheck>("/entitlements/check"',
      '"x-csrf-token": csrf.csrfToken',
      "plan.monthlyPrice === null",
      "usage: { [featureKey]: usage }",
      "Price pending",
      "Start trial",
      "Start checkout",
      "Check entitlement"
    ]
  },
  {
    name: "role setup permission checker",
    file: "frontend/src/features/roles/components/RoleSetupPanel.tsx",
    requires: [
      'apiClient<RoleSummary[]>("/roles")',
      'apiClient<PermissionCheck>("/roles/check"',
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      '"x-csrf-token": csrf.csrfToken',
      "coreRoles.map",
      "permissionGroups.map",
      "Check permission"
    ]
  },
  {
    name: "settings file upload workflow",
    file: "frontend/src/features/files/components/FileUploadPanel.tsx",
    requires: [
      "action={upload}",
      'type="file"',
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<UploadedFile>("/files/uploads"',
      '"x-csrf-token": csrf.csrfToken',
      "contentBase64",
      "documentType",
      "expiresAt",
      "tags",
      "version",
      "Document OS Metadata",
      "Upload file",
      "checksum"
    ]
  },
  {
    name: "notification announcement workflow",
    file: "frontend/src/features/notifications/components/NotificationPanel.tsx",
    requires: [
      'apiClient<NotificationItem[]>("/notifications")',
      "action={createNotification}",
      "markRead(item.id)",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<NotificationItem>("/notifications"',
      "apiClient<NotificationItem>(`/notifications/${notificationId}/read`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="smsTo"',
      "Send Notification",
      "Mark read"
    ]
  },
  {
    name: "audit visibility workflow",
    file: "frontend/src/features/audit/components/AuditPanel.tsx",
    requires: [
      'apiClient<AuditSummary>("/audit/summary")',
      'apiClient<AuditLogEntry[]>("/audit")',
      "action={recordAudit}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<AuditLogEntry>("/audit"',
      '"x-csrf-token": csrf.csrfToken',
      'name="actorId"',
      'name="organizationId"',
      'name="entityType"',
      "Record Audit",
      "Refresh"
    ]
  },
  {
    name: "operations readiness panel",
    file: "frontend/src/features/operations/components/OperationsDashboard.tsx",
    requires: [
      'apiClient<OperationsSummary>("/tasks/summary")',
      'apiClient<ProjectRecord[]>("/tasks/projects")',
      'apiClient<TaskRecord[]>("/tasks")',
      'apiClient<WorkAllocation>("/tasks/work-allocation")',
      "action={createProject}",
      "action={createTask}",
      "action={assignTask}",
      "action={updateTaskStatus}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient("/tasks/projects"',
      'apiClient<{ id: string }>("/tasks"',
      "apiClient(`/tasks/${taskId}/assign`",
      "apiClient(`/tasks/${taskId}/status`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="priority"',
      'name="ownerId"',
      "Save Project",
      "Save Task",
      "Assign Task",
      "Update Task Status",
      'fetch(`${API_BASE_URL}/system/readiness`',
      "Launch Readiness",
      "Recent Projects",
      "Recent Tasks",
      "Work Allocation OS",
      "Comments",
      "Attachments",
      "Recurring Tasks",
      "Refresh work records",
      "counts.pass",
      "counts.warn",
      "counts.fail"
    ]
  },
  {
    name: "finance entry workflow",
    file: "frontend/src/features/finance/components/FinanceDashboard.tsx",
    requires: [
      'apiClient<FinanceSummary>("/finance/summary")',
      'apiClient<FinanceAnalytics>("/finance/analytics")',
      'apiClient<ReportExport[]>("/finance/exports")',
      "action={createRevenue}",
      "action={createExpense}",
      "action={queueExport}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient("/finance/revenue"',
      'apiClient("/finance/expenses"',
      'apiClient<ReportExport>("/finance/exports"',
      'href={`${API_BASE_URL}/finance/exports/${item.id}/download`}',
      '"x-csrf-token": csrf.csrfToken',
      'name="receivedAt"',
      'name="spentAt"',
      'name="reportType"',
      "CA_EXPORT",
      "Founder Payout Planning",
      "Product-wise Revenue",
      "Product-wise Profit",
      "CA Export",
      "Save Revenue",
      "Save Expense",
      "Queue Finance Export"
    ]
  },
  {
    name: "crm entry workflow",
    file: "frontend/src/features/crm/components/CrmDashboard.tsx",
    requires: [
      'apiClient<CrmSummary>("/crm/summary")',
      'apiClient<LeadRecord[]>("/crm/leads")',
      'apiClient<CustomerRecord[]>("/crm/customers")',
      'apiClient<SalesOperations>("/crm/sales-operations")',
      "action={createLead}",
      "action={createCustomer}",
      "action={updateLeadStage}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<{ id: string }>("/crm/leads"',
      'apiClient("/crm/customers"',
      "apiClient(`/crm/leads/${leadId}/stage`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="expectedValue"',
      'name="renewalDate"',
      'name="leadId"',
      "Recent Leads",
      "Recent Customers",
      "Sales Operations",
      "Deals",
      "Follow-ups",
      "Demo Scheduling",
      "Proposals",
      "Objections",
      "Renewals",
      "Sales Psychology Assistant",
      "Refresh CRM records",
      "Save Lead",
      "Save Customer",
      "Update Stage"
    ]
  },
  {
    name: "support ticket workflow",
    file: "frontend/src/features/support/components/SupportDashboard.tsx",
    requires: [
      'apiClient<SupportSummary>("/support/summary")',
      'apiClient<SupportOperations>("/support/operations")',
      'apiClient<SupportTicket[]>("/support/tickets")',
      "apiClient<TicketMessage[]>(`/support/tickets/${selectedTicketId}/messages`",
      "action={createTicket}",
      "action={addTicketMessage}",
      "action={updateTicketStatus}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<{ id: string }>("/support/tickets"',
      "apiClient(`/support/tickets/${ticketId}/messages`",
      "apiClient(`/support/tickets/${ticketId}/status`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="internal"',
      "Support Operations",
      "Refresh operations",
      "Live Chat",
      "Escalation Paths",
      "Knowledge Base",
      "Recent Tickets",
      "Ticket Messages",
      "Refresh tickets",
      "View messages",
      "Save Ticket",
      "Save Message",
      "Update Ticket Status"
    ]
  },
  {
    name: "customer portal workflow",
    file: "frontend/src/features/customer/components/CustomerPortal.tsx",
    requires: [
      'apiClient<CustomerSummary>("/crm/summary")',
      'apiClient<CustomerPortalOs>("/crm/customer-portal")',
      "action={createCustomer}",
      "action={createSupportTicket}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<{ id: string }>("/crm/customers"',
      'apiClient("/support/tickets"',
      '"x-csrf-token": csrf.csrfToken',
      'name="customerId"',
      "Subscription",
      "Invoices",
      "Support Tickets",
      "Product Access",
      "Announcements",
      "Documents",
      "Renewal Status",
      "Refresh customer portal",
      "Save Customer",
      "Save Ticket"
    ]
  },
  {
    name: "hr hiring interview workflow",
    file: "frontend/src/features/hr/components/HrDashboard.tsx",
    requires: [
      'apiClient<HrSummary>("/hr/summary")',
      'apiClient<TeamOperations>("/hr/team-operations")',
      "action={createDepartment}",
      "action={createEmployee}",
      "action={createCandidate}",
      "action={createInterview}",
      "action={updateCandidateStage}",
      "action={scoreInterview}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<{ id: string }>("/hr/departments"',
      'apiClient<{ id: string }>("/hr/employees"',
      'apiClient<{ id: string }>("/hr/candidates"',
      'apiClient<{ id: string }>("/hr/interviews"',
      "apiClient(`/hr/candidates/${candidateId}/stage`",
      "apiClient(`/hr/interviews/${interviewId}/score`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="roleApplied"',
      'name="scheduledAt"',
      'name="candidateId"',
      'name="feedback"',
      "Team Operations",
      "Refresh team operations",
      "Attendance",
      "Leaves",
      "Performance",
      "Org Chart",
      "Access Control",
      "Save Department",
      "Save Employee",
      "Save Candidate",
      "Update Candidate Stage",
      "Save Interview",
      "Score Interview"
    ]
  },
  {
    name: "legal agreement workflow",
    file: "frontend/src/features/legal/components/LegalDashboard.tsx",
    requires: [
      'apiClient<LegalSummary>("/legal/summary")',
      'apiClient<AgreementRecord[]>("/legal/agreements")',
      'apiClient<LegalOperatingSystem>("/legal/operating-system")',
      "action={createAgreement}",
      "action={updateAgreementStatus}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<{ id: string }>("/legal/agreements"',
      "apiClient(`/legal/agreements/${agreementId}/status`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="partyName"',
      'name="expiresAt"',
      'name="agreementId"',
      "Save Agreement",
      "Update Agreement Status",
      "Recent Agreements",
      "Legal OS",
      "Agreement Catalog",
      "Policy Register",
      "Legal Awareness Notes",
      "Refresh agreements",
      "agreements.map",
      "Legal disclaimer"
    ]
  },
  {
    name: "compliance registration workflow",
    file: "frontend/src/features/compliance/components/ComplianceDashboard.tsx",
    requires: [
      'apiClient<ComplianceSummary>("/compliance/summary")',
      'apiClient<ComplianceOperatingSystem>("/compliance/operating-system")',
      "action={createComplianceItem}",
      "action={updateComplianceItemStatus}",
      "action={createRegistration}",
      "action={updateRegistrationStatus}",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<{ id: string }>("/compliance/items"',
      "apiClient(`/compliance/items/${itemId}/status`",
      'apiClient<{ id: string }>("/compliance/registrations"',
      "apiClient(`/compliance/registrations/${registrationId}/status`",
      'method: "PATCH"',
      '"x-csrf-token": csrf.csrfToken',
      'name="itemId"',
      'name="referenceNumber"',
      'name="registrationId"',
      "Compliance & Government Registration OS",
      "Registration Catalog",
      "Compliance Calendar",
      "Filing Reminders",
      "Save Compliance Item",
      "Update Compliance Status",
      "Save Registration",
      "Update Status"
    ]
  },
  {
    name: "intelligence latest snapshot visibility",
    file: "frontend/src/features/growth/components/IntelligenceSnapshotPanel.tsx",
    requires: [
      'apiClient<IntelligenceSnapshot | null>("/intelligence/latest")',
      "Latest Intelligence Snapshot",
      "Refresh snapshot",
      "Risk Signals",
      "Next Tasks",
      "snapshot.reportExplanation",
      "snapshot.disclaimer"
    ]
  },
  {
    name: "intelligence operating system",
    file: "frontend/src/features/intelligence/components/IntelligenceOsPanel.tsx",
    requires: [
      'apiClient<IntelligenceOs>("/intelligence/operating-system")',
      "Intelligence OS",
      "Explain Reports",
      "Suggest Next Tasks",
      "Detect Risks",
      "Suggest Follow-ups",
      "Draft Communications",
      "Summarize Tickets",
      "Summarize Interviews",
      "Financial Assistant",
      "Sales Assistant",
      "Refresh intelligence OS",
      "CUSTOMER_FOLLOW_UP"
    ]
  },
  {
    name: "growth module workflow renderer",
    file: "frontend/src/features/growth/components/ModuleSummaryDashboard.tsx",
    requires: [
      "workflow?: WorkflowConfig",
      "workflows?: WorkflowConfig[]",
      "listEndpoint?: string",
      "listColumns?: ListColumn[]",
      "lists?: ListConfig[]",
      "activeLists",
      "apiClient<Array<Record<string, string | number | boolean | undefined>>>(listConfig.endpoint)",
      "Refresh records",
      "activeWorkflows",
      'method?: "POST" | "PATCH"',
      "submitWorkflow(formData, selectedWorkflow)",
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      "apiClient(selectedWorkflow.endpoint",
      'method: selectedWorkflow.method || "POST"',
      '"x-csrf-token": csrf.csrfToken',
      "selectedWorkflow.submitLabel",
      "selectedWorkflow.fields.map"
    ]
  },
  {
    name: "intelligence snapshot route",
    file: "frontend/src/app/intelligence/page.tsx",
    requires: [
      "IntelligenceSnapshotPanel",
      'endpoint="/intelligence/summary"',
      "deterministic placeholders"
    ]
  },
  {
    name: "creator partner communication automation workflows",
    file: "frontend/src/app/creator/page.tsx",
    requires: [
      "CreatorPortalPanel",
      'endpoint: "/creators/profiles"',
      'endpoint: "/creators/campaigns"',
      'endpoint: "/creators/profiles"',
      'endpoint: "/creators/campaigns"',
      "Recent Creator Profiles",
      "Recent Campaigns",
      "Save Creator",
      "Save Campaign",
      "payoutStatus",
      "IN_REVIEW",
      "budget"
    ]
  },
  {
    name: "creator portal operating system",
    file: "frontend/src/features/creator/components/CreatorPortalPanel.tsx",
    requires: [
      'apiClient<CreatorPortal>("/creators/creator-portal")',
      "Creator Portal OS",
      "Campaigns",
      "Creator Billing",
      "Content Ideas",
      "Concept Sharing",
      "Approval Flow",
      "Brand Guidelines",
      "Payouts",
      "Performance Tracking",
      "Refresh creator portal",
      "creator ROI"
    ]
  },
  {
    name: "promotions and marketing operations",
    file: "frontend/src/app/marketing/page.tsx",
    requires: [
      'apiClient<PromotionsSummary>("/creators/promotions")',
      "Promotions & Marketing OS",
      "Campaigns",
      "Social Posts",
      "Creator Collaborations",
      "Approval Queue",
      "Content Calendar",
      "Performance Tracking",
      "Refresh promotions",
      "creator ROI"
    ]
  },
  {
    name: "partner workflow",
    file: "frontend/src/app/partners/page.tsx",
    requires: [
      'endpoint: "/partners"',
      'listEndpoint="/partners"',
      "Recent Partners",
      "Save Partner",
      "revenueSharePercent"
    ]
  },
  {
    name: "partner collaboration operations",
    file: "frontend/src/features/partners/components/PartnerCollaborationPanel.tsx",
    requires: [
      'apiClient<PartnerCollaborationOs>("/partners/collaboration-os")',
      "Partner & Collaboration OS",
      "Collaborations",
      "Revenue Share",
      "Agreements",
      "Tasks",
      "Approvals",
      "Communications",
      "Refresh collaborations"
    ]
  },
  {
    name: "communication workflow",
    file: "frontend/src/app/communication/page.tsx",
    requires: [
      'endpoint: "/communication"',
      'listEndpoint="/communication"',
      "Recent Communications",
      "Save Communication",
      "CUSTOMER_FOLLOW_UP"
    ]
  },
  {
    name: "communication operating system",
    file: "frontend/src/features/communication/components/CommunicationOsPanel.tsx",
    requires: [
      'apiClient<CommunicationOs>("/communication/operating-system")',
      "Communication OS",
      "Channel Catalog",
      "Email Templates",
      "SMS Templates",
      "Routing Rules",
      "Refresh communication",
      "notificationsService",
      "CUSTOMER_FOLLOW_UP"
    ]
  },
  {
    name: "automation workflow",
    file: "frontend/src/app/automation/page.tsx",
    requires: [
      "AutomationOsPanel",
      'endpoint: "/automation/rules"',
      'listEndpoint="/automation/rules"',
      "Recent Automation Rules",
      "Save Rule",
      "approvalRequired"
    ]
  },
  {
    name: "automation operating system",
    file: "frontend/src/features/automation/components/AutomationOsPanel.tsx",
    requires: [
      'apiClient<AutomationOs>("/automation/operating-system")',
      "Automation OS",
      "Triggers",
      "Actions",
      "Conditions",
      "Approval Rules",
      "Follow-up Automation",
      "Renewal Reminders",
      "Report Generation",
      "Task Creation",
      "Refresh automation OS",
      "LEAD_CREATED",
      "RENEWAL_DUE",
      "QUEUE_REPORT",
      "CREATE_TASK"
    ]
  },
  {
    name: "settings admin workflow",
    file: "frontend/src/app/settings/page.tsx",
    requires: [
      "SettingsOsPanel",
      'endpoint: "/settings"',
      'method: "PATCH"',
      "Save Settings",
      "themeMode",
      "billingEmail",
      "notificationEmail",
      "notificationSms"
    ]
  },
  {
    name: "settings operating system",
    file: "frontend/src/features/settings/components/SettingsOsPanel.tsx",
    requires: [
      'apiClient<SettingsOs>("/settings/operating-system")',
      "Settings OS",
      "Company Profile",
      "Users",
      "Roles",
      "Permissions",
      "Themes",
      "Domains",
      "Billing",
      "Notifications",
      "Templates",
      "Security",
      "API Keys Placeholder",
      "Refresh settings OS",
      "ROOT_DOMAIN",
      "permission guards",
      "payments"
    ]
  },
  {
    name: "reports export workflow",
    file: "frontend/src/app/reports/page.tsx",
    requires: [
      'apiClient<ReportsOs>("/reports/operating-system")',
      'apiClient<ReportExport[]>("/reports/exports")',
      'apiClient<{ csrfToken: string }>("/security/csrf")',
      'apiClient<ReportExport>("/reports/exports"',
      '"x-csrf-token": csrf.csrfToken',
      'href={`${API_BASE_URL}/reports/exports/${item.id}/download`}',
      "Reports OS",
      "P&L report",
      "GST report",
      "Cash flow report",
      "Sales report",
      "Hiring report",
      "Support report",
      "Compliance report",
      "Founder monthly report",
      "Excel download",
      "PDF download",
      "Refresh reports OS",
      'value="SALES"',
      'value="HIRING"',
      'value="SUPPORT"',
      'value="COMPLIANCE"',
      "Queue export",
      "Export Queue"
    ]
  }
];

const failures = [];

for (const contract of contracts) {
  const absolutePath = path.join(rootDir, contract.file);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${contract.name}: missing ${contract.file}`);
    continue;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  for (const required of contract.requires) {
    if (!source.includes(required)) {
      failures.push(`${contract.name}: expected ${required} in ${contract.file}`);
    }
  }
}

if (failures.length) {
  console.error(`UI interaction contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`UI interaction contract check passed for ${contracts.length} flows.`);
