# VaanForge AI Agent

VaanForge is KRAVIA PVT LTD's enterprise AI software factory. It accepts structured requirements, generates production-ready blueprints, coordinates agent execution, and records delivery evidence.

## Backend Structure

- `backend/src/modules/vaanforge/vaanforge.parser.ts` validates required requirement JSON fields.
- `backend/src/modules/vaanforge/vaanforge.service.ts` controls run phases, queue handoff, blueprint generation, output persistence, status, errors, activity history, and audit logs.
- `backend/src/modules/vaanforge/vaanforge.repository.ts` supports PostgreSQL through Prisma and local in-memory persistence.
- `backend/src/modules/vaanforge/vaanforge.output-storage.ts` converts generated blueprint sections into persisted markdown/json outputs.
- `backend/src/modules/vaanforge/vaanforge.routes.ts` exposes run creation and admin monitoring APIs.
- `backend/src/infrastructure/ai/*` includes the abstract blueprint provider contract.
- `backend/prisma/schema.prisma` and `backend/prisma/migrations/20260625213000_vaanforge_agent_runs/migration.sql` define database models.

## Generated Outputs

Each completed run stores:

- Product Requirement Document
- Architecture plan
- Folder structure
- Database plan
- API plan
- UI screen list
- Sprint-wise execution roadmap
- Codex-ready implementation prompt

## Admin APIs

- `GET /api/v1/vaanforge/admin/runs`
- `GET /api/v1/vaanforge/admin/runs/:runId`
- `GET /api/v1/vaanforge/admin/runs/:runId/requirements`
- `GET /api/v1/vaanforge/admin/runs/:runId/plans`
- `GET /api/v1/vaanforge/admin/runs/:runId/audit-logs`

## Testing Checklist

- Validate malformed requirement JSON returns field-level errors.
- Confirm valid requirements create a unique `vaanforge_*` run ID.
- Confirm status transitions are recorded: `pending`, `analyzing`, `planned`, `completed` or `failed`.
- Confirm every run tracks owner, status, priority, due date, activity history, audit logs, and next action.
- Confirm all eight output sections are persisted and non-empty.
- Confirm failed provider or validation steps mark the run as `failed` with an error and next action.
- Confirm admin APIs return runs, input requirements, generated plans, status, errors, and audit logs.
- Run `npm.cmd run typecheck --workspace backend`.
- Run `npm.cmd run test --workspace backend`.
- Run `npm.cmd run build --workspace backend`.
- Run Prisma validation with `DATABASE_URL` set before deploying migrations.

## Phase 2: Coding Execution Agent

Phase 2 converts a completed Phase 1 blueprint into executable implementation work.

### Folder Structure

- `backend/src/modules/vaanforge/vaanforge-execution.service.ts` orchestrates execution runs.
- `backend/src/modules/vaanforge/vaanforge-task-graph.ts` builds and validates the executable task graph.
- `backend/src/modules/vaanforge/vaanforge-code-generator.ts` generates module files from approved blueprint tasks.
- `backend/src/modules/vaanforge/vaanforge-file-writer.ts` writes files and blocks unreviewed overwrites with diff summaries.
- `backend/src/modules/vaanforge/vaanforge-validation-runner.ts` runs real lint, type-check, test, and build commands.
- `backend/src/modules/vaanforge/vaanforge-repair-loop.ts` parses validation failures and logs repair strategies.
- `backend/src/modules/vaanforge/vaanforge-execution.repository.ts` persists execution records in memory or PostgreSQL.
- `backend/prisma/migrations/20260625223000_vaanforge_execution_agent/migration.sql` adds execution tables.

### Database Tables

- `agent_execution_runs`
- `agent_tasks`
- `agent_files`
- `agent_validation_runs`
- `agent_errors`
- `agent_repair_attempts`
- `agent_commits`
- `agent_activity_logs`

### Execution APIs

- `POST /api/v1/vaanforge/executions`
- `GET /api/v1/vaanforge/executions`
- `GET /api/v1/vaanforge/executions/:executionId`
- `GET /api/v1/vaanforge/admin/executions`
- `GET /api/v1/vaanforge/admin/executions/:executionId`
- `GET /api/v1/vaanforge/admin/executions/:executionId/report`

### Final Checklist

- Phase 1 blueprint is completed before execution starts.
- Status flow is enforced: `pending`, `preparing`, `generating`, `validating`, `repairing`, `completed`, `blocked`, `failed`.
- Every task tracks owner, status, priority, due date, activity history, and next action.
- Every generated file is tracked in `agent_files`.
- Existing files are not overwritten unless `allowReviewedOverwrite` is explicitly approved.
- Validation runs store command, output, status, timestamps, and exit code.
- Errors store source, file path, line, reason, fix attempt, and final status.
- Repair cycles are logged in `agent_repair_attempts`.
- Completion requires lint, type-check, tests, and build to pass.
- Execution reports are available through admin APIs.

## Phase 3: Visual Agent Dashboard

Phase 3 adds the admin-facing dashboard for visually monitoring, approving, rejecting, blocking, resuming, and canceling VaanForge blueprint and execution runs.

### Frontend Routes

- `/admin/agent`
- `/admin/agent/runs`
- `/admin/agent/runs/:runId`
- `/admin/agent/runs/:runId/tasks`
- `/admin/agent/runs/:runId/files`
- `/admin/agent/runs/:runId/diff`
- `/admin/agent/runs/:runId/logs`
- `/admin/agent/approvals`
- `/admin/agent/settings`

### Backend Admin APIs

- `GET /api/admin/agent/summary`
- `GET /api/admin/agent/runs`
- `GET /api/admin/agent/runs/:runId`
- `GET /api/admin/agent/runs/:runId/tasks`
- `GET /api/admin/agent/runs/:runId/files`
- `GET /api/admin/agent/runs/:runId/validations`
- `GET /api/admin/agent/runs/:runId/errors`
- `GET /api/admin/agent/runs/:runId/logs`
- `POST /api/admin/agent/runs/:runId/approve`
- `POST /api/admin/agent/runs/:runId/reject`
- `POST /api/admin/agent/runs/:runId/block`
- `POST /api/admin/agent/runs/:runId/resume`
- `POST /api/admin/agent/runs/:runId/cancel`

The same contract is also available under `/api/v1/admin/agent/*` for the existing frontend API base URL.

### Dashboard Checks

- Metrics are derived from stored blueprint and execution runs.
- Empty states explain the next action instead of showing placeholder data.
- Every action asks for confirmation before calling the backend.
- Rejection, block, and cancel actions require a reason.
- Admin APIs require authentication and `audit:read`.
- Approval, rejection, block, resume, and cancel actions write audit/activity records.
- Provider API keys are not returned by dashboard APIs.
- File paths shown are stored agent file paths only, not provider credentials or secrets.

## Phase 4: Agent Marketplace and Project Templates

Phase 4 adds reusable, versioned VaanForge templates that can be selected by admins or VFormix and turned into real Phase 1 agent runs.

### Template Tables

- `agent_templates`
- `agent_template_versions`
- `agent_template_inputs`
- `agent_template_files`
- `agent_template_quality_checks`
- `agent_template_usage_logs`
- `agent_template_reviews`

### Template APIs

- `GET /api/admin/agent/templates`
- `POST /api/admin/agent/templates`
- `GET /api/admin/agent/templates/:templateId`
- `PATCH /api/admin/agent/templates/:templateId`
- `POST /api/admin/agent/templates/:templateId/archive`
- `POST /api/admin/agent/templates/:templateId/clone`
- `GET /api/admin/agent/templates/:templateId/versions`
- `POST /api/admin/agent/templates/:templateId/versions`
- `POST /api/admin/agent/templates/:templateId/publish`
- `POST /api/admin/agent/templates/:templateId/unpublish`
- `POST /api/admin/agent/templates/:templateId/rollback`
- `POST /api/admin/agent/templates/:templateId/use`
- `GET /api/admin/agent/marketplace`
- `GET /api/admin/agent/marketplace/:templateId`

The same routes are also available under `/api/v1/admin/agent/*`.

### Template Pages

- `/admin/agent/templates`
- `/admin/agent/templates/new`
- `/admin/agent/templates/:templateId`
- `/admin/agent/templates/:templateId/edit`
- `/admin/agent/templates/:templateId/versions`
- `/admin/agent/templates/:templateId/preview`
- `/admin/agent/marketplace`
- `/admin/agent/marketplace/:templateId`

### Built-in Approved Templates

- Education app template
- CRM template
- Event platform template
- Forms platform template
- Meeting app template
- Admin dashboard template
- Landing page template
- SaaS billing template

These are persisted into the template store on first organization access, then served through the same database-backed marketplace APIs as custom templates.

### Template Quality Gates

- Architecture validation
- Design system validation
- Required fields validation
- Security validation
- Build/lint/type-check validation
- Approval before publishing

### Template Workflow Checks

- Archived templates cannot be used.
- Publishing requires all quality gates to pass.
- Updates create a new version instead of overwriting history.
- Rollback restores an approved or released version snapshot.
- Template usage validates required inputs and creates a real VaanForge Phase 1 run.
- Create, edit, archive, publish, unpublish, rollback, and use actions are audited.

## Phase 5: VFormix Agent Integration

Phase 5 connects VFormix form submissions to VaanForge so an approved form workflow can map submission fields into agent requirements, recommend a template, generate a blueprint, and optionally continue into Coding Agent execution after approval.

### VFormix Agent Tables

- `vformix_agent_configs`
- `vformix_agent_field_mappings`
- `vformix_agent_triggers`
- `vformix_agent_submission_links`
- `vformix_agent_mapping_errors`
- `vformix_agent_webhook_logs`

### VFormix Agent APIs

- `GET /api/admin/vformix/forms/:formId/agent`
- `PATCH /api/admin/vformix/forms/:formId/agent`
- `GET /api/admin/vformix/forms/:formId/agent/mapping`
- `PATCH /api/admin/vformix/forms/:formId/agent/mapping`
- `GET /api/admin/vformix/forms/:formId/agent/triggers`
- `PATCH /api/admin/vformix/forms/:formId/agent/triggers`
- `POST /api/admin/vformix/submissions/:submissionId/agent/run`
- `GET /api/admin/vformix/submissions/:submissionId/agent/status`
- `POST /api/internal/vformix/agent/webhook`

Admin routes are also available under `/api/v1/admin/vformix/*`. The internal webhook bypasses cookie auth only for that path and requires `x-vformix-agent-token`.

### VFormix Agent Pages

- `/admin/vformix/forms/:formId/agent`
- `/admin/vformix/forms/:formId/agent/mapping`
- `/admin/vformix/forms/:formId/agent/triggers`
- `/admin/vformix/submissions/:submissionId/agent`
- `/admin/vformix/submissions/:submissionId/agent/status`

### Integration Workflow Checks

- Raw submissions are stored separately from cleaned agent input.
- Required field mapping failures block agent runs and store exact missing fields.
- Duplicate submission triggers are blocked unless the admin/manual trigger explicitly allows a duplicate run.
- Template recommendation uses the configured default template first, then published marketplace matches.
- Successful triggers create or link a VaanForge run ID.
- Mapping changes, trigger changes, config changes, and run triggers are audited through the VaanForge audit action with VFormix metadata.
- Form input strings are sanitized before reaching VaanForge requirement generation.

## Phase 6: Live Agent Workspace

Phase 6 adds an admin command center for observing and controlling VaanForge runs with backend-backed live events, human-in-the-loop controls, instruction history, and evidence panels.

### Live Workspace Tables

- `agent_live_sessions`
- `agent_live_events`
- `agent_workspace_instructions`
- `agent_workspace_controls`
- `agent_workspace_evidence`
- `agent_step_approvals`

### Live Workspace APIs

- `GET /api/admin/agent/workspace`
- `GET /api/admin/agent/workspace/:runId`
- `GET /api/admin/agent/workspace/:runId/live`
- `GET /api/admin/agent/workspace/:runId/evidence`
- `GET /api/admin/agent/workspace/:runId/instructions`
- `POST /api/admin/agent/workspace/:runId/pause`
- `POST /api/admin/agent/workspace/:runId/resume`
- `POST /api/admin/agent/workspace/:runId/stop`
- `POST /api/admin/agent/workspace/:runId/approve-step`
- `POST /api/admin/agent/workspace/:runId/reject-step`
- `POST /api/admin/agent/workspace/:runId/regenerate`
- `POST /api/admin/agent/workspace/:runId/instructions`

The same admin routes are available under `/api/v1/admin/agent/workspace/*`.

### Live Workspace Pages

- `/admin/agent/workspace`
- `/admin/agent/workspace/:runId`
- `/admin/agent/workspace/:runId/live`
- `/admin/agent/workspace/:runId/evidence`
- `/admin/agent/workspace/:runId/instructions`

### Realtime Events

The live endpoint uses Server-Sent Events and replays persisted `agent_live_events` records generated from current run, task, validation, error, repair, and approval state.

Supported event names include `agent.run.started`, `agent.run.updated`, `agent.task.started`, `agent.task.progress`, `agent.task.completed`, `agent.task.failed`, `agent.validation.completed`, `agent.validation.failed`, `agent.repair.completed`, `agent.approval.required`, `agent.run.completed`, `agent.run.failed`, and `agent.run.blocked`.

### Workspace Workflow Checks

- Pause and manual review route through the existing blocked-run transition.
- Resume and stop route through existing admin run controls.
- Instructions pause the run before being sanitized, stored, and applied.
- Regeneration creates a new evidence version instead of overwriting previous output.
- Evidence is assembled from real files, diffs, validation runs, errors, repairs, build checks, and final counts.
- Workspace controls, instructions, and approvals are audited through the VaanForge audit action with workspace metadata.

## Phase 7: Multi-Agent Team System

Phase 7 adds a specialized product-team layer for VaanForge runs. The team system registers role definitions, assigns primary agent owners to runs, records handoffs, captures comments, logs conflicts, stores decisions, and blocks final approval until required specialist reviews pass.

### Team Tables

- `agent_roles`
- `agent_role_configs`
- `agent_assignments`
- `agent_handoffs`
- `agent_comments`
- `agent_conflicts`
- `agent_decision_logs`
- `agent_reviews`
- `agent_final_reviews`

### Team APIs

- `GET /api/admin/agent/team`
- `GET /api/admin/agent/team/roles`
- `POST /api/admin/agent/team/roles`
- `PATCH /api/admin/agent/team/roles/:roleId`
- `GET /api/admin/agent/runs/:runId/team`
- `POST /api/admin/agent/runs/:runId/team/assign`
- `POST /api/admin/agent/runs/:runId/team/handoff`
- `POST /api/admin/agent/runs/:runId/team/comment`
- `POST /api/admin/agent/runs/:runId/team/conflict`
- `POST /api/admin/agent/runs/:runId/team/review`
- `POST /api/admin/agent/runs/:runId/team/final-review`

### Team Pages

- `/admin/agent/team`
- `/admin/agent/team/roles`
- `/admin/agent/runs/:runId/team`
- `/admin/agent/runs/:runId/handoffs`
- `/admin/agent/runs/:runId/comments`
- `/admin/agent/runs/:runId/conflicts`
- `/admin/agent/runs/:runId/reviews`

### Default Specialist Agents

- Product Manager Agent
- Architect Agent
- UI/UX Agent
- Backend Agent
- Frontend Agent
- QA Agent
- Security Agent
- DevOps Agent
- Documentation Agent

### Team Workflow Checks

- Every assignment has one primary agent owner.
- Handoffs require summary, evidence, and next action.
- Conflicts require reason, next action, and optional resolution.
- Agent comments are stored against a role and run.
- Required final reviews are Product, Architecture, QA, Security, and DevOps.
- Final review is rejected automatically when required reviews are missing.
- Agent prompts and comments are sanitized for prompt-injection phrases and provider key leakage.
- Team actions are audited through the VaanForge audit action with team metadata.

## Phase 8: Deployment Agent

Phase 8 adds a guarded deployment agent for preparing, verifying, promoting, monitoring, and rolling back VaanForge-generated applications. The implementation is intentionally conservative: it does not run arbitrary shell scripts, and it only promotes a release record after readiness checks pass and signed admin actions are supplied.

### Deployment Tables

- `agent_deployments`
- `agent_deployment_targets`
- `agent_deployment_checks`
- `agent_deployment_logs`
- `agent_deployment_releases`
- `agent_deployment_rollbacks`
- `agent_deployment_health_checks`

### Deployment APIs

- `GET /api/admin/agent/deployments`
- `POST /api/admin/agent/deployments`
- `GET /api/admin/agent/deployments/:deploymentId`
- `POST /api/admin/agent/deployments/:deploymentId/prepare`
- `POST /api/admin/agent/deployments/:deploymentId/deploy`
- `POST /api/admin/agent/deployments/:deploymentId/verify`
- `POST /api/admin/agent/deployments/:deploymentId/rollback`
- `GET /api/admin/agent/deployments/:deploymentId/logs`
- `GET /api/admin/agent/runs/:runId/deployment`

### Deployment Pages

- `/admin/agent/deployments`
- `/admin/agent/deployments/new`
- `/admin/agent/deployments/:deploymentId`
- `/admin/agent/deployments/:deploymentId/logs`
- `/admin/agent/deployments/:deploymentId/rollback`
- `/admin/agent/runs/:runId/deployment`

### Supported Target Types

- AWS EC2
- S3 + CloudFront
- Docker server
- Vercel
- Future KRAVIA Cloud

### Deployment Workflow Checks

- Status flow: `draft -> preparing -> ready -> deploying -> verifying -> live / failed / rollback_required / rolled_back`.
- Readiness checks cover environment variables, secret masking, database config, build/run status, migrations, storage, domain, and SSL.
- Required environment variables block prepare when missing.
- Production deployments require explicit confirmation.
- Prepare, deploy, verify, and rollback require signed action tokens.
- Logs and target config are masked before storage.
- Health checks are real backend checks: `local://agent-run` validates current run state, and HTTP(S) URLs are fetched with timeout.
- Rollbacks create rollback records and preserve release metadata.
- Deployment actions and failures are audited through the VaanForge audit action with deployment metadata.

## Phase 9: Self-Learning Memory + Knowledge Base Agent

Phase 9 adds a reviewed memory system for storing reusable patterns, verified fixes, architecture lessons, deployment lessons, security rules, and design rules from previous VaanForge work. Memory is never trusted automatically: entries start in review, require source evidence, and only approved trusted entries are promoted into the retrieval-backed knowledge base.

### Memory Tables

- `agent_memory_entries`
- `agent_memory_sources`
- `agent_memory_reviews`
- `agent_knowledge_entries`
- `agent_knowledge_tags`
- `agent_knowledge_retrieval_logs`
- `agent_error_fix_patterns`
- `agent_architecture_patterns`

### Memory APIs

- `GET /api/admin/agent/memory`
- `POST /api/admin/agent/memory`
- `GET /api/admin/agent/memory/review`
- `GET /api/admin/agent/memory/:memoryId`
- `PATCH /api/admin/agent/memory/:memoryId`
- `POST /api/admin/agent/memory/:memoryId/approve`
- `POST /api/admin/agent/memory/:memoryId/reject`
- `POST /api/admin/agent/memory/:memoryId/archive`
- `GET /api/admin/agent/knowledge-base`
- `POST /api/admin/agent/knowledge-base/search`
- `POST /api/admin/agent/knowledge-base/retrieve`

### Memory Pages

- `/admin/agent/memory`
- `/admin/agent/memory/new`
- `/admin/agent/memory/:memoryId`
- `/admin/agent/memory/review`
- `/admin/agent/knowledge-base`
- `/admin/agent/knowledge-base/:entryId`

### Memory Workflow Checks

- New memory entries require source records, confidence score, owner, status, priority, due date, audit logs, activity history, and next action.
- New memory starts as `pending_review` and `untrusted`; retrieval ignores pending, rejected, archived, and untrusted records.
- Approving a trusted memory entry promotes it into `agent_knowledge_entries` with tags and source-backed rationale.
- Error/fix memories create reusable `agent_error_fix_patterns` only after approval.
- Architecture-related memories create `agent_architecture_patterns` only after approval.
- Retrieval records `agent_knowledge_retrieval_logs` and returns why each suggestion was selected.
- Rejected fixes and archived memories are excluded from future retrieval.
- Secret scanning blocks provider keys, tokens, passwords, and private-key material before storage.
- Prompt-injection scanning blocks memory and knowledge text that attempts to override system or developer instructions.
- Memory create, edit, approve, reject, archive, search, and retrieval actions are audited through the VaanForge audit action with memory metadata.

## Phase 10: Customer-Facing Builder Portal

Phase 10 adds an authenticated customer portal for submitting app requirements, selecting approved templates, generating VaanForge blueprints, approving or rejecting plans, monitoring coding progress, reviewing outputs, and creating versioned change requests.

### Builder Tables

- `builder_projects`
- `builder_project_requirements`
- `builder_project_blueprints`
- `builder_project_outputs`
- `builder_project_change_requests`
- `builder_project_activity_logs`

### Builder APIs

- `GET /api/builder/projects`
- `POST /api/builder/projects`
- `GET /api/builder/projects/:projectId`
- `PATCH /api/builder/projects/:projectId`
- `POST /api/builder/projects/:projectId/requirements`
- `GET /api/builder/projects/:projectId/blueprint`
- `POST /api/builder/projects/:projectId/blueprint/approve`
- `POST /api/builder/projects/:projectId/blueprint/reject`
- `GET /api/builder/projects/:projectId/progress`
- `GET /api/builder/projects/:projectId/outputs`
- `POST /api/builder/projects/:projectId/change-requests`

The same routes are mounted under `/api/v1/builder/*`.

### Builder Pages

- `/builder`
- `/builder/projects`
- `/builder/projects/new`
- `/builder/projects/:projectId`
- `/builder/projects/:projectId/requirements`
- `/builder/projects/:projectId/blueprint`
- `/builder/projects/:projectId/progress`
- `/builder/projects/:projectId/outputs`
- `/builder/projects/:projectId/change-requests`

### Builder Workflow Checks

- Customer login uses the existing KRAVIA session cookie and auth middleware.
- Customer project creation creates a real VaanForge Phase 1 run and stores the linked `agentRunId`.
- Requirement submissions store raw customer input separately from normalized VaanForge input.
- Blueprint records are versioned; regenerated requirements supersede older generated blueprints.
- Customer blueprint approval is required before the Coding Execution Agent starts.
- Blueprint approval calls the existing VaanForge execution service and stores the resulting `executionId`.
- Outputs are synced from real blueprint outputs and execution files with status, version, and delivery date.
- Change requests create a builder change record and a new agent task instead of overwriting previous output.
- Customers can only see projects where they are the `customerId`; admins with audit or organization permissions can see all tenant projects.
- Customer actions are audited to `builder_project_activity_logs` and global audit logs.
- Builder inputs are validated for required fields, secret-like content, and prompt-injection phrases before they enter agent context.

## Phase 11: Billing, Plans, Usage Limits, and Credits

Phase 11 adds monetization and usage control for the customer-facing builder portal and internal VaanForge actions. Builder actions now pass through the billing service before paid work begins, with usage limits, credit deductions, failed-run refunds, invoices, subscription records, and Razorpay webhook reconciliation.

### Billing Tables

- `billing_plans`
- `customer_subscriptions`
- `customer_invoices`
- `customer_payments`
- `customer_usage_limits`
- `customer_usage_events`
- `customer_credit_wallets`
- `customer_credit_transactions`
- `razorpay_webhook_events`

### Builder Billing APIs

- `GET /api/builder/billing/plans`
- `POST /api/builder/billing/subscribe`
- `POST /api/builder/billing/cancel`
- `GET /api/builder/billing/invoices`
- `GET /api/builder/billing/usage`
- `GET /api/builder/billing/credits`
- `POST /api/builder/billing/credits/topup`
- `POST /api/webhooks/razorpay`

The same routes are mounted under `/api/v1/builder/billing/*` and `/api/v1/webhooks/razorpay`.

### Admin Billing APIs

- `GET /api/admin/agent/billing/plans`
- `POST /api/admin/agent/billing/plans`
- `PATCH /api/admin/agent/billing/plans/:planId`
- `GET /api/admin/agent/billing/usage`

The same routes are mounted under `/api/v1/admin/agent/billing/*`.

### Billing Pages

- `/builder/billing`
- `/builder/billing/plans`
- `/builder/billing/invoices`
- `/builder/billing/usage`
- `/builder/billing/credits`
- `/admin/agent/billing`
- `/admin/agent/billing/plans`
- `/admin/agent/billing/usage`

### Billing Workflow Checks

- Plans include Free, Creator, Professional, Studio, Business, and Enterprise tiers, with backend-driven prices, usage limits, credits, storage, and deployment allowances.
- Customer subscriptions create invoice and payment records and reset plan usage limits.
- Customer credit wallets are created automatically with plan grants and support top-up transactions.
- Builder project creation consumes `agent_run` usage and credits before creating a VaanForge run.
- Requirement regeneration and change requests consume `regeneration` usage and credits.
- Blueprint approval consumes build usage before the Coding Execution Agent starts.
- Failed blueprint or execution runs refund eligible usage and credits.
- Customers can only read their own invoices, usage, and credit wallet.
- Admin billing routes require `billing:manage`.
- Razorpay webhook requests bypass CSRF only for the webhook path, verify signature in the billing service, and store idempotent webhook events.
- Billing actions are audited with `BILLING_ACTION`; builder paid actions continue to audit through VaanForge/builder activity logs.

## Phase 12: Public Launch + Enterprise Hardening

Phase 12 adds the launch hardening layer for real customer usage, enterprise review, security evidence, reliability evidence, compliance tracking, support readiness, and public launch gating.

### Enterprise Tables

- `workspaces`
- `workspace_members`
- `workspace_invites`
- `workspace_roles`
- `workspace_audit_logs`
- `security_events`
- `reliability_checks`
- `compliance_records`
- `data_export_requests`
- `data_delete_requests`
- `launch_readiness_checks`
- `support_tickets` already exists in the support module and remains the source for support ticket workflows.

### Public and Builder APIs

- `GET /api/public/pricing`
- `GET /api/builder/workspace`
- `PATCH /api/builder/workspace`
- `GET /api/builder/team`
- `POST /api/builder/team/invite`
- `PATCH /api/builder/team/:memberId`
- `DELETE /api/builder/team/:memberId`
- `GET /api/builder/security/audit-logs`
- `GET /api/builder/usage/reports`
- `POST /api/builder/data/export`
- `POST /api/builder/data/delete-request`

The same routes are mounted under `/api/v1/public/*` and `/api/v1/builder/*`.

### Admin Launch APIs

- `GET /api/admin/agent/security/report`
- `GET /api/admin/agent/reliability/report`
- `GET /api/admin/agent/compliance/report`
- `GET /api/admin/agent/launch-readiness`

The same routes are mounted under `/api/v1/admin/agent/*`.

### Launch Pages

- `/`
- `/pricing`
- `/docs`
- `/help`
- `/builder/onboarding`
- `/builder/settings/workspace`
- `/builder/settings/team`
- `/builder/settings/security`
- `/builder/settings/data`
- `/admin/agent/enterprise`
- `/admin/agent/security`
- `/admin/agent/reliability`
- `/admin/agent/compliance`
- `/admin/agent/launch-readiness`

### Launch Workflow Checks

- Public pricing exposes plan and usage data only, never provider secrets.
- Builder workspace, team, audit, usage, export, and delete routes require authenticated tenant context.
- Team invites, member changes, workspace settings, export requests, and delete requests are audited.
- Security reports include evidence for RBAC, tenant isolation, audit logs, secret masking, prompt injection controls, and webhook signature verification.
- Reliability reports include evidence for health checks, queue monitoring, rollback records, and durable backup posture.
- Compliance reports include privacy, terms, retention, billing, export, and delete evidence.
- Launch readiness refuses production launch unless security, reliability, billing, deployment, compliance, and support checks pass.
- Public launch pages expose only safe product, pricing, docs, and help information.

## Phase 15: KRAVIA App Marketplace

Phase 15 adds a reviewed app marketplace for KRAVIA developers, partners, and internal teams. Storefront listings are database-driven and appear only after immutable app versions pass security, code scan, permission, and manual review gates.

### Marketplace Tables

- `marketplace_apps`
- `marketplace_app_versions`
- `marketplace_publishers`
- `marketplace_reviews`
- `marketplace_installs`
- `marketplace_permissions`
- `marketplace_pricing`
- `marketplace_payouts`

### Marketplace APIs

- `GET /api/marketplace/apps`
- `GET /api/marketplace/apps/:appId`
- `GET /api/developers/publisher`
- `POST /api/developers/publisher`
- `GET /api/developers/publisher/apps`
- `POST /api/developers/publisher/apps`
- `POST /api/developers/publisher/apps/:appId/submit`
- `POST /api/developers/publisher/apps/:appId/versions`
- `GET /api/developers/publisher/payouts`
- `GET /api/admin/marketplace/reviews`
- `POST /api/admin/marketplace/reviews/:reviewId/decision`
- `GET /api/builder/workspace/apps`
- `POST /api/builder/workspace/apps/:appId/install`
- `POST /api/builder/workspace/apps/:appId/uninstall`
- `POST /api/builder/workspace/apps/:appId/update`
- `POST /api/builder/workspace/apps/:appId/rollback`

The same routes are mounted under `/api/v1/*`.

### Marketplace Pages

- `/marketplace`
- `/marketplace/apps/:appId`
- `/developers/publisher`
- `/developers/publisher/apps`
- `/developers/publisher/apps/new`
- `/admin/marketplace/reviews`
- `/builder/workspace/apps`

### Marketplace Workflow Checks

- The storefront returns only reviewed and published apps.
- Publisher submissions create immutable version snapshots.
- Every app defines requested permissions and pricing metadata before review.
- Publishing requires all review gates to approve; rejected reviews keep the app unavailable for install.
- Workspace installs require explicit permission consent.
- Paid installs consume billing usage and accrue payout metadata.
- Updates and rollbacks preserve previous installed versions instead of overwriting them.
- Publisher create, app create, submit, review decision, install, uninstall, update, and rollback actions are audited.
- Marketplace input is scanned for secrets and prompt-injection phrases before storage.
