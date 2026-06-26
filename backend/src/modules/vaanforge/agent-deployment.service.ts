import { createHmac } from "node:crypto";
import { z } from "zod";
import { env } from "../../config/env";
import { createId, store, type StoredAgentDeployment, type StoredAgentDeploymentCheck, type StoredAgentDeploymentStatus } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";
import { agentAdminService } from "./agent-admin.service";

const targetTypes = ["AWS_EC2", "S3_CLOUDFRONT", "DOCKER_SERVER", "VERCEL", "VMNEXUS_CLOUD"] as const;

export const deploymentCreateSchema = z.object({
  runId: z.string().min(2),
  targetType: z.enum(targetTypes),
  targetName: z.string().min(2),
  environment: z.enum(["staging", "production"]).default("staging"),
  ownerId: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
  dueDate: z.string().optional(),
  requiredEnvVars: z.array(z.string()).default([]),
  config: z.record(z.unknown()).default({}),
  confirmedProduction: z.boolean().default(false)
});

export const deploymentActionSchema = z.object({
  signature: z.string().min(8),
  reason: z.string().optional(),
  confirmedProduction: z.boolean().optional()
});

export class AgentDeploymentService {
  async list(organizationId: string) {
    return store.agentDeployments.filter((item) => item.organizationId === organizationId).map((deployment) => this.withDetail(deployment));
  }

  async create(organizationId: string, actorId: string, input: z.infer<typeof deploymentCreateSchema>) {
    const parsed = deploymentCreateSchema.parse(input);
    if (parsed.environment === "production" && !parsed.confirmedProduction) throw new Error("Production deployment requires confirmation.");
    const run = await agentAdminService.detail(organizationId, parsed.runId);
    if (!run) throw new Error("Agent run not found.");
    const now = new Date().toISOString();
    const deploymentId = createId("deploy");
    const targetId = createId("target");
    const releaseId = createId("release");
    const deployment: StoredAgentDeployment = {
      id: createId("adp"),
      deploymentId,
      runId: parsed.runId,
      organizationId,
      ownerId: parsed.ownerId,
      status: "draft",
      targetId,
      releaseId,
      environment: parsed.environment,
      priority: parsed.priority,
      dueDate: parsed.dueDate || nextWeek(),
      confirmedProduction: parsed.confirmedProduction,
      nextAction: "Run deployment readiness checks.",
      activityHistory: [{ at: now, status: "draft", message: "Deployment draft created." }],
      createdAt: now,
      updatedAt: now
    };
    store.agentDeployments.push(deployment);
    store.agentDeploymentTargets.push({ id: createId("adt"), targetId, deploymentId, organizationId, targetType: parsed.targetType, name: parsed.targetName, config: maskRecord(parsed.config), requiredEnvVars: parsed.requiredEnvVars, createdAt: now, updatedAt: now });
    this.release(organizationId, deploymentId, releaseId, "0.1.0", "initial", "pending", "pending");
    this.log(organizationId, deploymentId, "info", "Deployment draft created.", { targetType: parsed.targetType, environment: parsed.environment });
    this.audit(organizationId, actorId, "DEPLOYMENT_CREATED", deploymentId);
    return this.withDetail(deployment);
  }

  async detail(organizationId: string, deploymentId: string) {
    const deployment = this.find(organizationId, deploymentId);
    return deployment ? this.withDetail(deployment) : undefined;
  }

  async runDeploymentForRun(organizationId: string, runId: string) {
    return store.agentDeployments.filter((item) => item.organizationId === organizationId && item.runId === runId).map((deployment) => this.withDetail(deployment));
  }

  async prepare(organizationId: string, actorId: string, deploymentId: string, signature: string) {
    this.verifySignature(actorId, deploymentId, "prepare", signature);
    const deployment = this.requireDeployment(organizationId, deploymentId);
    this.transition(deployment, "preparing", "Run final validation and readiness checks.");
    const checks = await this.readiness(deployment);
    const failed = checks.filter((check) => check.status !== "passed");
    if (failed.length) {
      deployment.status = "failed";
      deployment.errorMessage = failed.map((check) => check.reason || check.checkName).join("; ");
      deployment.nextAction = "Fix failed readiness checks before deployment.";
      this.log(organizationId, deploymentId, "error", "Readiness checks failed.", { failed: failed.map((check) => check.checkName) });
      this.audit(organizationId, actorId, "DEPLOYMENT_PREPARE_FAILED", deploymentId, { failed: failed.map((check) => check.checkName) });
      return this.withDetail(deployment);
    }
    const currentRelease = this.currentRelease(organizationId, deploymentId);
    if (currentRelease) {
      currentRelease.migrationStatus = "applied";
      currentRelease.buildStatus = "passed";
    }
    this.transition(deployment, "ready", "Deploy release to target after production confirmation.");
    this.log(organizationId, deploymentId, "info", "Deployment is ready.", { releaseId: deployment.releaseId });
    this.audit(organizationId, actorId, "DEPLOYMENT_PREPARED", deploymentId);
    return this.withDetail(deployment);
  }

  async deploy(organizationId: string, actorId: string, deploymentId: string, input: z.infer<typeof deploymentActionSchema>) {
    this.verifySignature(actorId, deploymentId, "deploy", input.signature);
    const deployment = this.requireDeployment(organizationId, deploymentId);
    if (deployment.environment === "production" && !(deployment.confirmedProduction || input.confirmedProduction)) throw new Error("Production deployment requires confirmation.");
    const checks = store.agentDeploymentChecks.filter((check) => check.organizationId === organizationId && check.deploymentId === deploymentId);
    if (deployment.status !== "ready" || checks.some((check) => check.status !== "passed")) throw new Error("Deployment cannot start until readiness checks pass.");
    this.transition(deployment, "deploying", "Promote prepared release to deployment target.");
    this.log(organizationId, deploymentId, "info", "Release promoted to target.", { releaseId: deployment.releaseId, targetId: deployment.targetId });
    this.transition(deployment, "verifying", "Run health checks before marking live.");
    this.audit(organizationId, actorId, "DEPLOYMENT_STARTED", deploymentId);
    return this.withDetail(deployment);
  }

  async verify(organizationId: string, actorId: string, deploymentId: string, signature: string) {
    this.verifySignature(actorId, deploymentId, "verify", signature);
    const deployment = this.requireDeployment(organizationId, deploymentId);
    const health = await this.health(deployment);
    if (health.status === "unhealthy") {
      deployment.status = "rollback_required";
      deployment.errorMessage = health.reason;
      deployment.nextAction = "Rollback or fix health check failure.";
      this.log(organizationId, deploymentId, "error", "Health check failed.", { reason: health.reason });
      this.audit(organizationId, actorId, "DEPLOYMENT_VERIFY_FAILED", deploymentId, { reason: health.reason });
      return this.withDetail(deployment);
    }
    this.transition(deployment, "live", "Monitor deployment health and logs.");
    this.log(organizationId, deploymentId, "info", "Deployment verified live.", { healthCheckId: health.healthCheckId });
    this.audit(organizationId, actorId, "DEPLOYMENT_VERIFIED", deploymentId);
    return this.withDetail(deployment);
  }

  async rollback(organizationId: string, actorId: string, deploymentId: string, input: z.infer<typeof deploymentActionSchema>) {
    this.verifySignature(actorId, deploymentId, "rollback", input.signature);
    const deployment = this.requireDeployment(organizationId, deploymentId);
    const current = this.currentRelease(organizationId, deploymentId);
    const previous = store.agentDeploymentReleases.filter((release) => release.organizationId === organizationId && release.deploymentId === deploymentId && release.releaseId !== current?.releaseId).at(-1);
    const rollback = { id: createId("adr"), rollbackId: createId("rollback"), deploymentId, organizationId, fromReleaseId: current?.releaseId || deployment.releaseId, toReleaseId: previous?.releaseId, status: "completed" as const, reason: input.reason || "Manual rollback requested.", evidence: { previousRelease: previous?.releaseId, safeDatabaseRollback: Boolean(previous) }, createdAt: new Date().toISOString() };
    store.agentDeploymentRollbacks.push(rollback);
    deployment.releaseId = previous?.releaseId || deployment.releaseId;
    this.transition(deployment, "rolled_back", "Verify rollback health and prepare a follow-up release.");
    this.log(organizationId, deploymentId, "warning", "Deployment rolled back.", { rollbackId: rollback.rollbackId, toReleaseId: rollback.toReleaseId });
    this.audit(organizationId, actorId, "DEPLOYMENT_ROLLED_BACK", deploymentId, { rollbackId: rollback.rollbackId });
    return this.withDetail(deployment);
  }

  logs(organizationId: string, deploymentId: string) {
    return store.agentDeploymentLogs.filter((log) => log.organizationId === organizationId && log.deploymentId === deploymentId);
  }

  signature(actorId: string, deploymentId: string, action: string) {
    return createHmac("sha256", env.jwtSecret).update(`${actorId}:${deploymentId}:${action}`).digest("hex");
  }

  private async readiness(deployment: StoredAgentDeployment) {
    store.agentDeploymentChecks = store.agentDeploymentChecks.filter((check) => check.deploymentId !== deployment.deploymentId);
    const target = this.target(deployment);
    const run = await agentAdminService.detail(deployment.organizationId, deployment.runId);
    const requiredEnv = target.requiredEnvVars.filter((key) => !process.env[key]);
    const config = target.config;
    const checks = [
      gate("environment_variables", !requiredEnv.length, requiredEnv.length ? `Missing env vars: ${requiredEnv.join(", ")}` : undefined, { missing: requiredEnv }, "Set required environment variables."),
      gate("secrets", !JSON.stringify(config).toLowerCase().includes("secret"), "Target config is secret-masked.", { targetId: target.targetId }, "Remove raw secrets from deployment config."),
      gate("database_connection", Boolean(config.databaseUrl || process.env.DATABASE_URL || target.targetType === "S3_CLOUDFRONT"), undefined, { hasDatabaseConfig: true }, "Configure DATABASE_URL or target databaseUrl."),
      gate("build_status", Boolean(run && ["completed", "planned"].includes(run.status)), run ? undefined : "Run not found.", { runStatus: run?.status }, "Complete blueprint/execution validation before deploy."),
      gate("migration_status", Boolean(config.migrationsApplied || config.migrationCommand === "prisma-migrate-deploy"), undefined, { migrationMode: config.migrationCommand || "none" }, "Run or configure migration deployment."),
      gate("storage_config", Boolean(config.storageBucket || target.targetType === "DOCKER_SERVER" || target.targetType === "AWS_EC2" || target.targetType === "VERCEL" || target.targetType === "VMNEXUS_CLOUD"), undefined, { targetType: target.targetType }, "Configure storage bucket or server target."),
      gate("domain_config", Boolean(config.domain || deployment.environment === "staging"), undefined, { domain: config.domain || "staging" }, "Configure production domain."),
      gate("ssl_readiness", Boolean(config.sslReady || deployment.environment === "staging"), undefined, { sslReady: Boolean(config.sslReady) }, "Enable SSL before production deploy.")
    ];
    const stored = checks.map((check) => ({ id: createId("adc"), checkId: createId("check"), deploymentId: deployment.deploymentId, organizationId: deployment.organizationId, ...check, createdAt: new Date().toISOString() }));
    store.agentDeploymentChecks.push(...stored);
    return stored;
  }

  private async health(deployment: StoredAgentDeployment) {
    const target = this.target(deployment);
    const started = Date.now();
    const url = String(target.config.healthCheckUrl || "local://agent-run");
    let status: "healthy" | "unhealthy" = "unhealthy";
    let statusCode: number | undefined;
    let reason: string | undefined;
    if (url === "local://agent-run") {
      const run = await agentAdminService.detail(deployment.organizationId, deployment.runId);
      status = run && !["failed", "blocked"].includes(run.status) ? "healthy" : "unhealthy";
      statusCode = status === "healthy" ? 200 : 503;
      reason = status === "healthy" ? undefined : "Agent run is failed or blocked.";
    } else if (/^https?:\/\//.test(url)) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
        statusCode = response.status;
        status = response.ok ? "healthy" : "unhealthy";
        reason = response.ok ? undefined : `Health endpoint returned ${response.status}`;
      } catch (error) {
        reason = error instanceof Error ? error.message : "Health endpoint failed.";
      }
    } else {
      reason = "Unsupported health check URL.";
    }
    const item = { id: createId("adh"), healthCheckId: createId("health"), deploymentId: deployment.deploymentId, organizationId: deployment.organizationId, url, status, statusCode, responseTimeMs: Date.now() - started, reason, createdAt: new Date().toISOString() };
    store.agentDeploymentHealthChecks.push(item);
    return item;
  }

  private withDetail(deployment: StoredAgentDeployment) {
    return { ...deployment, target: this.target(deployment), checks: store.agentDeploymentChecks.filter((item) => item.deploymentId === deployment.deploymentId), logs: this.logs(deployment.organizationId, deployment.deploymentId), releases: store.agentDeploymentReleases.filter((item) => item.deploymentId === deployment.deploymentId), rollbacks: store.agentDeploymentRollbacks.filter((item) => item.deploymentId === deployment.deploymentId), healthChecks: store.agentDeploymentHealthChecks.filter((item) => item.deploymentId === deployment.deploymentId) };
  }

  private find(organizationId: string, deploymentId: string) {
    return store.agentDeployments.find((item) => item.organizationId === organizationId && item.deploymentId === deploymentId);
  }

  private requireDeployment(organizationId: string, deploymentId: string) {
    const deployment = this.find(organizationId, deploymentId);
    if (!deployment) throw new Error("Deployment not found.");
    return deployment;
  }

  private target(deployment: StoredAgentDeployment) {
    const target = store.agentDeploymentTargets.find((item) => item.organizationId === deployment.organizationId && item.targetId === deployment.targetId);
    if (!target) throw new Error("Deployment target not found.");
    return target;
  }

  private currentRelease(organizationId: string, deploymentId: string) {
    return store.agentDeploymentReleases.find((item) => item.organizationId === organizationId && item.deploymentId === deploymentId && store.agentDeployments.find((deployment) => deployment.deploymentId === deploymentId)?.releaseId === item.releaseId);
  }

  private release(organizationId: string, deploymentId: string, releaseId: string, version: string, artifactVersion: string, migrationStatus: "pending" | "applied" | "failed", buildStatus: "pending" | "passed" | "failed") {
    store.agentDeploymentReleases.push({ id: createId("adl"), releaseId, deploymentId, organizationId, version, artifactVersion, migrationStatus, buildStatus, rollbackMetadata: { previousBuildStored: true, databaseRollback: "requires migration review" }, createdAt: new Date().toISOString() });
  }

  private transition(deployment: StoredAgentDeployment, status: StoredAgentDeploymentStatus, nextAction: string) {
    deployment.status = status;
    deployment.nextAction = nextAction;
    deployment.updatedAt = new Date().toISOString();
    deployment.activityHistory.push({ at: deployment.updatedAt, status, message: nextAction });
  }

  private log(organizationId: string, deploymentId: string, level: "info" | "warning" | "error", message: string, evidence?: Record<string, unknown>) {
    store.agentDeploymentLogs.push({ id: createId("adlog"), logId: createId("log"), deploymentId, organizationId, level, message: maskText(message), evidence: evidence ? maskRecord(evidence) : undefined, createdAt: new Date().toISOString() });
  }

  private verifySignature(actorId: string, deploymentId: string, action: string, signature: string) {
    if (signature !== this.signature(actorId, deploymentId, action)) throw new Error("Invalid deployment action signature.");
  }

  private audit(organizationId: string, actorId: string, action: string, deploymentId: string, metadata?: Record<string, unknown>) {
    auditService.record({ actorId, organizationId, action: "VAANFORGE_AGENT_RUN", entityType: "AgentDeployment", entityId: deploymentId, metadata: { deploymentAction: action, ...metadata } });
  }
}

function gate(checkName: string, condition: boolean, reason: string | undefined, evidence: Record<string, unknown>, nextAction: string): Omit<StoredAgentDeploymentCheck, "id" | "checkId" | "deploymentId" | "organizationId" | "createdAt"> {
  return { checkName, status: condition ? "passed" : "failed", reason: condition ? undefined : reason || nextAction, evidence: maskRecord(evidence), nextAction: condition ? "Passed." : nextAction };
}

function maskRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /secret|token|password|key/i.test(key) ? "[masked]" : typeof item === "string" ? maskText(item) : item]));
}

function maskText(value: string) {
  return value.replace(/(secret|token|password|api[_-]?key)=?[^,\s]*/gi, "$1=[masked]").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

function nextWeek() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

export const agentDeploymentService = new AgentDeploymentService();
