export type VFormixAgentStatus =
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

export type VFormixAgentConfig = {
  configId: string;
  formId: string;
  enabled: boolean;
  defaultTemplateId?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  status: "draft" | "active" | "paused";
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
};

export type VFormixAgentFieldMapping = {
  mappingId: string;
  formFieldKey: string;
  agentFieldPath: string;
  required: boolean;
  normalizer: "text" | "slug" | "list" | "date" | "priority";
  fallbackValue?: string;
};

export type VFormixAgentTrigger = {
  triggerId: string;
  triggerType: "submission" | "manual" | "approval" | "template_selection";
  enabled: boolean;
  requiresApproval: boolean;
};

export type VFormixAgentMappingError = {
  errorId: string;
  fieldKey: string;
  reason: string;
  nextAction: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type VFormixAgentSubmissionStatus = {
  linkId: string;
  formId: string;
  submissionId: string;
  rawSubmission: Record<string, unknown>;
  cleanedAgentInput?: Record<string, unknown>;
  templateId?: string;
  templateMatchReason?: string;
  runId?: string;
  executionId?: string;
  status: VFormixAgentStatus;
  errorMessage?: string;
  missingFields: string[];
  ownerId: string;
  priority: string;
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  mappingErrors?: VFormixAgentMappingError[];
};
