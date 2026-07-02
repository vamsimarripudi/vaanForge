export type CampaignStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "ACTIVE" | "COMPLETED";
export type PartnerStatus = "PROSPECT" | "ACTIVE" | "PAUSED" | "ENDED";
export type AutomationStatus = "DRAFT" | "ACTIVE" | "PAUSED";
export type AutomationTrigger =
  | "LEAD_CREATED"
  | "TICKET_CREATED"
  | "RENEWAL_DUE"
  | "REPORT_READY"
  | "TASK_OVERDUE"
  | "DEPLOYMENT_SUCCEEDED"
  | "BLUEPRINT_APPROVED"
  | "CREDITS_LOW"
  | "PAYMENT_FAILED"
  | "AI_FINISHED";
export type AutomationAction = "CREATE_TASK" | "SEND_NOTIFICATION" | "QUEUE_REPORT" | "REQUEST_APPROVAL" | "SEND_EMAIL" | "CALL_WEBHOOK";
export type MessageChannel = "ANNOUNCEMENT" | "DIRECT" | "TEAM" | "SUPPORT" | "CUSTOMER_FOLLOW_UP";

export interface CreatorProfileInput {
  organizationId: string;
  name: string;
  niche?: string;
  payoutStatus?: string;
}

export interface CampaignInput {
  organizationId: string;
  creatorId?: string;
  title: string;
  status: CampaignStatus;
  budget?: number;
}

export interface PartnerInput {
  organizationId: string;
  name: string;
  status: PartnerStatus;
  revenueSharePercent?: number;
}

export interface CommunicationInput {
  organizationId: string;
  channel: MessageChannel;
  title: string;
  message: string;
  audience?: string;
}

export interface AutomationRuleInput {
  organizationId: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  status: AutomationStatus;
  approvalRequired: boolean;
}

export interface SettingsInput {
  organizationId: string;
  themeMode: "light" | "dark" | "system";
  billingEmail?: string;
  notificationEmail?: boolean;
  notificationSms?: boolean;
}
