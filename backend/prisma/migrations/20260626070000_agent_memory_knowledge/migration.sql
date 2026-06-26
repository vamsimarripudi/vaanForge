CREATE TYPE "AgentMemoryStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'archived');
CREATE TYPE "AgentMemoryTrust" AS ENUM ('trusted', 'untrusted');
CREATE TYPE "AgentMemoryType" AS ENUM ('project', 'user_preference', 'product', 'error_fix', 'template_usage', 'deployment', 'approval');
CREATE TYPE "AgentMemorySourceType" AS ENUM ('project', 'error', 'fix', 'template', 'deployment', 'approval', 'manual');
CREATE TYPE "AgentKnowledgeType" AS ENUM ('project_pattern', 'architecture', 'common_error', 'verified_fix', 'deployment_lesson', 'security_rule', 'design_rule');

CREATE TABLE "agent_memory_entries" (
  "id" TEXT NOT NULL,
  "memoryId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "memoryType" "AgentMemoryType" NOT NULL,
  "content" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "tags" TEXT[],
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "status" "AgentMemoryStatus" NOT NULL,
  "trustLevel" "AgentMemoryTrust" NOT NULL,
  "ownerId" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "retentionUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_memory_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_memory_sources" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "memoryId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sourceType" "AgentMemorySourceType" NOT NULL,
  "sourceRef" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_memory_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_memory_reviews" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "memoryId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "decision" "AgentMemoryStatus" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_memory_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_knowledge_entries" (
  "id" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "memoryId" TEXT,
  "title" TEXT NOT NULL,
  "knowledgeType" "AgentKnowledgeType" NOT NULL,
  "content" TEXT NOT NULL,
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "trusted" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL,
  "sourceRefs" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_knowledge_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_knowledge_tags" (
  "id" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tag" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_knowledge_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_knowledge_retrieval_logs" (
  "id" TEXT NOT NULL,
  "retrievalId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "selectedEntryIds" TEXT[],
  "rationale" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_knowledge_retrieval_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_error_fix_patterns" (
  "id" TEXT NOT NULL,
  "patternId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "memoryId" TEXT,
  "errorSignature" TEXT NOT NULL,
  "fixSummary" TEXT NOT NULL,
  "rejected" BOOLEAN NOT NULL DEFAULT false,
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_error_fix_patterns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_architecture_patterns" (
  "id" TEXT NOT NULL,
  "patternId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "memoryId" TEXT,
  "architectureName" TEXT NOT NULL,
  "applicability" TEXT NOT NULL,
  "securityNotes" TEXT[],
  "confidenceScore" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_architecture_patterns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_memory_entries_memoryId_key" ON "agent_memory_entries"("memoryId");
CREATE INDEX "agent_memory_entries_organizationId_status_idx" ON "agent_memory_entries"("organizationId", "status");
CREATE INDEX "agent_memory_entries_organizationId_memoryType_idx" ON "agent_memory_entries"("organizationId", "memoryType");
CREATE UNIQUE INDEX "agent_memory_sources_sourceId_key" ON "agent_memory_sources"("sourceId");
CREATE INDEX "agent_memory_sources_organizationId_memoryId_idx" ON "agent_memory_sources"("organizationId", "memoryId");
CREATE UNIQUE INDEX "agent_memory_reviews_reviewId_key" ON "agent_memory_reviews"("reviewId");
CREATE INDEX "agent_memory_reviews_organizationId_memoryId_idx" ON "agent_memory_reviews"("organizationId", "memoryId");
CREATE UNIQUE INDEX "agent_knowledge_entries_entryId_key" ON "agent_knowledge_entries"("entryId");
CREATE INDEX "agent_knowledge_entries_organizationId_status_idx" ON "agent_knowledge_entries"("organizationId", "status");
CREATE INDEX "agent_knowledge_entries_organizationId_knowledgeType_idx" ON "agent_knowledge_entries"("organizationId", "knowledgeType");
CREATE UNIQUE INDEX "agent_knowledge_tags_tagId_key" ON "agent_knowledge_tags"("tagId");
CREATE INDEX "agent_knowledge_tags_organizationId_tag_idx" ON "agent_knowledge_tags"("organizationId", "tag");
CREATE UNIQUE INDEX "agent_knowledge_retrieval_logs_retrievalId_key" ON "agent_knowledge_retrieval_logs"("retrievalId");
CREATE INDEX "agent_knowledge_retrieval_logs_organizationId_createdAt_idx" ON "agent_knowledge_retrieval_logs"("organizationId", "createdAt");
CREATE UNIQUE INDEX "agent_error_fix_patterns_patternId_key" ON "agent_error_fix_patterns"("patternId");
CREATE INDEX "agent_error_fix_patterns_organizationId_rejected_idx" ON "agent_error_fix_patterns"("organizationId", "rejected");
CREATE UNIQUE INDEX "agent_architecture_patterns_patternId_key" ON "agent_architecture_patterns"("patternId");
CREATE INDEX "agent_architecture_patterns_organizationId_idx" ON "agent_architecture_patterns"("organizationId");

ALTER TABLE "agent_memory_entries" ADD CONSTRAINT "agent_memory_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_memory_sources" ADD CONSTRAINT "agent_memory_sources_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "agent_memory_entries"("memoryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_memory_sources" ADD CONSTRAINT "agent_memory_sources_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_memory_reviews" ADD CONSTRAINT "agent_memory_reviews_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "agent_memory_entries"("memoryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_memory_reviews" ADD CONSTRAINT "agent_memory_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_entries" ADD CONSTRAINT "agent_knowledge_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_tags" ADD CONSTRAINT "agent_knowledge_tags_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "agent_knowledge_entries"("entryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_tags" ADD CONSTRAINT "agent_knowledge_tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_knowledge_retrieval_logs" ADD CONSTRAINT "agent_knowledge_retrieval_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_error_fix_patterns" ADD CONSTRAINT "agent_error_fix_patterns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_architecture_patterns" ADD CONSTRAINT "agent_architecture_patterns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
