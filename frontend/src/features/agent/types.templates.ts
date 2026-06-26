export type AgentTemplate = {
  templateId: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  previewImage?: string;
  stack: string[];
  requiredInputs: Array<{ key: string; label?: string; inputType?: string; required?: boolean }>;
  optionalInputs: Array<Record<string, unknown>>;
  includedScreens: string[];
  includedApis: string[];
  databaseModels: string[];
  designTokens: string[];
  securityRules: string[];
  validationRules: string[];
  status: "draft" | "pending_review" | "published" | "unpublished" | "archived";
  version: string;
  createdBy: string;
  approvedBy?: string;
  ownerId: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  nextAction: string;
  activityHistory: Array<Record<string, unknown>>;
  versions?: AgentTemplateVersion[];
  qualityChecks?: AgentTemplateQualityCheck[];
  usageLogs?: Array<Record<string, unknown>>;
};

export type AgentTemplateVersion = {
  versionId: string;
  templateId: string;
  version: string;
  changelog: string;
  createdBy: string;
  approvedBy?: string;
  releaseStatus: "draft" | "approved" | "rejected" | "released" | "rolled_back";
  createdAt: string;
};

export type AgentTemplateQualityCheck = {
  checkId: string;
  checkName: string;
  status: "passed" | "failed" | "pending";
  message: string;
  createdAt: string;
};
