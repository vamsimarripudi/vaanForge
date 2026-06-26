CREATE TABLE "workspaces" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "domain" TEXT,
  "ssoReady" BOOLEAN NOT NULL,
  "retentionDays" INTEGER NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_roles" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "permissions" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_members" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_invites" (
  "id" TEXT NOT NULL,
  "inviteId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_audit_logs" (
  "id" TEXT NOT NULL,
  "auditId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reliability_checks" (
  "id" TEXT NOT NULL,
  "checkId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "checkName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reliability_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_records" (
  "id" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "subjectId" TEXT,
  "status" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_export_requests" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "exportScope" TEXT[] NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "data_delete_requests" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "nextAction" TEXT NOT NULL,
  "activityHistory" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "data_delete_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "launch_readiness_checks" (
  "id" TEXT NOT NULL,
  "checkId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evidence" JSONB NOT NULL,
  "nextAction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "launch_readiness_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspaces_workspaceId_key" ON "workspaces"("workspaceId");
CREATE INDEX "workspaces_organizationId_status_idx" ON "workspaces"("organizationId", "status");
CREATE UNIQUE INDEX "workspace_roles_roleId_key" ON "workspace_roles"("roleId");
CREATE INDEX "workspace_roles_organizationId_workspaceId_idx" ON "workspace_roles"("organizationId", "workspaceId");
CREATE UNIQUE INDEX "workspace_members_memberId_key" ON "workspace_members"("memberId");
CREATE INDEX "workspace_members_organizationId_workspaceId_idx" ON "workspace_members"("organizationId", "workspaceId");
CREATE UNIQUE INDEX "workspace_invites_inviteId_key" ON "workspace_invites"("inviteId");
CREATE INDEX "workspace_invites_organizationId_workspaceId_idx" ON "workspace_invites"("organizationId", "workspaceId");
CREATE UNIQUE INDEX "workspace_audit_logs_auditId_key" ON "workspace_audit_logs"("auditId");
CREATE INDEX "workspace_audit_logs_organizationId_workspaceId_idx" ON "workspace_audit_logs"("organizationId", "workspaceId");
CREATE UNIQUE INDEX "security_events_eventId_key" ON "security_events"("eventId");
CREATE INDEX "security_events_organizationId_category_idx" ON "security_events"("organizationId", "category");
CREATE UNIQUE INDEX "reliability_checks_checkId_key" ON "reliability_checks"("checkId");
CREATE INDEX "reliability_checks_organizationId_checkName_idx" ON "reliability_checks"("organizationId", "checkName");
CREATE UNIQUE INDEX "compliance_records_recordId_key" ON "compliance_records"("recordId");
CREATE INDEX "compliance_records_organizationId_recordType_idx" ON "compliance_records"("organizationId", "recordType");
CREATE UNIQUE INDEX "data_export_requests_requestId_key" ON "data_export_requests"("requestId");
CREATE INDEX "data_export_requests_organizationId_requestedById_idx" ON "data_export_requests"("organizationId", "requestedById");
CREATE UNIQUE INDEX "data_delete_requests_requestId_key" ON "data_delete_requests"("requestId");
CREATE INDEX "data_delete_requests_organizationId_requestedById_idx" ON "data_delete_requests"("organizationId", "requestedById");
CREATE UNIQUE INDEX "launch_readiness_checks_checkId_key" ON "launch_readiness_checks"("checkId");
CREATE INDEX "launch_readiness_checks_organizationId_category_idx" ON "launch_readiness_checks"("organizationId", "category");

ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workspace_roles" ADD CONSTRAINT "workspace_roles_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_roles" ADD CONSTRAINT "workspace_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reliability_checks" ADD CONSTRAINT "reliability_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "data_delete_requests" ADD CONSTRAINT "data_delete_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "launch_readiness_checks" ADD CONSTRAINT "launch_readiness_checks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
