export type WorkStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
export type WorkPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LeadStage = "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "PROPOSAL_SENT" | "WON" | "LOST";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";

export interface ProjectInput {
  organizationId: string;
  name: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
}

export interface TaskInput {
  organizationId: string;
  projectId?: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  priority: WorkPriority;
  status: WorkStatus;
}

export interface LeadInput {
  organizationId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage: LeadStage;
  expectedValue?: number;
}

export interface CustomerInput {
  organizationId: string;
  name: string;
  email?: string;
  activePlan?: string;
  renewalDate?: string;
}

export interface SupportTicketInput {
  organizationId: string;
  customerId?: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
}
