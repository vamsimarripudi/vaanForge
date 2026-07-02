import type { CoreRole } from "@kravia/shared/roles";
import type { BillingStatus, ProductEntitlement, SuiteType } from "@kravia/shared/types";
import type { LeadStage, TicketPriority, TicketStatus, WorkPriority, WorkStatus } from "@kravia/shared/operations";
import type { CandidateStage, EmployeeStatus, InterviewRound, InterviewStatus } from "@kravia/shared/hr";
import type { AgreementType, ComplianceStatus, DocumentStatus, RegistrationType } from "@kravia/shared/legal";
import type { AutomationAction, AutomationStatus, AutomationTrigger, CampaignStatus, MessageChannel, PartnerStatus } from "@kravia/shared/growth";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: CoreRole;
  organizationId?: string;
  createdAt: string;
}

export interface StoredUserProfile {
  id: string;
  userId: string;
  organizationId?: string;
  displayName: string;
  title?: string;
  timezone: string;
  locale: string;
  avatarStorageKey?: string;
  updatedAt: string;
  createdAt: string;
}

export interface StoredLoginHistory {
  id: string;
  userId: string;
  organizationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: "success" | "failed";
  createdAt: string;
}

export interface StoredPasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  consumedAt?: string;
  createdAt: string;
}

export interface StoredOrganization {
  id: string;
  name: string;
  suiteType: SuiteType;
  activePlan: string;
  billingStatus: BillingStatus;
  renewalDate?: string;
  createdAt: string;
}

export interface StoredWorkspace {
  id: string;
  organizationId: string;
  suiteType: SuiteType;
  name: string;
  enabledProducts: string[];
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
}

export interface StoredNotification {
  id: string;
  organizationId: string;
  userId?: string;
  source?: "billing" | "projects" | "agents" | "deployments" | "marketplace" | "support" | "security" | "announcements" | "system";
  actionUrl?: string;
  archived?: boolean;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type StoredOnboardingStep =
  | "welcome"
  | "create_workspace"
  | "choose_role"
  | "choose_use_case"
  | "create_first_project"
  | "ai_introduction"
  | "connect_providers"
  | "billing_selection"
  | "success";

export interface StoredOnboardingProgress {
  id: string;
  organizationId: string;
  workspaceId?: string;
  userId: string;
  status: "in_progress" | "completed";
  currentStep: StoredOnboardingStep;
  completedSteps: StoredOnboardingStep[];
  role?: string;
  useCase?: string;
  selectedPlanId?: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
}

export interface StoredProductTourProgress {
  id: string;
  organizationId: string;
  userId: string;
  tourKey: string;
  status: "available" | "completed" | "dismissed";
  replayCount: number;
  completedAt?: string;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWorkspaceSetup {
  id: string;
  organizationId: string;
  workspaceId: string;
  userId: string;
  workspaceName?: string;
  logoFileId?: string;
  timezone?: string;
  defaultAiProvider?: string;
  notificationSettings?: Record<string, unknown>;
  brandColors?: Record<string, string>;
  projectDefaults?: Record<string, unknown>;
  deploymentDefaults?: Record<string, unknown>;
  integrations?: Record<string, unknown>;
  completedSections: string[];
  updatedAt: string;
  createdAt: string;
}

export interface StoredFeatureDiscoveryView {
  id: string;
  organizationId: string;
  userId: string;
  featureKey: string;
  version: string;
  status: "viewed" | "dismissed";
  createdAt: string;
}

export interface StoredCommandUsage {
  id: string;
  organizationId: string;
  userId: string;
  commandId: string;
  source: "palette" | "search" | "shortcut";
  createdAt: string;
}

export interface StoredRevenue {
  id: string;
  organizationId: string;
  source: string;
  amount: number;
  receivedAt: string;
  product?: string;
  createdAt: string;
}

export interface StoredExpense {
  id: string;
  organizationId: string;
  category: string;
  amount: number;
  spentAt: string;
  vendor?: string;
  createdAt: string;
}

export interface StoredReportExport {
  id: string;
  organizationId: string;
  reportType: "PNL" | "GST" | "CASH_FLOW" | "SALES" | "HIRING" | "SUPPORT" | "COMPLIANCE" | "FOUNDER_MONTHLY" | "CA_EXPORT";
  format: "PDF" | "EXCEL";
  status: "QUEUED" | "READY" | "FAILED";
  fileName: string;
  mimeType: string;
  content: string;
  storageProvider?: string;
  storageKey?: string;
  storageUrl?: string;
  createdAt: string;
}

export interface StoredProject {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface StoredTask {
  id: string;
  organizationId: string;
  projectId?: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  priority: WorkPriority;
  status: WorkStatus;
  createdAt: string;
}

export interface StoredLead {
  id: string;
  organizationId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage: LeadStage;
  expectedValue?: number;
  createdAt: string;
}

export interface StoredCustomer {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  activePlan?: string;
  renewalDate?: string;
  createdAt: string;
}

export interface StoredCrmCompany {
  id: string;
  companyId: string;
  organizationId: string;
  name: string;
  domain?: string;
  ownerId: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface StoredCrmContact {
  id: string;
  contactId: string;
  organizationId: string;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  ownerId: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface StoredCrmOpportunity {
  id: string;
  opportunityId: string;
  organizationId: string;
  leadId?: string;
  companyId?: string;
  contactId?: string;
  name: string;
  stage: "NEW_LEAD" | "QUALIFIED" | "DEMO_SCHEDULED" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "CUSTOMER" | "LOST";
  value: number;
  probability: number;
  expectedCloseDate?: string;
  ownerId: string;
  status: "open" | "won" | "lost";
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCrmTask {
  id: string;
  taskId: string;
  organizationId: string;
  targetType: "lead" | "contact" | "company" | "opportunity" | "customer";
  targetId: string;
  title: string;
  dueDate: string;
  ownerId: string;
  status: "open" | "completed" | "blocked";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerHealthScore {
  id: string;
  scoreId: string;
  organizationId: string;
  workspaceId?: string;
  healthScore: number;
  onboardingCompletion: number;
  usageScore: number;
  billingScore: number;
  supportScore: number;
  riskScore: number;
  expansionOpportunity: "low" | "medium" | "high";
  renewalProbability: number;
  successManagerId?: string;
  nextAction: string;
  calculatedFrom: Record<string, unknown>;
  createdAt: string;
}

export interface StoredSubscriptionOperation {
  id: string;
  operationId: string;
  organizationId: string;
  subscriptionId?: string;
  operationType: "renewal_due" | "failed_payment" | "expired_plan" | "trial_ending" | "credits_low" | "cancellation_request" | "refund_request" | "grant_credits" | "extend_subscription" | "suspend_workspace" | "reactivate_workspace";
  status: "open" | "completed" | "blocked";
  ownerId: string;
  dueDate: string;
  evidence: Record<string, unknown>;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredProviderCostEvent {
  id: string;
  eventId: string;
  organizationId: string;
  workspaceId?: string;
  provider: "openai" | "gemini" | "claude" | "groq" | "hugging_face" | "other";
  requests: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  errors: number;
  estimatedCost: number;
  creditsConsumed: number;
  projectId?: string;
  agentId?: string;
  createdAt: string;
}

export interface StoredInfrastructureCostEvent {
  id: string;
  eventId: string;
  organizationId: string;
  category: "compute" | "storage" | "bandwidth" | "cache" | "database" | "email" | "ai_provider" | "marketplace" | "support";
  amount: number;
  unit: string;
  workspaceId?: string;
  projectId?: string;
  deploymentId?: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredBusinessReport {
  id: string;
  reportId: string;
  organizationId: string;
  reportType: "executive" | "finance" | "billing" | "support" | "marketplace" | "security" | "deployment" | "ai_usage" | "developer";
  format: "PDF" | "CSV" | "EXCEL";
  status: "READY" | "FAILED";
  fileName: string;
  mimeType: string;
  content: string;
  generatedBy: string;
  createdAt: string;
}

export interface StoredEngineeringProject {
  id: string;
  engineeringProjectId: string;
  organizationId: string;
  projectId: string;
  projectOwnerId: string;
  techLeadId: string;
  productOwnerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "planning" | "active" | "blocked" | "release_candidate" | "released" | "archived";
  architectureVersion: string;
  releaseVersion: string;
  documentationStatus: "missing" | "draft" | "current" | "stale";
  securityStatus: "not_reviewed" | "reviewing" | "approved" | "risk_accepted" | "blocked";
  riskScore: number;
  completionPercent: number;
  dependencies: string[];
  technicalDebtScore: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredEngineeringMetric {
  id: string;
  metricId: string;
  organizationId: string;
  metricName: string;
  value: number;
  unit: string;
  source: string;
  projectId?: string;
  createdAt: string;
}

export interface StoredTechnicalDebt {
  id: string;
  debtId: string;
  organizationId: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  ownerId: string;
  impact: string;
  estimatedEffort: string;
  relatedProjectId?: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "accepted";
  risk: "low" | "medium" | "high" | "critical";
  targetSprint?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredArchitectureReview {
  id: string;
  reviewId: string;
  organizationId: string;
  projectId: string;
  architectureVersion: string;
  reviewerId: string;
  status: "requested" | "in_review" | "approved" | "changes_requested" | "rejected";
  findings: string[];
  evidence: Record<string, unknown>;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredArchitectureDecision {
  id: string;
  adrId: string;
  organizationId: string;
  projectId?: string;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  status: "draft" | "proposed" | "approved" | "superseded" | "rejected";
  version: string;
  ownerId: string;
  approvalHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredReleasePipeline {
  id: string;
  pipelineId: string;
  organizationId: string;
  releaseId: string;
  stage: "development" | "internal_qa" | "security_review" | "release_candidate" | "beta" | "general_availability" | "hotfix" | "patch" | "lts";
  status: "pending" | "in_progress" | "approved" | "blocked" | "completed";
  approvalRequired: boolean;
  rollbackPlan: string;
  validationReportId?: string;
  documentationUrl?: string;
  migrationNotes: string;
  ownerId: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredEnvironmentRegistry {
  id: string;
  environmentId: string;
  organizationId: string;
  name: "development" | "testing" | "staging" | "production" | "sandbox" | "preview";
  status: "healthy" | "degraded" | "blocked" | "maintenance";
  region: string;
  ownerId: string;
  providerReadiness: "ready" | "degraded" | "missing_configuration";
  secretsStatus: "configured" | "missing" | "rotation_due";
  databaseStatus: "healthy" | "degraded" | "down";
  storageStatus: "healthy" | "degraded" | "down";
  queueStatus: "healthy" | "degraded" | "down";
  workerStatus: "healthy" | "degraded" | "down";
  deploymentStatus: "idle" | "deploying" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface StoredEnvironmentHealth {
  id: string;
  healthId: string;
  organizationId: string;
  environmentId: string;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredMigrationHistory {
  id: string;
  migrationId: string;
  organizationId: string;
  version: string;
  name: string;
  status: "pending" | "applied" | "failed" | "rolled_back";
  appliedAt?: string;
  rolledBackAt?: string;
  rollbackPlan: string;
  ownerId: string;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDatabaseMetric {
  id: string;
  metricId: string;
  organizationId: string;
  metricName: "index_health" | "query_performance" | "unused_tables" | "unused_columns" | "storage_growth";
  value: number;
  unit: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredEngineeringReport {
  id: string;
  reportId: string;
  organizationId: string;
  reportType: "engineering_dashboard" | "architecture_compliance" | "code_quality" | "technical_debt" | "release_pipeline" | "database_governance";
  status: "READY" | "FAILED";
  content: Record<string, unknown>;
  generatedBy: string;
  createdAt: string;
}

export interface StoredFeatureFlag {
  id: string;
  flagId: string;
  organizationId: string;
  key: string;
  description: string;
  enabled: boolean;
  environment: "development" | "testing" | "staging" | "production" | "sandbox" | "preview";
  rolloutPercent: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSupportTicket {
  id: string;
  organizationId: string;
  customerId?: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
}

export interface StoredTicketMessage {
  id: string;
  ticketId: string;
  authorId?: string;
  message: string;
  internal: boolean;
  createdAt: string;
}

export interface StoredSupportAttachment {
  id: string;
  attachmentId: string;
  ticketId: string;
  organizationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdBy: string;
  createdAt: string;
}

export interface StoredSupportInternalNote {
  id: string;
  noteId: string;
  ticketId: string;
  organizationId: string;
  authorId: string;
  note: string;
  createdAt: string;
}

export interface StoredSupportAnnouncement {
  id: string;
  announcementId: string;
  organizationId: string;
  title: string;
  body: string;
  status: "draft" | "published" | "archived";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredKnowledgeArticle {
  id: string;
  articleId: string;
  organizationId: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  status: "draft" | "published" | "archived";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDepartment {
  id: string;
  organizationId: string;
  name: string;
  leadId?: string;
  createdAt: string;
}

export interface StoredEmployee {
  id: string;
  organizationId: string;
  departmentId?: string;
  name: string;
  email: string;
  role: string;
  status: EmployeeStatus;
  joinedAt?: string;
  createdAt: string;
}

export interface StoredCandidate {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  roleApplied: string;
  stage: CandidateStage;
  source?: string;
  createdAt: string;
}

export interface StoredInterview {
  id: string;
  organizationId: string;
  candidateId: string;
  round: InterviewRound;
  scheduledAt: string;
  interviewerId?: string;
  status: InterviewStatus;
  vaanMeetLink?: string;
  score?: number;
  feedback?: string;
  createdAt: string;
}

export interface StoredOffer {
  id: string;
  organizationId: string;
  candidateId: string;
  title: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface StoredAgreement {
  id: string;
  organizationId: string;
  type: AgreementType;
  title: string;
  partyName?: string;
  status: DocumentStatus;
  expiresAt?: string;
  disclaimer: string;
  createdAt: string;
}

export interface StoredComplianceItem {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  dueDate: string;
  status: ComplianceStatus;
  ownerId?: string;
  createdAt: string;
}

export interface StoredGovernmentRegistration {
  id: string;
  organizationId: string;
  type: RegistrationType;
  title: string;
  status: ComplianceStatus;
  referenceNumber?: string;
  dueDate?: string;
  createdAt: string;
}

export interface StoredCreatorProfile {
  id: string;
  organizationId: string;
  name: string;
  niche?: string;
  payoutStatus?: string;
  createdAt: string;
}

export interface StoredCampaign {
  id: string;
  organizationId: string;
  creatorId?: string;
  title: string;
  status: CampaignStatus;
  budget?: number;
  createdAt: string;
}

export interface StoredPartner {
  id: string;
  organizationId: string;
  name: string;
  status: PartnerStatus;
  revenueSharePercent?: number;
  createdAt: string;
}

export interface StoredCommunication {
  id: string;
  organizationId: string;
  channel: MessageChannel;
  title: string;
  message: string;
  audience?: string;
  createdAt: string;
}

export interface StoredAutomationRule {
  id: string;
  organizationId: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  status: AutomationStatus;
  approvalRequired: boolean;
  createdAt: string;
}

export interface StoredIntelligenceSnapshot {
  id: string;
  organizationId: string;
  reportExplanation: string;
  riskSignals: string[];
  nextTasks: string[];
  disclaimer: string;
  placeholders: number;
  createdAt: string;
}

export type StoredVaanForgeRunStatus = "pending" | "analyzing" | "planned" | "failed" | "completed";
export type StoredVaanForgeOutputType =
  | "product_requirement_document"
  | "architecture_plan"
  | "folder_structure"
  | "database_plan"
  | "api_plan"
  | "ui_screen_list"
  | "sprint_roadmap"
  | "codex_implementation_prompt";

export interface StoredVaanForgeOutput {
  id: string;
  runId: string;
  organizationId: string;
  outputType: StoredVaanForgeOutputType;
  title: string;
  format: "markdown" | "json";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVaanForgeAuditLog {
  id: string;
  runId: string;
  organizationId: string;
  actorId: string;
  step: string;
  status: StoredVaanForgeRunStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredVaanForgeAgentRun {
  id: string;
  runId: string;
  organizationId: string;
  ownerId: string;
  requestedById: string;
  source: string;
  status: StoredVaanForgeRunStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  inputRequirements: Record<string, unknown>;
  errorMessage?: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  jobId?: string;
  provider?: string;
  createdAt: string;
  updatedAt: string;
}

export type StoredAgentExecutionStatus = "pending" | "preparing" | "generating" | "validating" | "repairing" | "completed" | "blocked" | "failed";
export type StoredAgentTaskStatus = "pending" | "preparing" | "generating" | "validating" | "repairing" | "completed" | "blocked" | "failed";
export type StoredAgentFileStatus = "planned" | "written" | "skipped" | "blocked";
export type StoredAgentValidationStatus = "passed" | "failed" | "skipped";
export type StoredAgentErrorStatus = "open" | "repaired" | "blocked";
export type StoredAgentRepairStatus = "attempted" | "succeeded" | "failed";

export interface StoredAgentExecutionRun {
  id: string;
  executionId: string;
  phaseOneRunId: string;
  organizationId: string;
  ownerId: string;
  requestedById: string;
  status: StoredAgentExecutionStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  approvedBlueprint: Record<string, unknown>;
  taskGraph: Record<string, unknown>;
  validationSummary?: Record<string, unknown>;
  executionReport?: Record<string, unknown>;
  errorMessage?: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentTask {
  id: string;
  taskId: string;
  executionId: string;
  organizationId: string;
  module: string;
  title: string;
  description: string;
  status: StoredAgentTaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  ownerId: string;
  dueDate: string;
  dependencies: string[];
  outputPaths: string[];
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentFile {
  id: string;
  fileId: string;
  executionId: string;
  taskId?: string;
  organizationId: string;
  module: string;
  path: string;
  operation: "create" | "update" | "skip";
  status: StoredAgentFileStatus;
  contentHash?: string;
  previousHash?: string;
  diffSummary?: string;
  humanReviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentValidationRun {
  id: string;
  validationId: string;
  executionId: string;
  organizationId: string;
  checkName: "lint" | "type-check" | "tests" | "build";
  command: string;
  status: StoredAgentValidationStatus;
  exitCode?: number;
  output: string;
  startedAt: string;
  completedAt: string;
}

export interface StoredAgentError {
  id: string;
  errorId: string;
  executionId: string;
  organizationId: string;
  validationId?: string;
  source: string;
  filePath?: string;
  line?: number;
  reason: string;
  fixAttempt?: string;
  status: StoredAgentErrorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentRepairAttempt {
  id: string;
  repairId: string;
  executionId: string;
  organizationId: string;
  errorId?: string;
  cycle: number;
  strategy: string;
  status: StoredAgentRepairStatus;
  notes: string;
  createdAt: string;
}

export interface StoredAgentCommit {
  id: string;
  commitId: string;
  executionId: string;
  organizationId: string;
  sha?: string;
  message: string;
  files: string[];
  status: "created" | "skipped" | "failed";
  createdAt: string;
}

export interface StoredAgentActivityLog {
  id: string;
  activityId: string;
  executionId: string;
  organizationId: string;
  actorId: string;
  step: string;
  status: StoredAgentExecutionStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type StoredAgentTemplateStatus = "draft" | "pending_review" | "published" | "unpublished" | "archived";
export type StoredAgentTemplateReleaseStatus = "draft" | "approved" | "rejected" | "released" | "rolled_back";
export type StoredAgentTemplateQualityStatus = "passed" | "failed" | "pending";

export interface StoredAgentTemplate {
  id: string;
  templateId: string;
  organizationId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  previewImage?: string;
  stack: string[];
  requiredInputs: Array<Record<string, unknown>>;
  optionalInputs: Array<Record<string, unknown>>;
  includedScreens: string[];
  includedApis: string[];
  databaseModels: string[];
  designTokens: string[];
  securityRules: string[];
  validationRules: string[];
  status: StoredAgentTemplateStatus;
  version: string;
  createdBy: string;
  approvedBy?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentTemplateVersion {
  id: string;
  versionId: string;
  templateId: string;
  organizationId: string;
  version: string;
  changelog: string;
  snapshot: Record<string, unknown>;
  createdBy: string;
  approvedBy?: string;
  releaseStatus: StoredAgentTemplateReleaseStatus;
  createdAt: string;
}

export interface StoredAgentTemplateInput {
  id: string;
  inputId: string;
  templateId: string;
  organizationId: string;
  key: string;
  label: string;
  inputType: string;
  required: boolean;
  validation?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentTemplateFile {
  id: string;
  fileId: string;
  templateId: string;
  organizationId: string;
  path: string;
  module: string;
  operation: string;
  content?: string;
  createdAt: string;
}

export interface StoredAgentTemplateQualityCheck {
  id: string;
  checkId: string;
  templateId: string;
  organizationId: string;
  checkName: string;
  status: StoredAgentTemplateQualityStatus;
  message: string;
  createdAt: string;
}

export interface StoredAgentTemplateUsageLog {
  id: string;
  usageId: string;
  templateId: string;
  organizationId: string;
  actorId: string;
  runId?: string;
  inputValues: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export interface StoredAgentTemplateReview {
  id: string;
  reviewId: string;
  templateId: string;
  organizationId: string;
  reviewerId: string;
  decision: string;
  reason?: string;
  createdAt: string;
}

export type StoredVFormixAgentStatus =
  | "pending"
  | "mapping"
  | "validating"
  | "template_matched"
  | "blueprint_generated"
  | "approval_required"
  | "coding_started"
  | "completed"
  | "failed"
  | "blocked";

export interface StoredVFormixAgentConfig {
  id: string;
  configId: string;
  organizationId: string;
  formId: string;
  enabled: boolean;
  defaultTemplateId?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  status: "draft" | "active" | "paused";
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVFormixAgentFieldMapping {
  id: string;
  mappingId: string;
  organizationId: string;
  formId: string;
  formFieldKey: string;
  agentFieldPath: string;
  required: boolean;
  normalizer: "text" | "slug" | "list" | "date" | "priority";
  fallbackValue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVFormixAgentTrigger {
  id: string;
  triggerId: string;
  organizationId: string;
  formId: string;
  triggerType: "submission" | "manual" | "approval" | "template_selection";
  enabled: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVFormixAgentSubmissionLink {
  id: string;
  linkId: string;
  organizationId: string;
  formId: string;
  submissionId: string;
  rawSubmission: Record<string, unknown>;
  cleanedAgentInput?: Record<string, unknown>;
  templateId?: string;
  templateMatchReason?: string;
  runId?: string;
  executionId?: string;
  status: StoredVFormixAgentStatus;
  errorMessage?: string;
  missingFields: string[];
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVFormixAgentMappingError {
  id: string;
  errorId: string;
  organizationId: string;
  formId: string;
  submissionId: string;
  fieldKey: string;
  reason: string;
  nextAction: string;
  status: "open" | "resolved";
  createdAt: string;
}

export interface StoredVFormixAgentWebhookLog {
  id: string;
  webhookId: string;
  organizationId?: string;
  formId?: string;
  submissionId?: string;
  eventType: string;
  status: "accepted" | "rejected" | "failed";
  reason?: string;
  createdAt: string;
}

export type StoredAgentLiveEventType =
  | "agent.run.started"
  | "agent.run.updated"
  | "agent.task.started"
  | "agent.task.progress"
  | "agent.task.completed"
  | "agent.task.failed"
  | "agent.validation.started"
  | "agent.validation.completed"
  | "agent.validation.failed"
  | "agent.repair.started"
  | "agent.repair.completed"
  | "agent.approval.required"
  | "agent.run.completed"
  | "agent.run.failed"
  | "agent.run.blocked";

export interface StoredAgentLiveSession {
  id: string;
  sessionId: string;
  runId: string;
  organizationId: string;
  actorId: string;
  status: "open" | "closed";
  lastEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentLiveEvent {
  id: string;
  eventId: string;
  runId: string;
  organizationId: string;
  eventType: StoredAgentLiveEventType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentWorkspaceInstruction {
  id: string;
  instructionId: string;
  runId: string;
  organizationId: string;
  actorId: string;
  instructionType: "extra" | "constraint" | "design" | "backend" | "security" | "deadline_priority";
  content: string;
  applied: boolean;
  createdAt: string;
}

export interface StoredAgentWorkspaceControl {
  id: string;
  controlId: string;
  runId: string;
  organizationId: string;
  actorId: string;
  action: "pause" | "resume" | "stop" | "approve-step" | "reject-step" | "regenerate" | "manual-review";
  reason?: string;
  status: "accepted" | "rejected";
  createdAt: string;
}

export interface StoredAgentWorkspaceEvidence {
  id: string;
  evidenceId: string;
  runId: string;
  organizationId: string;
  evidenceType: "files" | "diff" | "validation" | "error" | "repair" | "build" | "final";
  title: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentStepApproval {
  id: string;
  approvalId: string;
  runId: string;
  organizationId: string;
  stepId: string;
  actorId: string;
  decision: "approved" | "rejected";
  reason?: string;
  createdAt: string;
}

export type StoredAgentTeamStatus = "created" | "assigned" | "in_progress" | "review_required" | "approved" | "handed_off" | "completed" | "blocked" | "failed";

export interface StoredAgentRole {
  id: string;
  roleId: string;
  organizationId: string;
  name: string;
  slug: string;
  responsibilities: string[];
  requiredReview: boolean;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentRoleConfig {
  id: string;
  configId: string;
  roleId: string;
  organizationId: string;
  modelProvider: string;
  systemPrompt: string;
  tools: string[];
  guardrails: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentAssignment {
  id: string;
  assignmentId: string;
  runId: string;
  organizationId: string;
  roleId: string;
  ownerId: string;
  status: StoredAgentTeamStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  scope: string;
  outputVersion: number;
  output?: Record<string, unknown>;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentHandoff {
  id: string;
  handoffId: string;
  runId: string;
  organizationId: string;
  fromRoleId: string;
  toRoleId: string;
  summary: string;
  evidence: Record<string, unknown>;
  nextAction: string;
  status: StoredAgentTeamStatus;
  createdAt: string;
}

export interface StoredAgentComment {
  id: string;
  commentId: string;
  runId: string;
  organizationId: string;
  roleId: string;
  authorId: string;
  message: string;
  visibility: "team" | "admin";
  createdAt: string;
}

export interface StoredAgentConflict {
  id: string;
  conflictId: string;
  runId: string;
  organizationId: string;
  raisedByRoleId: string;
  againstRoleId?: string;
  reason: string;
  resolution?: string;
  status: "open" | "resolved";
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentDecisionLog {
  id: string;
  decisionId: string;
  runId: string;
  organizationId: string;
  actorId: string;
  decision: string;
  rationale: string;
  createdAt: string;
}

export interface StoredAgentReview {
  id: string;
  reviewId: string;
  runId: string;
  organizationId: string;
  roleId: string;
  reviewerId: string;
  decision: "approved" | "rejected" | "changes_requested";
  findings: string[];
  nextAction: string;
  createdAt: string;
}

export interface StoredAgentFinalReview {
  id: string;
  finalReviewId: string;
  runId: string;
  organizationId: string;
  reviewerId: string;
  decision: "approved" | "rejected";
  requiredReviews: string[];
  missingReviews: string[];
  summary: string;
  nextAction: string;
  createdAt: string;
}

export type StoredAgentDeploymentStatus = "draft" | "preparing" | "ready" | "deploying" | "verifying" | "live" | "failed" | "rollback_required" | "rolled_back";
export type StoredAgentDeploymentTargetType = "AWS_EC2" | "S3_CLOUDFRONT" | "DOCKER_SERVER" | "VERCEL" | "VMNEXUS_CLOUD";
export type StoredAgentDeploymentCheckStatus = "passed" | "failed" | "blocked";

export interface StoredAgentDeployment {
  id: string;
  deploymentId: string;
  runId: string;
  organizationId: string;
  ownerId: string;
  status: StoredAgentDeploymentStatus;
  targetId: string;
  releaseId: string;
  environment: "staging" | "production";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  confirmedProduction: boolean;
  errorMessage?: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentDeploymentTarget {
  id: string;
  targetId: string;
  deploymentId: string;
  organizationId: string;
  targetType: StoredAgentDeploymentTargetType;
  name: string;
  config: Record<string, unknown>;
  requiredEnvVars: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentDeploymentCheck {
  id: string;
  checkId: string;
  deploymentId: string;
  organizationId: string;
  checkName: string;
  status: StoredAgentDeploymentCheckStatus;
  reason?: string;
  evidence: Record<string, unknown>;
  nextAction: string;
  createdAt: string;
}

export interface StoredAgentDeploymentLog {
  id: string;
  logId: string;
  deploymentId: string;
  organizationId: string;
  level: "info" | "warning" | "error";
  message: string;
  evidence?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentDeploymentRelease {
  id: string;
  releaseId: string;
  deploymentId: string;
  organizationId: string;
  version: string;
  previousReleaseId?: string;
  artifactVersion: string;
  migrationStatus: "pending" | "applied" | "failed";
  buildStatus: "pending" | "passed" | "failed";
  rollbackMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentDeploymentRollback {
  id: string;
  rollbackId: string;
  deploymentId: string;
  organizationId: string;
  fromReleaseId: string;
  toReleaseId?: string;
  status: "requested" | "completed" | "failed";
  reason: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentDeploymentHealthCheck {
  id: string;
  healthCheckId: string;
  deploymentId: string;
  organizationId: string;
  url: string;
  status: "healthy" | "unhealthy";
  statusCode?: number;
  responseTimeMs?: number;
  reason?: string;
  createdAt: string;
}

export type StoredAgentMemoryStatus = "pending_review" | "approved" | "rejected" | "archived";
export type StoredAgentMemoryTrust = "trusted" | "untrusted";
export type StoredAgentKnowledgeType = "project_pattern" | "architecture" | "common_error" | "verified_fix" | "deployment_lesson" | "security_rule" | "design_rule";

export interface StoredAgentMemoryEntry {
  id: string;
  memoryId: string;
  organizationId: string;
  title: string;
  memoryType: "project" | "user_preference" | "product" | "error_fix" | "template_usage" | "deployment" | "approval";
  content: string;
  summary: string;
  tags: string[];
  confidenceScore: number;
  status: StoredAgentMemoryStatus;
  trustLevel: StoredAgentMemoryTrust;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  retentionUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentMemorySource {
  id: string;
  sourceId: string;
  memoryId: string;
  organizationId: string;
  sourceType: "project" | "error" | "fix" | "template" | "deployment" | "approval" | "manual";
  sourceRef: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredAgentMemoryReview {
  id: string;
  reviewId: string;
  memoryId: string;
  organizationId: string;
  reviewerId: string;
  decision: "approved" | "rejected" | "archived";
  reason?: string;
  createdAt: string;
}

export interface StoredAgentKnowledgeEntry {
  id: string;
  entryId: string;
  organizationId: string;
  memoryId?: string;
  title: string;
  knowledgeType: StoredAgentKnowledgeType;
  content: string;
  confidenceScore: number;
  trusted: boolean;
  status: "active" | "archived";
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredAgentKnowledgeTag {
  id: string;
  tagId: string;
  entryId: string;
  organizationId: string;
  tag: string;
  createdAt: string;
}

export interface StoredAgentKnowledgeRetrievalLog {
  id: string;
  retrievalId: string;
  organizationId: string;
  actorId: string;
  query: string;
  selectedEntryIds: string[];
  rationale: string;
  createdAt: string;
}

export interface StoredAgentErrorFixPattern {
  id: string;
  patternId: string;
  organizationId: string;
  memoryId?: string;
  errorSignature: string;
  fixSummary: string;
  rejected: boolean;
  confidenceScore: number;
  createdAt: string;
}

export interface StoredAgentArchitecturePattern {
  id: string;
  patternId: string;
  organizationId: string;
  memoryId?: string;
  architectureName: string;
  applicability: string;
  securityNotes: string[];
  confidenceScore: number;
  createdAt: string;
}

export type StoredBuilderProjectStatus =
  | "draft"
  | "requirements_submitted"
  | "blueprint_ready"
  | "blueprint_approved"
  | "blueprint_rejected"
  | "coding_started"
  | "change_requested"
  | "delivered"
  | "blocked"
  | "failed";

export type StoredBuilderBlueprintStatus = "generated" | "approved" | "rejected" | "superseded";
export type StoredBuilderOutputStatus = "pending" | "in_progress" | "ready" | "failed";
export type StoredBuilderChangeRequestStatus = "requested" | "accepted" | "in_progress" | "completed" | "rejected";

export interface StoredBuilderProject {
  id: string;
  projectId: string;
  organizationId: string;
  customerId: string;
  ownerId: string;
  name: string;
  description: string;
  templateId?: string;
  agentRunId: string;
  executionId?: string;
  status: StoredBuilderProjectStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBuilderProjectRequirement {
  id: string;
  requirementId: string;
  projectId: string;
  organizationId: string;
  customerId: string;
  rawInput: Record<string, unknown>;
  normalizedInput: Record<string, unknown>;
  version: number;
  status: "submitted" | "accepted" | "blocked";
  missingFields: string[];
  createdAt: string;
}

export interface StoredBuilderProjectBlueprint {
  id: string;
  blueprintId: string;
  projectId: string;
  organizationId: string;
  customerId: string;
  agentRunId: string;
  version: number;
  status: StoredBuilderBlueprintStatus;
  content: Record<string, unknown>;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBuilderProjectOutput {
  id: string;
  outputId: string;
  projectId: string;
  organizationId: string;
  customerId: string;
  agentRunId: string;
  executionId?: string;
  outputType: string;
  title: string;
  content: string;
  status: StoredBuilderOutputStatus;
  version: number;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBuilderProjectChangeRequest {
  id: string;
  changeRequestId: string;
  projectId: string;
  organizationId: string;
  customerId: string;
  requestedById: string;
  summary: string;
  details: string;
  targetVersion: number;
  status: StoredBuilderChangeRequestStatus;
  agentTaskId?: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBuilderProjectActivityLog {
  id: string;
  activityId: string;
  projectId: string;
  organizationId: string;
  actorId: string;
  action: string;
  status: StoredBuilderProjectStatus | StoredBuilderChangeRequestStatus | StoredBuilderBlueprintStatus;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type StoredFactoryProjectStatus =
  | "intake"
  | "questions_required"
  | "blueprint_ready"
  | "blueprint_approved"
  | "design_ready"
  | "design_approved"
  | "build_ready"
  | "building"
  | "paused"
  | "qa_ready"
  | "release_ready"
  | "released"
  | "blocked"
  | "failed";

export interface StoredFactoryProject {
  id: string;
  projectId: string;
  organizationId: string;
  ownerId: string;
  name: string;
  productType: string;
  targetPlatform: string;
  businessGoal: string;
  status: StoredFactoryProjectStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  complexityLevel: "lean" | "standard" | "advanced" | "enterprise";
  deploymentTarget: string;
  recommendedPlan: string;
  requirementQualityScore: number;
  complexityScore: number;
  buildSize: "small" | "medium" | "large" | "enterprise";
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryIntakeAnswer {
  id: string;
  answerId: string;
  projectId: string;
  organizationId: string;
  userRoles: string[];
  coreFeatures: string[];
  integrations: string[];
  budgetLevel: string;
  rawInput: Record<string, unknown>;
  normalizedInput: Record<string, unknown>;
  missingFields: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryRequirementQuestion {
  id: string;
  questionId: string;
  projectId: string;
  organizationId: string;
  question: string;
  fieldKey: string;
  reason: string;
  status: "open" | "answered";
  answer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryBlueprint {
  id: string;
  blueprintId: string;
  projectId: string;
  organizationId: string;
  version: number;
  status: "generated" | "approved" | "rejected";
  prd: string;
  featureList: string[];
  userRoles: string[];
  userJourneys: string[];
  uxFlow: string[];
  pageMap: string[];
  apiMap: string[];
  databaseSchema: string[];
  architecturePlan: string[];
  securityPlan: string[];
  testingPlan: string[];
  deploymentPlan: string[];
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryDesignSystem {
  id: string;
  designId: string;
  projectId: string;
  organizationId: string;
  version: number;
  status: "generated" | "approved" | "rejected";
  designSystem: string[];
  layoutDirection: string;
  componentMap: string[];
  responsiveStrategy: string[];
  accessibilityChecklist: string[];
  themeTokens: Record<string, string>;
  uiQualityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryTaskGraph {
  id: string;
  graphId: string;
  projectId: string;
  organizationId: string;
  status: "planned" | "running" | "paused" | "completed" | "blocked";
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryTask {
  id: string;
  taskId: string;
  graphId: string;
  projectId: string;
  organizationId: string;
  module: string;
  title: string;
  status: "pending" | "running" | "completed" | "blocked" | "failed";
  ownerAgent: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryGeneratedFile {
  id: string;
  fileId: string;
  projectId: string;
  organizationId: string;
  taskId: string;
  path: string;
  fileType: string;
  status: "proposed" | "approved" | "rejected";
  checksum: string;
  diffRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryValidationRun {
  id: string;
  validationId: string;
  projectId: string;
  organizationId: string;
  validationType: string;
  status: "pending" | "passed" | "failed";
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryError {
  id: string;
  errorId: string;
  projectId: string;
  organizationId: string;
  source: string;
  reason: string;
  line?: number;
  status: "open" | "fixed" | "accepted";
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryRepairAttempt {
  id: string;
  repairId: string;
  projectId: string;
  organizationId: string;
  errorId: string;
  summary: string;
  status: "planned" | "applied" | "failed";
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryRelease {
  id: string;
  releaseId: string;
  projectId: string;
  organizationId: string;
  version: string;
  status: "draft" | "ready" | "approved" | "deployed";
  changelog: string[];
  releaseNotes: string;
  deploymentChecklist: string[];
  rollbackPlan: string[];
  finalReport: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryMemoryEntry {
  id: string;
  memoryId: string;
  projectId: string;
  organizationId: string;
  memoryType: "architecture" | "failure" | "fix" | "preference" | "design" | "rejection";
  summary: string;
  sourceId: string;
  trusted: boolean;
  sensitive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFactoryActivityLog {
  id: string;
  activityId: string;
  projectId: string;
  organizationId: string;
  actorId: string;
  action: string;
  status: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredFactoryAuditLog {
  id: string;
  auditId: string;
  projectId: string;
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type StoredBuilderBillingPlanTier = "free_trial" | "starter" | "pro" | "business" | "enterprise" | "custom";
export type StoredBuilderBillingCycle = "MONTHLY" | "YEARLY";
export type StoredCustomerSubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type StoredCustomerInvoiceStatus = "draft" | "issued" | "paid" | "failed" | "void";
export type StoredCustomerPaymentStatus = "created" | "paid" | "failed" | "refunded";
export type StoredCustomerPaymentAttemptStatus = "pending" | "succeeded" | "failed" | "retry_scheduled";
export type StoredUsageEventType = "agent_run" | "template_use" | "build_minute" | "ai_credit" | "storage_mb" | "deployment" | "team_member" | "regeneration";
export type StoredCreditTransactionType = "grant" | "deduct" | "refund" | "topup" | "adjustment";

export interface StoredBillingPlan {
  id: string;
  planId: string;
  organizationId?: string;
  tier: StoredBuilderBillingPlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: "INR";
  limits: Record<string, number>;
  creditsIncluded: number;
  features: string[];
  status: "active" | "archived";
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPlanFeatureFlag {
  id: string;
  flagId: string;
  organizationId?: string;
  planId: string;
  key: string;
  enabled: boolean;
  description: string;
  ownerId: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPlanUsagePolicy {
  id: string;
  policyId: string;
  organizationId?: string;
  planId: string;
  metric: StoredUsageEventType;
  creditCost: number;
  enabled: boolean;
  ownerId: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerSubscription {
  id: string;
  subscriptionId: string;
  organizationId: string;
  customerId: string;
  planId: string;
  billingCycle: StoredBuilderBillingCycle;
  status: StoredCustomerSubscriptionStatus;
  razorpaySubscriptionId?: string;
  providerCheckoutId?: string;
  gracePeriodEndsAt?: string;
  retryCount?: number;
  lastPaymentFailureReason?: string;
  pendingPlanId?: string;
  pendingBillingCycle?: StoredBuilderBillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewalDate: string;
  cancelAtPeriodEnd: boolean;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerInvoice {
  id: string;
  invoiceId: string;
  organizationId: string;
  customerId: string;
  subscriptionId?: string;
  paymentId?: string;
  number: string;
  gstin?: string;
  amount: number;
  subtotal?: number;
  gstRatePercent?: number;
  gstAmount?: number;
  currency: "INR";
  status: StoredCustomerInvoiceStatus;
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
  pdfContent?: string;
  lineItems: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerPayment {
  id: string;
  paymentId: string;
  organizationId: string;
  customerId: string;
  subscriptionId?: string;
  invoiceId?: string;
  provider: "razorpay" | "local";
  providerPaymentId?: string;
  providerOrderId?: string;
  providerSubscriptionId?: string;
  idempotencyKey?: string;
  amount: number;
  currency: "INR";
  status: StoredCustomerPaymentStatus;
  failureReason?: string;
  retryCount?: number;
  nextRetryAt?: string;
  gracePeriodEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerPaymentAttempt {
  id: string;
  attemptId: string;
  organizationId: string;
  customerId: string;
  subscriptionId?: string;
  invoiceId?: string;
  paymentId?: string;
  provider: "razorpay" | "local";
  providerPaymentId?: string;
  providerOrderId?: string;
  idempotencyKey: string;
  amount: number;
  currency: "INR";
  status: StoredCustomerPaymentAttemptStatus;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerUsageLimit {
  id: string;
  limitId: string;
  organizationId: string;
  customerId: string;
  planId: string;
  metric: StoredUsageEventType;
  limitValue: number;
  usedValue: number;
  periodStart: string;
  periodEnd: string;
  adminOverride: boolean;
  overrideReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomerUsageEvent {
  id: string;
  eventId: string;
  organizationId: string;
  customerId: string;
  workspaceId?: string;
  userId?: string;
  subscriptionId?: string;
  metric: StoredUsageEventType;
  action?: string;
  quantity: number;
  unit?: string;
  planId?: string;
  creditsUsed?: number;
  source: string;
  sourceId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  status: "accepted" | "rejected" | "refunded";
  reason?: string;
  createdAt: string;
}

export type StoredProviderHealthStatus =
  | "healthy"
  | "degraded"
  | "not_configured"
  | "missing_secret"
  | "invalid_credentials"
  | "rate_limited"
  | "unavailable"
  | "unknown";

export interface StoredProviderHealthCheck {
  id: string;
  checkId: string;
  provider: string;
  status: StoredProviderHealthStatus;
  environment: string;
  configured: boolean;
  missingParameterStorePaths: string[];
  message: string;
  checkedBy: string;
  createdAt: string;
}

export interface StoredCustomerCreditWallet {
  id: string;
  walletId: string;
  organizationId: string;
  customerId: string;
  balance: number;
  reserved: number;
  lifetimeCredits: number;
  lifetimeDebits: number;
  updatedAt: string;
  createdAt: string;
}

export interface StoredCustomerCreditTransaction {
  id: string;
  transactionId: string;
  walletId: string;
  organizationId: string;
  customerId: string;
  type: StoredCreditTransactionType;
  amount: number;
  balanceAfter: number;
  source: string;
  sourceId?: string;
  reason: string;
  createdAt: string;
}

export interface StoredRazorpayWebhookEvent {
  id: string;
  webhookEventId: string;
  organizationId?: string;
  eventType: string;
  providerEventId: string;
  signatureVerified: boolean;
  processed: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type StoredEnterpriseStatus = "active" | "pending" | "disabled" | "passed" | "failed" | "open" | "completed" | "rejected";

export interface StoredEnterpriseWorkspace {
  id: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  domain?: string;
  ssoReady: boolean;
  retentionDays: number;
  ownerId: string;
  status: StoredEnterpriseStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWorkspaceRole {
  id: string;
  roleId: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  permissions: string[];
  createdAt: string;
}

export interface StoredWorkspaceMember {
  id: string;
  memberId: string;
  workspaceId: string;
  organizationId: string;
  userId: string;
  email: string;
  roleId: string;
  status: StoredEnterpriseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWorkspaceInvite {
  id: string;
  inviteId: string;
  workspaceId: string;
  organizationId: string;
  email: string;
  roleId: string;
  invitedById: string;
  status: StoredEnterpriseStatus;
  expiresAt: string;
  createdAt: string;
}

export interface StoredWorkspaceAuditLog {
  id: string;
  auditId: string;
  workspaceId: string;
  organizationId: string;
  actorId: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredSecurityEvent {
  id: string;
  eventId: string;
  organizationId: string;
  workspaceId?: string;
  actorId?: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  message: string;
  evidence: Record<string, unknown>;
  status: StoredEnterpriseStatus;
  riskScore?: number;
  requestId?: string;
  createdAt: string;
}

export interface StoredSecurityRiskScore {
  id: string;
  riskId: string;
  organizationId: string;
  workspaceId?: string;
  subjectType: "session" | "api_key" | "workspace" | "billing" | "provider" | "prompt" | "secret" | "audit";
  subjectId: string;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  signals: string[];
  nextAction: string;
  createdAt: string;
}

export interface StoredReliabilityCheck {
  id: string;
  checkId: string;
  organizationId: string;
  checkName: string;
  status: "passed" | "failed";
  evidence: Record<string, unknown>;
  nextAction: string;
  createdAt: string;
}

export interface StoredComplianceRecord {
  id: string;
  recordId: string;
  organizationId: string;
  recordType: "privacy" | "terms" | "retention" | "consent" | "billing" | "export" | "delete";
  subjectId?: string;
  status: StoredEnterpriseStatus;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredDataExportRequest {
  id: string;
  requestId: string;
  organizationId: string;
  requestedById: string;
  status: StoredEnterpriseStatus;
  exportScope: string[];
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDataDeleteRequest {
  id: string;
  requestId: string;
  organizationId: string;
  requestedById: string;
  status: StoredEnterpriseStatus;
  reason: string;
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAuditExport {
  id: string;
  exportId: string;
  organizationId: string;
  requestedById: string;
  format: "csv" | "json";
  filters: Record<string, unknown>;
  status: StoredEnterpriseStatus;
  recordCount: number;
  content: string;
  createdAt: string;
}

export interface StoredLaunchReadinessCheck {
  id: string;
  checkId: string;
  organizationId: string;
  category: "security" | "reliability" | "billing" | "deployment" | "compliance" | "support";
  status: "passed" | "failed";
  evidence: Record<string, unknown>;
  nextAction: string;
  createdAt: string;
}

export type StoredOperationsIncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type StoredOperationsIncidentStatus = "open" | "investigating" | "mitigated" | "resolved" | "postmortem";
export type StoredOperationsCommandAction =
  | "pause_deployments"
  | "pause_agent_generation"
  | "emergency_stop"
  | "resume_services"
  | "maintenance_mode"
  | "scheduled_maintenance"
  | "restart_agent"
  | "drain_agent"
  | "enable_agent"
  | "disable_agent";

export interface StoredOperationsIncident {
  id: string;
  incidentId: string;
  organizationId: string;
  title: string;
  description: string;
  severity: StoredOperationsIncidentSeverity;
  status: StoredOperationsIncidentStatus;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  impactedProducts: string[];
  timeline: Array<Record<string, unknown>>;
  rootCause?: string;
  resolution?: string;
  postmortem?: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredOperationsAuditLog {
  id: string;
  auditId: string;
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  command?: StoredOperationsCommandAction;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredOperationsHealthCheck {
  id: string;
  checkId: string;
  organizationId: string;
  service: string;
  region: string;
  status: "healthy" | "degraded" | "down";
  latencyMs?: number;
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredOperationsAgentMetric {
  id: string;
  metricId: string;
  organizationId: string;
  agentId: string;
  agentName: string;
  version: string;
  status: "enabled" | "disabled" | "draining" | "restarting";
  health: "healthy" | "degraded" | "down";
  activeRuns: number;
  queuedTasks: number;
  errorRate: number;
  workloadScore: number;
  region: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredOperationsProductMetric {
  id: string;
  metricId: string;
  organizationId: string;
  product: "VidyaLuma" | "VMetron" | "VaanMeet" | "VFormix" | "VaanForge AI" | "Future KRAVIA";
  activeUsers: number;
  activeWorkspaces: number;
  apiHealth: "healthy" | "degraded" | "down";
  queueHealth: "healthy" | "degraded" | "down";
  errorRate: number;
  buildStatus: string;
  deploymentStatus: string;
  region: string;
  createdAt: string;
}

export interface StoredOperationsBusinessMetric {
  id: string;
  metricId: string;
  organizationId: string;
  revenue: number;
  subscriptions: number;
  usageEvents: number;
  creditConsumption: number;
  aiUsage: number;
  customerGrowth: number;
  productAdoption: Record<string, number>;
  churn: number;
  mrr: number;
  arr: number;
  createdAt: string;
}

export interface StoredMaintenanceWindow {
  id: string;
  windowId: string;
  organizationId: string;
  title: string;
  ownerId: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  startsAt: string;
  endsAt: string;
  affectedServices: string[];
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredEmergencyAction {
  id: string;
  actionId: string;
  organizationId: string;
  actorId: string;
  action: StoredOperationsCommandAction;
  reason: string;
  confirmed: boolean;
  status: "accepted" | "rejected" | "completed";
  evidence: Record<string, unknown>;
  createdAt: string;
}

export type StoredDeveloperAppStatus = "active" | "disabled";
export type StoredApiKeyStatus = "active" | "revoked" | "rotated";
export type StoredPluginStatus = "draft" | "review" | "published" | "disabled";
export type StoredWebhookStatus = "active" | "paused" | "failed";

export interface StoredDeveloperAccount {
  id: string;
  developerId: string;
  organizationId: string;
  userId: string;
  displayName: string;
  status: "active" | "suspended";
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDeveloperApp {
  id: string;
  appId: string;
  developerId: string;
  organizationId: string;
  name: string;
  description: string;
  status: StoredDeveloperAppStatus;
  redirectUris: string[];
  scopes: string[];
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredApiKey {
  id: string;
  keyId: string;
  developerId: string;
  appId?: string;
  organizationId: string;
  name: string;
  keyHash: string;
  prefix: string;
  scopes: string[];
  status: StoredApiKeyStatus;
  lastUsedAt?: string;
  expiresAt?: string;
  rotatedFromKeyId?: string;
  ipAllowlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredApiKeySecuritySetting {
  id: string;
  settingId: string;
  keyId: string;
  organizationId: string;
  scopes: string[];
  ipAllowlist: string[];
  replayProtection: boolean;
  perMinuteLimit: number;
  status: "active" | "restricted" | "revoked";
  updatedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredOAuthClient {
  id: string;
  clientId: string;
  appId: string;
  developerId: string;
  organizationId: string;
  clientSecretHash: string;
  redirectUris: string[];
  scopes: string[];
  grantTypes: string[];
  status: StoredDeveloperAppStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSdkVersion {
  id: string;
  sdkId: string;
  organizationId: string;
  language: "typescript" | "flutter" | "kotlin" | "swift" | "python" | "java" | "go";
  packageName: string;
  version: string;
  apiSpecVersion: string;
  downloadUrl: string;
  checksum: string;
  status: "current" | "deprecated";
  generatedFromSpec: string;
  createdAt: string;
}

export interface StoredPluginRegistryEntry {
  id: string;
  pluginId: string;
  organizationId: string;
  developerId: string;
  name: string;
  pluginType: "agent" | "workflow" | "template" | "validation" | "deployment" | "event_hook";
  version: string;
  manifest: Record<string, unknown>;
  permissions: string[];
  status: StoredPluginStatus;
  reviewNotes?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredWebhookEndpoint {
  id: string;
  webhookId: string;
  developerId: string;
  appId?: string;
  organizationId: string;
  url: string;
  events: string[];
  signingSecretHash: string;
  status: StoredWebhookStatus;
  retryPolicy: Record<string, unknown>;
  lastDeliveryAt?: string;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredApiUsageLog {
  id: string;
  usageId: string;
  organizationId: string;
  developerId?: string;
  appId?: string;
  keyId?: string;
  apiVersion: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  requestId: string;
  responseStandardized: boolean;
  createdAt: string;
}

export interface StoredApiRateLimit {
  id: string;
  limitId: string;
  organizationId: string;
  developerId?: string;
  keyId?: string;
  windowKey: string;
  limit: number;
  used: number;
  resetAt: string;
  createdAt: string;
  updatedAt: string;
}

export type StoredMarketplaceAppType = "app" | "plugin" | "template" | "agent_extension" | "workflow_automation" | "integration";
export type StoredMarketplaceAppStatus = "draft" | "submitted" | "in_review" | "approved" | "published" | "rejected" | "suspended" | "archived";
export type StoredMarketplaceReviewType = "security" | "code_scan" | "permission" | "manual";
export type StoredMarketplaceReviewStatus = "pending" | "in_progress" | "approved" | "rejected" | "changes_requested";
export type StoredMarketplaceInstallStatus = "installed" | "update_available" | "uninstalled" | "rolled_back";
export type StoredMarketplacePayoutStatus = "pending" | "processing" | "paid" | "held";

export interface StoredMarketplacePublisher {
  id: string;
  publisherId: string;
  developerId: string;
  organizationId: string;
  displayName: string;
  profileUrl?: string;
  verified: boolean;
  status: "active" | "suspended";
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplaceApp {
  id: string;
  appId: string;
  publisherId: string;
  organizationId: string;
  name: string;
  slug: string;
  appType: StoredMarketplaceAppType;
  category: string;
  shortDescription: string;
  description: string;
  supportUrl?: string;
  requestedPermissions: string[];
  pricingModel: "free" | "paid" | "usage_based";
  status: StoredMarketplaceAppStatus;
  currentVersionId?: string;
  latestVersionNumber?: string;
  reviewRequired: boolean;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplaceAppVersion {
  id: string;
  versionId: string;
  appId: string;
  organizationId: string;
  versionNumber: string;
  changelog: string;
  manifest: Record<string, unknown>;
  packageChecksum: string;
  releaseNotes: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "published" | "rolled_back";
  immutable: boolean;
  submittedById: string;
  approvedById?: string;
  createdAt: string;
}

export interface StoredMarketplaceReview {
  id: string;
  reviewId: string;
  appId: string;
  versionId: string;
  organizationId: string;
  reviewType: StoredMarketplaceReviewType;
  status: StoredMarketplaceReviewStatus;
  reviewerId?: string;
  evidence: Record<string, unknown>;
  reason?: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplaceInstall {
  id: string;
  installId: string;
  appId: string;
  versionId: string;
  organizationId: string;
  workspaceId: string;
  installedById: string;
  consentedPermissions: string[];
  status: StoredMarketplaceInstallStatus;
  rollbackVersionId?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplacePermission {
  id: string;
  permissionId: string;
  appId: string;
  organizationId: string;
  key: string;
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  required: boolean;
  createdAt: string;
}

export interface StoredMarketplacePricing {
  id: string;
  pricingId: string;
  appId: string;
  organizationId: string;
  model: "free" | "paid" | "usage_based";
  currency: "INR" | "USD";
  amount: number;
  billingMetric?: string;
  revenueSharePercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplacePayout {
  id: string;
  payoutId: string;
  publisherId: string;
  organizationId: string;
  appId: string;
  amount: number;
  currency: "INR" | "USD";
  status: StoredMarketplacePayoutStatus;
  sourceInstallId?: string;
  dueDate: string;
  activityHistory: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplaceCategory {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface StoredMarketplaceRevenueEvent {
  id: string;
  revenueEventId: string;
  appId: string;
  publisherId: string;
  organizationId: string;
  sourceInstallId?: string;
  amount: number;
  currency: "INR" | "USD";
  status: "recorded" | "refunded";
  createdAt: string;
}

export interface StoredDocsCategory {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  description: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface StoredDocsArticle {
  id: string;
  docId: string;
  slug: string;
  title: string;
  categorySlug: string;
  summary: string;
  body: string;
  sourcePath?: string;
  status: "draft" | "published" | "archived";
  version: number;
  createdBy: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDocsVersion {
  id: string;
  versionId: string;
  docId: string;
  version: number;
  body: string;
  changelog: string;
  createdBy: string;
  createdAt: string;
}

export interface StoredDocsSearchIndex {
  id: string;
  docId: string;
  terms: string;
  updatedAt: string;
}

export interface StoredStatusService {
  id: string;
  serviceId: string;
  name: string;
  slug: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage" | "monitoring_setup_required";
  monitoringConnected: boolean;
  lastCheckedAt?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredStatusIncident {
  id: string;
  incidentId: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  serviceIds: string[];
  impact: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface StoredStatusIncidentUpdate {
  id: string;
  updateId: string;
  incidentId: string;
  status: StoredStatusIncident["status"];
  message: string;
  createdBy: string;
  createdAt: string;
}

export interface StoredStatusSubscriber {
  id: string;
  subscriberId: string;
  email: string;
  status: "active" | "unsubscribed";
  createdAt: string;
}

export interface StoredStatusHealthCheck {
  id: string;
  checkId: string;
  serviceId: string;
  status: StoredStatusService["status"];
  evidence: Record<string, unknown>;
  createdAt: string;
}

export interface StoredLegalPage {
  id: string;
  pageId: string;
  slug: string;
  title: string;
  body: string;
  version: number;
  effectiveDate: string;
  status: "draft" | "published" | "archived";
  createdBy: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredLegalPageVersion {
  id: string;
  versionId: string;
  pageId: string;
  version: number;
  body: string;
  effectiveDate: string;
  changelog: string;
  createdBy: string;
  createdAt: string;
}

export interface StoredLegalAcceptanceLog {
  id: string;
  acceptanceId: string;
  pageId: string;
  userId?: string;
  organizationId?: string;
  workspaceId?: string;
  policySlug?: string;
  version: number;
  ip?: string;
  userAgent?: string;
  acceptedAt: string;
}

export interface StoredPromptRiskEvent {
  id: string;
  eventId: string;
  organizationId: string;
  workspaceId?: string;
  sourceType: "project_prompt" | "uploaded_doc" | "marketplace_template" | "support_ticket" | "knowledge_base" | "memory_entry" | "agent_handoff";
  sourceId?: string;
  riskScore: number;
  severity: "low" | "medium" | "high" | "critical";
  detectedSignals: string[];
  status: "allowed" | "quarantined" | "review_required";
  sanitizedPreview: string;
  createdById: string;
  createdAt: string;
}

export interface StoredSecretScanEvent {
  id: string;
  eventId: string;
  organizationId: string;
  workspaceId?: string;
  sourceType: "generated_file" | "uploaded_file" | "documentation" | "memory_entry" | "agent_output" | "support_attachment";
  sourceId?: string;
  confidence: "low" | "medium" | "high";
  detectedTypes: string[];
  action: "allowed" | "redacted" | "blocked";
  redactedPreview: string;
  createdById: string;
  createdAt: string;
}

export interface StoredSecurityReport {
  id: string;
  reportId: string;
  organizationId: string;
  reportType: "security_posture" | "audit_summary" | "api_key_usage_risk" | "provider_readiness" | "tenant_isolation" | "billing_security";
  status: "readiness" | "generated";
  summary: string;
  evidence: Record<string, unknown>;
  generatedById: string;
  createdAt: string;
}

export interface StoredReleaseNote {
  id: string;
  releaseId: string;
  version: string;
  title: string;
  summary: string;
  status: "draft" | "release_candidate" | "approved" | "published" | "deployed" | "rolled_back" | "archived";
  changelog?: string;
  migrationNotes?: string;
  knownIssues?: string[];
  rollbackNotes?: string;
  deploymentChecklist?: string[];
  approvalHistory?: Array<Record<string, unknown>>;
  releasedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAlertRule {
  id: string;
  ruleId: string;
  organizationId: string;
  name: string;
  alertType: string;
  threshold: number;
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAlertEvent {
  id: string;
  alertId: string;
  ruleId: string;
  organizationId: string;
  status: "open" | "acknowledged" | "resolved";
  message: string;
  evidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAlertNotification {
  id: string;
  notificationId: string;
  alertId: string;
  organizationId: string;
  channel: "in_app" | "email" | "webhook";
  status: "queued" | "sent" | "failed";
  createdAt: string;
}

export interface StoredAlertAcknowledgement {
  id: string;
  acknowledgementId: string;
  alertId: string;
  organizationId: string;
  actorId: string;
  note?: string;
  createdAt: string;
}

export interface StoredCustomerSuccessNote {
  id: string;
  noteId: string;
  organizationId: string;
  accountId: string;
  actorId: string;
  note: string;
  createdAt: string;
}

export interface StoredCustomerSuccessTask {
  id: string;
  taskId: string;
  organizationId: string;
  accountId: string;
  ownerId: string;
  title: string;
  dueDate: string;
  status: "open" | "completed";
  createdAt: string;
}

export interface StoredFeedbackItem {
  id: string;
  feedbackId: string;
  organizationId?: string;
  workspaceId?: string;
  userId?: string;
  type: "bug" | "feature_request" | "ux_issue" | "billing_issue" | "documentation_issue" | "integration_request";
  title: string;
  description: string;
  status: "submitted" | "triaged" | "planned" | "in_progress" | "shipped" | "closed";
  votes: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFeedbackVote {
  id: string;
  voteId: string;
  feedbackId: string;
  organizationId?: string;
  userId?: string;
  createdAt: string;
}

export interface StoredReleaseVersion {
  id: string;
  versionId: string;
  releaseId: string;
  version: string;
  migrationNotes: string;
  knownIssues: string[];
  createdAt: string;
}

export interface StoredReleaseChangelogItem {
  id: string;
  itemId: string;
  releaseId: string;
  type: "added" | "changed" | "fixed" | "security" | "deprecated";
  description: string;
  createdAt: string;
}

export interface StoredEnterpriseLead {
  id: string;
  leadId: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  status: "new" | "qualified" | "contacted" | "closed";
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredEnterpriseDemoRequest {
  id: string;
  requestId: string;
  name: string;
  email: string;
  company?: string;
  preferredDate?: string;
  useCase: string;
  status: "new" | "scheduled" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface StoredEnterpriseSalesNote {
  id: string;
  noteId: string;
  leadId: string;
  authorId: string;
  note: string;
  createdAt: string;
}

export interface StoredEnterpriseSolutionPage {
  id: string;
  solutionId: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: "published" | "archived";
  updatedAt: string;
}

export interface StoredPartnerApplication {
  id: string;
  applicationId: string;
  applicantName: string;
  email: string;
  company?: string;
  partnerType: "agency" | "freelancer" | "consultant" | "system_integrator";
  message: string;
  status: "submitted" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface StoredPartnerReferral {
  id: string;
  referralId: string;
  partnerId: string;
  customerEmail: string;
  status: "submitted" | "converted" | "rejected";
  revenueEventId?: string;
  createdAt: string;
}

export interface StoredPartnerCommission {
  id: string;
  commissionId: string;
  partnerId: string;
  sourceRevenueEventId: string;
  amount: number;
  currency: "INR" | "USD";
  status: "pending" | "approved" | "paid" | "held";
  createdAt: string;
}

export interface StoredPartnerPayout {
  id: string;
  payoutId: string;
  partnerId: string;
  amount: number;
  currency: "INR" | "USD";
  status: "pending" | "processing" | "paid" | "held";
  createdAt: string;
  updatedAt: string;
}

export interface StoredPartnerResource {
  id: string;
  resourceId: string;
  slug: string;
  title: string;
  summary: string;
  status: "published" | "archived";
  updatedAt: string;
}

export interface StoredPartnerCertification {
  id: string;
  certificationId: string;
  partnerId: string;
  title: string;
  status: "not_started" | "in_progress" | "completed" | "expired";
  issuedAt?: string;
  expiresAt?: string;
}

export type StoredCloudComponentType =
  | "identity"
  | "gateway"
  | "service_registry"
  | "event_bus"
  | "storage"
  | "secrets"
  | "configuration"
  | "messaging"
  | "ai_runtime"
  | "build"
  | "deploy"
  | "monitoring"
  | "observability"
  | "billing"
  | "console";

export type StoredCloudStatus = "healthy" | "degraded" | "blocked" | "disabled";

export interface StoredCloudService {
  id: string;
  serviceId: string;
  organizationId: string;
  name: string;
  version: string;
  componentType: StoredCloudComponentType;
  health: StoredCloudStatus;
  dependencies: string[];
  region: string;
  environment: string;
  ownerId: string;
  endpoint: string;
  lastHeartbeatAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudEvent {
  id: string;
  eventId: string;
  organizationId: string;
  topic: string;
  producerServiceId: string;
  consumerServiceId?: string;
  status: "published" | "delivered" | "retrying" | "dead_lettered" | "replayed";
  payload: Record<string, unknown>;
  attempts: number;
  traceId: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudStorageObject {
  id: string;
  objectId: string;
  organizationId: string;
  workspaceId?: string;
  bucket: string;
  key: string;
  objectType: "object" | "image" | "video" | "artifact" | "upload";
  sizeBytes: number;
  contentType: string;
  encrypted: boolean;
  version: number;
  lifecyclePolicy: string;
  cdnUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudSecret {
  id: string;
  secretId: string;
  organizationId: string;
  name: string;
  category: "api_key" | "jwt_secret" | "oauth_secret" | "database" | "smtp" | "cloud";
  version: number;
  status: "active" | "rotating" | "revoked";
  rotationDueAt: string;
  lastRotatedAt?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudConfiguration {
  id: string;
  configId: string;
  organizationId: string;
  key: string;
  scope: "environment" | "feature_flag" | "tenant" | "runtime";
  value: Record<string, unknown>;
  status: "active" | "draft" | "disabled";
  environment: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudMessage {
  id: string;
  messageId: string;
  organizationId: string;
  channel: "email" | "sms" | "whatsapp" | "push" | "in_app" | "webhook";
  recipient: string;
  status: "queued" | "sent" | "failed" | "retrying";
  provider: string;
  traceId: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudJob {
  id: string;
  jobId: string;
  organizationId: string;
  jobType: "ai_run" | "build" | "deploy" | "health_check";
  status: "queued" | "running" | "completed" | "failed" | "blocked";
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  artifactId?: string;
  releaseId?: string;
  validationEvidence: Record<string, unknown>;
  nextAction: string;
  activityHistory: Array<{ at: string; status: string; message: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCloudMetric {
  id: string;
  metricId: string;
  organizationId: string;
  componentType: StoredCloudComponentType;
  metricName: string;
  value: number;
  unit: string;
  region: string;
  traceId?: string;
  createdAt: string;
}

export interface StoredCloudAuditLog {
  id: string;
  auditId: string;
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StoredSettings {
  organizationId: string;
  themeMode: "light" | "dark" | "system";
  billingEmail?: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  apiKeysConfigured: boolean;
  updatedAt: string;
}

export interface StoreState {
  users: StoredUser[];
  userProfiles: StoredUserProfile[];
  loginHistory: StoredLoginHistory[];
  passwordResetTokens: StoredPasswordResetToken[];
  organizations: StoredOrganization[];
  workspaces: StoredWorkspace[];
  entitlements: Array<ProductEntitlement & { organizationId: string }>;
  onboardingProgress: StoredOnboardingProgress[];
  productTourProgress: StoredProductTourProgress[];
  workspaceSetups: StoredWorkspaceSetup[];
  featureDiscoveryViews: StoredFeatureDiscoveryView[];
  commandUsage: StoredCommandUsage[];
  notifications: StoredNotification[];
  revenues: StoredRevenue[];
  expenses: StoredExpense[];
  reportExports: StoredReportExport[];
  projects: StoredProject[];
  tasks: StoredTask[];
  leads: StoredLead[];
  customers: StoredCustomer[];
  crmCompanies: StoredCrmCompany[];
  crmContacts: StoredCrmContact[];
  crmOpportunities: StoredCrmOpportunity[];
  crmTasks: StoredCrmTask[];
  customerHealthScores: StoredCustomerHealthScore[];
  subscriptionOperations: StoredSubscriptionOperation[];
  providerCostEvents: StoredProviderCostEvent[];
  infrastructureCostEvents: StoredInfrastructureCostEvent[];
  businessReports: StoredBusinessReport[];
  engineeringProjects: StoredEngineeringProject[];
  engineeringMetrics: StoredEngineeringMetric[];
  technicalDebt: StoredTechnicalDebt[];
  architectureReviews: StoredArchitectureReview[];
  architectureDecisions: StoredArchitectureDecision[];
  releasePipeline: StoredReleasePipeline[];
  environmentRegistry: StoredEnvironmentRegistry[];
  environmentHealth: StoredEnvironmentHealth[];
  migrationHistory: StoredMigrationHistory[];
  databaseMetrics: StoredDatabaseMetric[];
  engineeringReports: StoredEngineeringReport[];
  featureFlags: StoredFeatureFlag[];
  supportTickets: StoredSupportTicket[];
  ticketMessages: StoredTicketMessage[];
  supportAttachments: StoredSupportAttachment[];
  supportInternalNotes: StoredSupportInternalNote[];
  supportAnnouncements: StoredSupportAnnouncement[];
  knowledgeArticles: StoredKnowledgeArticle[];
  departments: StoredDepartment[];
  employees: StoredEmployee[];
  candidates: StoredCandidate[];
  interviews: StoredInterview[];
  offers: StoredOffer[];
  agreements: StoredAgreement[];
  complianceItems: StoredComplianceItem[];
  governmentRegistrations: StoredGovernmentRegistration[];
  creatorProfiles: StoredCreatorProfile[];
  campaigns: StoredCampaign[];
  partners: StoredPartner[];
  communications: StoredCommunication[];
  automationRules: StoredAutomationRule[];
  intelligenceSnapshots: StoredIntelligenceSnapshot[];
  vaanForgeRuns: StoredVaanForgeAgentRun[];
  vaanForgeOutputs: StoredVaanForgeOutput[];
  vaanForgeAuditLogs: StoredVaanForgeAuditLog[];
  agentExecutionRuns: StoredAgentExecutionRun[];
  agentTasks: StoredAgentTask[];
  agentFiles: StoredAgentFile[];
  agentValidationRuns: StoredAgentValidationRun[];
  agentErrors: StoredAgentError[];
  agentRepairAttempts: StoredAgentRepairAttempt[];
  agentCommits: StoredAgentCommit[];
  agentActivityLogs: StoredAgentActivityLog[];
  agentTemplates: StoredAgentTemplate[];
  agentTemplateVersions: StoredAgentTemplateVersion[];
  agentTemplateInputs: StoredAgentTemplateInput[];
  agentTemplateFiles: StoredAgentTemplateFile[];
  agentTemplateQualityChecks: StoredAgentTemplateQualityCheck[];
  agentTemplateUsageLogs: StoredAgentTemplateUsageLog[];
  agentTemplateReviews: StoredAgentTemplateReview[];
  vformixAgentConfigs: StoredVFormixAgentConfig[];
  vformixAgentFieldMappings: StoredVFormixAgentFieldMapping[];
  vformixAgentTriggers: StoredVFormixAgentTrigger[];
  vformixAgentSubmissionLinks: StoredVFormixAgentSubmissionLink[];
  vformixAgentMappingErrors: StoredVFormixAgentMappingError[];
  vformixAgentWebhookLogs: StoredVFormixAgentWebhookLog[];
  agentLiveSessions: StoredAgentLiveSession[];
  agentLiveEvents: StoredAgentLiveEvent[];
  agentWorkspaceInstructions: StoredAgentWorkspaceInstruction[];
  agentWorkspaceControls: StoredAgentWorkspaceControl[];
  agentWorkspaceEvidence: StoredAgentWorkspaceEvidence[];
  agentStepApprovals: StoredAgentStepApproval[];
  agentRoles: StoredAgentRole[];
  agentRoleConfigs: StoredAgentRoleConfig[];
  agentAssignments: StoredAgentAssignment[];
  agentHandoffs: StoredAgentHandoff[];
  agentComments: StoredAgentComment[];
  agentConflicts: StoredAgentConflict[];
  agentDecisionLogs: StoredAgentDecisionLog[];
  agentReviews: StoredAgentReview[];
  agentFinalReviews: StoredAgentFinalReview[];
  agentDeployments: StoredAgentDeployment[];
  agentDeploymentTargets: StoredAgentDeploymentTarget[];
  agentDeploymentChecks: StoredAgentDeploymentCheck[];
  agentDeploymentLogs: StoredAgentDeploymentLog[];
  agentDeploymentReleases: StoredAgentDeploymentRelease[];
  agentDeploymentRollbacks: StoredAgentDeploymentRollback[];
  agentDeploymentHealthChecks: StoredAgentDeploymentHealthCheck[];
  agentMemoryEntries: StoredAgentMemoryEntry[];
  agentMemorySources: StoredAgentMemorySource[];
  agentMemoryReviews: StoredAgentMemoryReview[];
  agentKnowledgeEntries: StoredAgentKnowledgeEntry[];
  agentKnowledgeTags: StoredAgentKnowledgeTag[];
  agentKnowledgeRetrievalLogs: StoredAgentKnowledgeRetrievalLog[];
  agentErrorFixPatterns: StoredAgentErrorFixPattern[];
  agentArchitecturePatterns: StoredAgentArchitecturePattern[];
  builderProjects: StoredBuilderProject[];
  builderProjectRequirements: StoredBuilderProjectRequirement[];
  builderProjectBlueprints: StoredBuilderProjectBlueprint[];
  builderProjectOutputs: StoredBuilderProjectOutput[];
  builderProjectChangeRequests: StoredBuilderProjectChangeRequest[];
  builderProjectActivityLogs: StoredBuilderProjectActivityLog[];
  factoryProjects: StoredFactoryProject[];
  factoryIntakeAnswers: StoredFactoryIntakeAnswer[];
  factoryRequirementQuestions: StoredFactoryRequirementQuestion[];
  factoryBlueprints: StoredFactoryBlueprint[];
  factoryDesignSystems: StoredFactoryDesignSystem[];
  factoryTaskGraphs: StoredFactoryTaskGraph[];
  factoryTasks: StoredFactoryTask[];
  factoryGeneratedFiles: StoredFactoryGeneratedFile[];
  factoryValidationRuns: StoredFactoryValidationRun[];
  factoryErrors: StoredFactoryError[];
  factoryRepairAttempts: StoredFactoryRepairAttempt[];
  factoryReleases: StoredFactoryRelease[];
  factoryMemoryEntries: StoredFactoryMemoryEntry[];
  factoryActivityLogs: StoredFactoryActivityLog[];
  factoryAuditLogs: StoredFactoryAuditLog[];
  billingPlans: StoredBillingPlan[];
  planFeatureFlags: StoredPlanFeatureFlag[];
  planUsagePolicies: StoredPlanUsagePolicy[];
  customerSubscriptions: StoredCustomerSubscription[];
  customerInvoices: StoredCustomerInvoice[];
  customerPayments: StoredCustomerPayment[];
  customerPaymentAttempts: StoredCustomerPaymentAttempt[];
  customerUsageLimits: StoredCustomerUsageLimit[];
  customerUsageEvents: StoredCustomerUsageEvent[];
  providerHealthChecks: StoredProviderHealthCheck[];
  customerCreditWallets: StoredCustomerCreditWallet[];
  customerCreditTransactions: StoredCustomerCreditTransaction[];
  razorpayWebhookEvents: StoredRazorpayWebhookEvent[];
  enterpriseWorkspaces: StoredEnterpriseWorkspace[];
  workspaceMembers: StoredWorkspaceMember[];
  workspaceInvites: StoredWorkspaceInvite[];
  workspaceRoles: StoredWorkspaceRole[];
  workspaceAuditLogs: StoredWorkspaceAuditLog[];
  securityEvents: StoredSecurityEvent[];
  securityRiskScores: StoredSecurityRiskScore[];
  reliabilityChecks: StoredReliabilityCheck[];
  complianceRecords: StoredComplianceRecord[];
  dataExportRequests: StoredDataExportRequest[];
  dataDeleteRequests: StoredDataDeleteRequest[];
  auditExports: StoredAuditExport[];
  launchReadinessChecks: StoredLaunchReadinessCheck[];
  operationsIncidents: StoredOperationsIncident[];
  operationsAuditLogs: StoredOperationsAuditLog[];
  operationsHealthChecks: StoredOperationsHealthCheck[];
  operationsAgentMetrics: StoredOperationsAgentMetric[];
  operationsProductMetrics: StoredOperationsProductMetric[];
  operationsBusinessMetrics: StoredOperationsBusinessMetric[];
  maintenanceWindows: StoredMaintenanceWindow[];
  emergencyActions: StoredEmergencyAction[];
  developerAccounts: StoredDeveloperAccount[];
  developerApps: StoredDeveloperApp[];
  apiKeys: StoredApiKey[];
  apiKeySecuritySettings: StoredApiKeySecuritySetting[];
  oauthClients: StoredOAuthClient[];
  sdkVersions: StoredSdkVersion[];
  pluginRegistry: StoredPluginRegistryEntry[];
  webhookEndpoints: StoredWebhookEndpoint[];
  apiUsageLogs: StoredApiUsageLog[];
  apiRateLimits: StoredApiRateLimit[];
  marketplaceApps: StoredMarketplaceApp[];
  marketplaceAppVersions: StoredMarketplaceAppVersion[];
  marketplacePublishers: StoredMarketplacePublisher[];
  marketplaceReviews: StoredMarketplaceReview[];
  marketplaceInstalls: StoredMarketplaceInstall[];
  marketplacePermissions: StoredMarketplacePermission[];
  marketplacePricing: StoredMarketplacePricing[];
  marketplacePayouts: StoredMarketplacePayout[];
  marketplaceCategories: StoredMarketplaceCategory[];
  marketplaceRevenueEvents: StoredMarketplaceRevenueEvent[];
  docsArticles: StoredDocsArticle[];
  docsVersions: StoredDocsVersion[];
  docsCategories: StoredDocsCategory[];
  docsSearchIndex: StoredDocsSearchIndex[];
  statusServices: StoredStatusService[];
  statusIncidents: StoredStatusIncident[];
  statusIncidentUpdates: StoredStatusIncidentUpdate[];
  statusSubscribers: StoredStatusSubscriber[];
  statusHealthChecks: StoredStatusHealthCheck[];
  legalPages: StoredLegalPage[];
  legalPageVersions: StoredLegalPageVersion[];
  legalAcceptanceLogs: StoredLegalAcceptanceLog[];
  promptRiskEvents: StoredPromptRiskEvent[];
  secretScanEvents: StoredSecretScanEvent[];
  securityReports: StoredSecurityReport[];
  releaseNotes: StoredReleaseNote[];
  releaseVersions: StoredReleaseVersion[];
  releaseChangelogItems: StoredReleaseChangelogItem[];
  alertRules: StoredAlertRule[];
  alertEvents: StoredAlertEvent[];
  alertNotifications: StoredAlertNotification[];
  alertAcknowledgements: StoredAlertAcknowledgement[];
  customerSuccessNotes: StoredCustomerSuccessNote[];
  customerSuccessTasks: StoredCustomerSuccessTask[];
  feedbackItems: StoredFeedbackItem[];
  feedbackVotes: StoredFeedbackVote[];
  enterpriseLeads: StoredEnterpriseLead[];
  enterpriseDemoRequests: StoredEnterpriseDemoRequest[];
  enterpriseSalesNotes: StoredEnterpriseSalesNote[];
  enterpriseSolutionPages: StoredEnterpriseSolutionPage[];
  partnerApplications: StoredPartnerApplication[];
  partnerReferrals: StoredPartnerReferral[];
  partnerCommissions: StoredPartnerCommission[];
  partnerPayouts: StoredPartnerPayout[];
  partnerResources: StoredPartnerResource[];
  partnerCertifications: StoredPartnerCertification[];
  cloudServices: StoredCloudService[];
  cloudEvents: StoredCloudEvent[];
  cloudStorageObjects: StoredCloudStorageObject[];
  cloudSecrets: StoredCloudSecret[];
  cloudConfigurations: StoredCloudConfiguration[];
  cloudMessages: StoredCloudMessage[];
  cloudJobs: StoredCloudJob[];
  cloudMetrics: StoredCloudMetric[];
  cloudAuditLogs: StoredCloudAuditLog[];
  settings: StoredSettings[];
}

export const store: StoreState = {
  users: [],
  userProfiles: [],
  loginHistory: [],
  passwordResetTokens: [],
  organizations: [],
  workspaces: [],
  entitlements: [],
  onboardingProgress: [],
  productTourProgress: [],
  workspaceSetups: [],
  featureDiscoveryViews: [],
  commandUsage: [],
  notifications: [],
  revenues: [],
  expenses: [],
  reportExports: [],
  projects: [],
  tasks: [],
  leads: [],
  customers: [],
  crmCompanies: [],
  crmContacts: [],
  crmOpportunities: [],
  crmTasks: [],
  customerHealthScores: [],
  subscriptionOperations: [],
  providerCostEvents: [],
  infrastructureCostEvents: [],
  businessReports: [],
  engineeringProjects: [],
  engineeringMetrics: [],
  technicalDebt: [],
  architectureReviews: [],
  architectureDecisions: [],
  releasePipeline: [],
  environmentRegistry: [],
  environmentHealth: [],
  migrationHistory: [],
  databaseMetrics: [],
  engineeringReports: [],
  featureFlags: [],
  supportTickets: [],
  ticketMessages: [],
  supportAttachments: [],
  supportInternalNotes: [],
  supportAnnouncements: [],
  knowledgeArticles: [],
  departments: [],
  employees: [],
  candidates: [],
  interviews: [],
  offers: [],
  agreements: [],
  complianceItems: [],
  governmentRegistrations: [],
  creatorProfiles: [],
  campaigns: [],
  partners: [],
  communications: [],
  automationRules: [],
  intelligenceSnapshots: [],
  vaanForgeRuns: [],
  vaanForgeOutputs: [],
  vaanForgeAuditLogs: [],
  agentExecutionRuns: [],
  agentTasks: [],
  agentFiles: [],
  agentValidationRuns: [],
  agentErrors: [],
  agentRepairAttempts: [],
  agentCommits: [],
  agentActivityLogs: [],
  agentTemplates: [],
  agentTemplateVersions: [],
  agentTemplateInputs: [],
  agentTemplateFiles: [],
  agentTemplateQualityChecks: [],
  agentTemplateUsageLogs: [],
  agentTemplateReviews: [],
  vformixAgentConfigs: [],
  vformixAgentFieldMappings: [],
  vformixAgentTriggers: [],
  vformixAgentSubmissionLinks: [],
  vformixAgentMappingErrors: [],
  vformixAgentWebhookLogs: [],
  agentLiveSessions: [],
  agentLiveEvents: [],
  agentWorkspaceInstructions: [],
  agentWorkspaceControls: [],
  agentWorkspaceEvidence: [],
  agentStepApprovals: [],
  agentRoles: [],
  agentRoleConfigs: [],
  agentAssignments: [],
  agentHandoffs: [],
  agentComments: [],
  agentConflicts: [],
  agentDecisionLogs: [],
  agentReviews: [],
  agentFinalReviews: [],
  agentDeployments: [],
  agentDeploymentTargets: [],
  agentDeploymentChecks: [],
  agentDeploymentLogs: [],
  agentDeploymentReleases: [],
  agentDeploymentRollbacks: [],
  agentDeploymentHealthChecks: [],
  agentMemoryEntries: [],
  agentMemorySources: [],
  agentMemoryReviews: [],
  agentKnowledgeEntries: [],
  agentKnowledgeTags: [],
  agentKnowledgeRetrievalLogs: [],
  agentErrorFixPatterns: [],
  agentArchitecturePatterns: [],
  builderProjects: [],
  builderProjectRequirements: [],
  builderProjectBlueprints: [],
  builderProjectOutputs: [],
  builderProjectChangeRequests: [],
  builderProjectActivityLogs: [],
  factoryProjects: [],
  factoryIntakeAnswers: [],
  factoryRequirementQuestions: [],
  factoryBlueprints: [],
  factoryDesignSystems: [],
  factoryTaskGraphs: [],
  factoryTasks: [],
  factoryGeneratedFiles: [],
  factoryValidationRuns: [],
  factoryErrors: [],
  factoryRepairAttempts: [],
  factoryReleases: [],
  factoryMemoryEntries: [],
  factoryActivityLogs: [],
  factoryAuditLogs: [],
  billingPlans: [],
  planFeatureFlags: [],
  planUsagePolicies: [],
  customerSubscriptions: [],
  customerInvoices: [],
  customerPayments: [],
  customerPaymentAttempts: [],
  customerUsageLimits: [],
  customerUsageEvents: [],
  providerHealthChecks: [],
  customerCreditWallets: [],
  customerCreditTransactions: [],
  razorpayWebhookEvents: [],
  enterpriseWorkspaces: [],
  workspaceMembers: [],
  workspaceInvites: [],
  workspaceRoles: [],
  workspaceAuditLogs: [],
  securityEvents: [],
  securityRiskScores: [],
  reliabilityChecks: [],
  complianceRecords: [],
  dataExportRequests: [],
  dataDeleteRequests: [],
  auditExports: [],
  launchReadinessChecks: [],
  operationsIncidents: [],
  operationsAuditLogs: [],
  operationsHealthChecks: [],
  operationsAgentMetrics: [],
  operationsProductMetrics: [],
  operationsBusinessMetrics: [],
  maintenanceWindows: [],
  emergencyActions: [],
  developerAccounts: [],
  developerApps: [],
  apiKeys: [],
  apiKeySecuritySettings: [],
  oauthClients: [],
  sdkVersions: [],
  pluginRegistry: [],
  webhookEndpoints: [],
  apiUsageLogs: [],
  apiRateLimits: [],
  marketplaceApps: [],
  marketplaceAppVersions: [],
  marketplacePublishers: [],
  marketplaceReviews: [],
  marketplaceInstalls: [],
  marketplacePermissions: [],
  marketplacePricing: [],
  marketplacePayouts: [],
  marketplaceCategories: [],
  marketplaceRevenueEvents: [],
  docsArticles: [],
  docsVersions: [],
  docsCategories: [],
  docsSearchIndex: [],
  statusServices: [],
  statusIncidents: [],
  statusIncidentUpdates: [],
  statusSubscribers: [],
  statusHealthChecks: [],
  legalPages: [],
  legalPageVersions: [],
  legalAcceptanceLogs: [],
  promptRiskEvents: [],
  secretScanEvents: [],
  securityReports: [],
  releaseNotes: [],
  releaseVersions: [],
  releaseChangelogItems: [],
  alertRules: [],
  alertEvents: [],
  alertNotifications: [],
  alertAcknowledgements: [],
  customerSuccessNotes: [],
  customerSuccessTasks: [],
  feedbackItems: [],
  feedbackVotes: [],
  enterpriseLeads: [],
  enterpriseDemoRequests: [],
  enterpriseSalesNotes: [],
  enterpriseSolutionPages: [],
  partnerApplications: [],
  partnerReferrals: [],
  partnerCommissions: [],
  partnerPayouts: [],
  partnerResources: [],
  partnerCertifications: [],
  cloudServices: [],
  cloudEvents: [],
  cloudStorageObjects: [],
  cloudSecrets: [],
  cloudConfigurations: [],
  cloudMessages: [],
  cloudJobs: [],
  cloudMetrics: [],
  cloudAuditLogs: [],
  settings: []
};

export const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
