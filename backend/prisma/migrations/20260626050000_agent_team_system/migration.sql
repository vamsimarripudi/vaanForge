CREATE TYPE "AgentTeamStatus" AS ENUM ('created', 'assigned', 'in_progress', 'review_required', 'approved', 'handed_off', 'completed', 'blocked', 'failed');
CREATE TYPE "AgentRoleStatus" AS ENUM ('active', 'inactive');
CREATE TYPE "AgentConflictStatus" AS ENUM ('open', 'resolved');
CREATE TYPE "AgentReviewDecision" AS ENUM ('approved', 'rejected', 'changes_requested');
CREATE TYPE "AgentFinalReviewDecision" AS ENUM ('approved', 'rejected');

CREATE TABLE "agent_roles" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "responsibilities" TEXT[],
  "requiredReview" BOOLEAN NOT NULL DEFAULT false,
  "status" "AgentRoleStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_role_configs" (
  "id" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "modelProvider" TEXT NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "tools" TEXT[],
  "guardrails" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_role_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_assignments" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" "AgentTeamStatus" NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "scope" TEXT NOT NULL,
  "outputVersion" INTEGER NOT NULL DEFAULT 1,
  "output" JSONB,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_handoffs" (
  "id" TEXT NOT NULL,
  "handoffId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fromRoleId" TEXT NOT NULL,
  "toRoleId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "status" "AgentTeamStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_handoffs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_comments" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "visibility" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_conflicts" (
  "id" TEXT NOT NULL,
  "conflictId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "raisedByRoleId" TEXT NOT NULL,
  "againstRoleId" TEXT,
  "reason" TEXT NOT NULL,
  "resolution" TEXT,
  "status" "AgentConflictStatus" NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_decision_logs" (
  "id" TEXT NOT NULL,
  "decisionId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_decision_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_reviews" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "decision" "AgentReviewDecision" NOT NULL,
  "findings" TEXT[],
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_final_reviews" (
  "id" TEXT NOT NULL,
  "finalReviewId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "decision" "AgentFinalReviewDecision" NOT NULL,
  "requiredReviews" TEXT[],
  "missingReviews" TEXT[],
  "summary" TEXT NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_final_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_roles_roleId_key" ON "agent_roles"("roleId");
CREATE UNIQUE INDEX "agent_roles_organizationId_slug_key" ON "agent_roles"("organizationId", "slug");
CREATE INDEX "agent_roles_organizationId_status_idx" ON "agent_roles"("organizationId", "status");
CREATE UNIQUE INDEX "agent_role_configs_configId_key" ON "agent_role_configs"("configId");
CREATE UNIQUE INDEX "agent_role_configs_organizationId_roleId_key" ON "agent_role_configs"("organizationId", "roleId");
CREATE UNIQUE INDEX "agent_assignments_assignmentId_key" ON "agent_assignments"("assignmentId");
CREATE UNIQUE INDEX "agent_assignments_organizationId_runId_roleId_key" ON "agent_assignments"("organizationId", "runId", "roleId");
CREATE INDEX "agent_assignments_organizationId_runId_idx" ON "agent_assignments"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_handoffs_handoffId_key" ON "agent_handoffs"("handoffId");
CREATE INDEX "agent_handoffs_organizationId_runId_idx" ON "agent_handoffs"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_comments_commentId_key" ON "agent_comments"("commentId");
CREATE INDEX "agent_comments_organizationId_runId_idx" ON "agent_comments"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_conflicts_conflictId_key" ON "agent_conflicts"("conflictId");
CREATE INDEX "agent_conflicts_organizationId_runId_idx" ON "agent_conflicts"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_decision_logs_decisionId_key" ON "agent_decision_logs"("decisionId");
CREATE INDEX "agent_decision_logs_organizationId_runId_idx" ON "agent_decision_logs"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_reviews_reviewId_key" ON "agent_reviews"("reviewId");
CREATE INDEX "agent_reviews_organizationId_runId_idx" ON "agent_reviews"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_final_reviews_finalReviewId_key" ON "agent_final_reviews"("finalReviewId");
CREATE INDEX "agent_final_reviews_organizationId_runId_idx" ON "agent_final_reviews"("organizationId", "runId");

ALTER TABLE "agent_roles" ADD CONSTRAINT "agent_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_role_configs" ADD CONSTRAINT "agent_role_configs_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "agent_roles"("roleId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_role_configs" ADD CONSTRAINT "agent_role_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_handoffs" ADD CONSTRAINT "agent_handoffs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_comments" ADD CONSTRAINT "agent_comments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_conflicts" ADD CONSTRAINT "agent_conflicts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_decision_logs" ADD CONSTRAINT "agent_decision_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_reviews" ADD CONSTRAINT "agent_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_final_reviews" ADD CONSTRAINT "agent_final_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
