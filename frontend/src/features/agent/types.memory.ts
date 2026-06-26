export type AgentMemoryEntry = {
  memoryId: string;
  title: string;
  memoryType: "project" | "user_preference" | "product" | "error_fix" | "template_usage" | "deployment" | "approval";
  content: string;
  summary: string;
  tags: string[];
  confidenceScore: number;
  status: "pending_review" | "approved" | "rejected" | "archived";
  trustLevel: "trusted" | "untrusted";
  ownerId: string;
  priority: string;
  dueDate: string;
  nextAction: string;
  sources?: Array<Record<string, unknown>>;
  reviews?: Array<Record<string, unknown>>;
};

export type AgentKnowledgeEntry = {
  entryId: string;
  memoryId?: string;
  title: string;
  knowledgeType: string;
  content: string;
  confidenceScore: number;
  trusted: boolean;
  status: string;
  sourceRefs: string[];
  tags?: string[];
  score?: number;
  whySelected?: string;
};
