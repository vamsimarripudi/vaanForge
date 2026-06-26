CREATE TYPE "AgentLiveSessionStatus" AS ENUM ('open', 'closed');
CREATE TYPE "AgentWorkspaceControlStatus" AS ENUM ('accepted', 'rejected');
CREATE TYPE "AgentStepApprovalDecision" AS ENUM ('approved', 'rejected');

CREATE TABLE "agent_live_sessions" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "status" "AgentLiveSessionStatus" NOT NULL DEFAULT 'open',
  "lastEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "agent_live_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_live_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_live_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_workspace_instructions" (
  "id" TEXT NOT NULL,
  "instructionId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "instructionType" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "applied" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_workspace_instructions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_workspace_controls" (
  "id" TEXT NOT NULL,
  "controlId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "status" "AgentWorkspaceControlStatus" NOT NULL DEFAULT 'accepted',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_workspace_controls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_workspace_evidence" (
  "id" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "evidenceType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_workspace_evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_step_approvals" (
  "id" TEXT NOT NULL,
  "approvalId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "decision" "AgentStepApprovalDecision" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_step_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_live_sessions_sessionId_key" ON "agent_live_sessions"("sessionId");
CREATE INDEX "agent_live_sessions_organizationId_runId_idx" ON "agent_live_sessions"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_live_events_eventId_key" ON "agent_live_events"("eventId");
CREATE INDEX "agent_live_events_organizationId_runId_createdAt_idx" ON "agent_live_events"("organizationId", "runId", "createdAt");
CREATE UNIQUE INDEX "agent_workspace_instructions_instructionId_key" ON "agent_workspace_instructions"("instructionId");
CREATE INDEX "agent_workspace_instructions_organizationId_runId_idx" ON "agent_workspace_instructions"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_workspace_controls_controlId_key" ON "agent_workspace_controls"("controlId");
CREATE INDEX "agent_workspace_controls_organizationId_runId_idx" ON "agent_workspace_controls"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_workspace_evidence_evidenceId_key" ON "agent_workspace_evidence"("evidenceId");
CREATE INDEX "agent_workspace_evidence_organizationId_runId_idx" ON "agent_workspace_evidence"("organizationId", "runId");
CREATE UNIQUE INDEX "agent_step_approvals_approvalId_key" ON "agent_step_approvals"("approvalId");
CREATE INDEX "agent_step_approvals_organizationId_runId_idx" ON "agent_step_approvals"("organizationId", "runId");

ALTER TABLE "agent_live_sessions" ADD CONSTRAINT "agent_live_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_live_events" ADD CONSTRAINT "agent_live_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_workspace_instructions" ADD CONSTRAINT "agent_workspace_instructions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_workspace_controls" ADD CONSTRAINT "agent_workspace_controls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_workspace_evidence" ADD CONSTRAINT "agent_workspace_evidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "agent_step_approvals" ADD CONSTRAINT "agent_step_approvals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
