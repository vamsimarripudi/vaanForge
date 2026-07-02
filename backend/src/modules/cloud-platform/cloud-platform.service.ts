import { cpus } from "node:os";
import { z } from "zod";
import {
  createId,
  store,
  type StoredCloudComponentType,
  type StoredCloudConfiguration,
  type StoredCloudEvent,
  type StoredCloudJob,
  type StoredCloudMessage,
  type StoredCloudSecret,
  type StoredCloudService,
  type StoredCloudStorageObject
} from "../../database/in-memory-store";

type Actor = { organizationId: string; userId: string; role: string };

const componentTypes = [
  "identity",
  "gateway",
  "service_registry",
  "event_bus",
  "storage",
  "secrets",
  "configuration",
  "messaging",
  "ai_runtime",
  "build",
  "deploy",
  "monitoring",
  "observability",
  "billing",
  "console"
] as const;

export const serviceRegistrationSchema = z.object({
  name: z.string().min(2),
  version: z.string().min(1),
  componentType: z.enum(componentTypes),
  dependencies: z.array(z.string()).default([]),
  region: z.string().min(2).default("ap-south-1"),
  environment: z.string().min(2).default("production"),
  ownerId: z.string().min(2),
  endpoint: z.string().min(1)
});

export const eventPublishSchema = z.object({
  topic: z.string().min(3),
  producerServiceId: z.string().min(2),
  consumerServiceId: z.string().optional(),
  payload: z.record(z.unknown()).default({})
});

export const storageObjectSchema = z.object({
  workspaceId: z.string().optional(),
  bucket: z.string().min(2),
  key: z.string().min(3),
  objectType: z.enum(["object", "image", "video", "artifact", "upload"]),
  sizeBytes: z.number().int().min(1),
  contentType: z.string().min(3),
  lifecyclePolicy: z.string().min(3).default("retain-365-days"),
  cdnUrl: z.string().url().optional()
});

export const secretSchema = z.object({
  name: z.string().min(2),
  category: z.enum(["api_key", "jwt_secret", "oauth_secret", "database", "smtp", "cloud"]),
  rotationDays: z.number().int().min(1).max(365).default(90)
});

export const configSchema = z.object({
  key: z.string().min(2),
  scope: z.enum(["environment", "feature_flag", "tenant", "runtime"]),
  value: z.record(z.unknown()),
  environment: z.string().min(2).default("production")
});

export const messageSchema = z.object({
  channel: z.enum(["email", "sms", "whatsapp", "push", "in_app", "webhook"]),
  recipient: z.string().min(3),
  provider: z.string().min(2).default("kravia-messaging")
});

export const jobSchema = z.object({
  jobType: z.enum(["ai_run", "build", "deploy", "health_check"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("HIGH"),
  dueDate: z.string().optional(),
  artifactId: z.string().optional(),
  releaseId: z.string().optional()
});

export const controlActionSchema = z.object({
  action: z.enum(["rotate_secret", "replay_event", "disable_service", "enable_service", "retry_job"]),
  entityId: z.string().min(2),
  reason: z.string().min(8)
});

export class CloudPlatformService {
  console(actor: Actor) {
    this.ensureBaseline(actor);
    const services = this.services(actor);
    const jobs = this.jobs(actor);
    const metrics = this.monitor(actor);
    return {
      product: "KRAVIA Cloud Platform",
      parentCompany: "KRAVIA PRIVATE LIMITED",
      status: services.some((service) => service.health !== "healthy") ? "degraded" : "healthy",
      modules: componentTypes.map((componentType) => ({
        componentType,
        services: services.filter((service) => service.componentType === componentType).length,
        openJobs: jobs.filter((job) => job.jobType === componentToJob(componentType) && ["queued", "running", "blocked"].includes(job.status)).length
      })),
      identity: this.identity(actor),
      gateway: this.gateway(actor),
      serviceRegistry: services,
      eventBus: this.events(actor).summary,
      storage: this.storage(actor).summary,
      secrets: this.secrets(actor).summary,
      configuration: this.configurations(actor).summary,
      messaging: this.messages(actor).summary,
      aiRuntime: this.ai(actor),
      build: this.build(actor),
      deploy: this.deploy(actor),
      monitoring: metrics,
      observability: this.observability(actor),
      billing: this.billing(actor),
      nextAction: "Review degraded services, blocked jobs, secret rotation due dates, and event DLQ before scaling workloads."
    };
  }

  identity(actor: Actor) {
    return {
      ssoReady: true,
      oidcReady: true,
      mfaReady: true,
      organizations: store.organizations.filter((item) => item.id === actor.organizationId).length,
      workspaces: store.workspaces.filter((item) => item.organizationId === actor.organizationId).length + store.enterpriseWorkspaces.filter((item) => item.organizationId === actor.organizationId).length,
      users: store.users.filter((item) => item.organizationId === actor.organizationId).map((user) => ({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt })),
      teams: store.workspaceMembers.filter((item) => item.organizationId === actor.organizationId).length,
      roles: store.workspaceRoles.filter((item) => item.organizationId === actor.organizationId).length,
      permissions: ["organization:manage", "workspace:create", "billing:manage", "settings:manage", "audit:read"],
      sessions: "cookie-session-managed",
      devices: store.securityEvents.filter((item) => item.organizationId === actor.organizationId && item.category === "device").length,
      loginHistory: store.securityEvents.filter((item) => item.organizationId === actor.organizationId && item.category.includes("login")).slice(-20)
    };
  }

  gateway(actor: Actor) {
    const usage = store.apiUsageLogs.filter((item) => item.organizationId === actor.organizationId);
    const keys = store.apiKeys.filter((item) => item.organizationId === actor.organizationId && item.status === "active");
    return {
      apiFirst: true,
      versioning: ["v1"],
      apiKeys: keys.length,
      jwtValidation: true,
      rateLimits: store.apiRateLimits.filter((item) => item.organizationId === actor.organizationId),
      requestValidation: "zod-contracts",
      responseNormalization: "data-envelope",
      analytics: {
        requests: usage.length,
        failures: usage.filter((item) => item.statusCode >= 400).length,
        averageLatencyMs: usage.length ? Math.round(usage.reduce((sum, item) => sum + item.latencyMs, 0) / usage.length) : 0
      },
      serviceDiscovery: this.services(actor).map((service) => ({ name: service.name, endpoint: service.endpoint, health: service.health }))
    };
  }

  services(actor: Actor) {
    this.ensureBaseline(actor);
    return store.cloudServices.filter((service) => service.organizationId === actor.organizationId);
  }

  registerService(actor: Actor, input: z.infer<typeof serviceRegistrationSchema>) {
    const parsed = serviceRegistrationSchema.parse(input);
    const now = new Date().toISOString();
    const existing = store.cloudServices.find((service) => service.organizationId === actor.organizationId && service.name === parsed.name && service.environment === parsed.environment);
    if (existing) {
      Object.assign(existing, { ...parsed, health: "healthy", lastHeartbeatAt: now, updatedAt: now });
      this.audit(actor, "SERVICE_HEARTBEAT", "CloudService", existing.serviceId, `Heartbeat from ${parsed.name}.`, { version: parsed.version });
      return existing;
    }
    const service: StoredCloudService = {
      id: createId("cloud_service"),
      serviceId: createId("svc"),
      organizationId: actor.organizationId,
      health: "healthy",
      lastHeartbeatAt: now,
      createdAt: now,
      updatedAt: now,
      ...parsed
    };
    store.cloudServices.push(service);
    this.audit(actor, "SERVICE_REGISTERED", "CloudService", service.serviceId, `Registered ${service.name}.`, parsed);
    return service;
  }

  events(actor: Actor) {
    const events = store.cloudEvents.filter((event) => event.organizationId === actor.organizationId);
    return {
      summary: {
        published: events.filter((event) => event.status === "published").length,
        delivered: events.filter((event) => event.status === "delivered").length,
        retrying: events.filter((event) => event.status === "retrying").length,
        deadLetter: events.filter((event) => event.status === "dead_lettered").length,
        traced: new Set(events.map((event) => event.traceId)).size
      },
      events
    };
  }

  publishEvent(actor: Actor, input: z.infer<typeof eventPublishSchema>) {
    const parsed = eventPublishSchema.parse(input);
    const now = new Date().toISOString();
    const event: StoredCloudEvent = {
      id: createId("cloud_event"),
      eventId: createId("evt"),
      organizationId: actor.organizationId,
      status: "published",
      attempts: 1,
      traceId: createId("trace"),
      nextAction: "Deliver event to subscribed services or retry with DLQ policy.",
      createdAt: now,
      updatedAt: now,
      ...parsed
    };
    store.cloudEvents.push(event);
    this.audit(actor, "EVENT_PUBLISHED", "CloudEvent", event.eventId, `Published ${event.topic}.`, { traceId: event.traceId });
    return event;
  }

  storage(actor: Actor) {
    const objects = store.cloudStorageObjects.filter((object) => object.organizationId === actor.organizationId);
    return {
      summary: {
        objects: objects.length,
        encrypted: objects.filter((object) => object.encrypted).length,
        versions: objects.reduce((sum, object) => sum + object.version, 0),
        totalBytes: objects.reduce((sum, object) => sum + object.sizeBytes, 0),
        cdnEnabled: objects.filter((object) => object.cdnUrl).length
      },
      objects
    };
  }

  createStorageObject(actor: Actor, input: z.infer<typeof storageObjectSchema>) {
    const parsed = storageObjectSchema.parse(input);
    const now = new Date().toISOString();
    const object: StoredCloudStorageObject = {
      id: createId("cloud_object"),
      objectId: createId("obj"),
      organizationId: actor.organizationId,
      encrypted: true,
      version: 1,
      ownerId: actor.userId,
      createdAt: now,
      updatedAt: now,
      ...parsed
    };
    store.cloudStorageObjects.push(object);
    this.audit(actor, "STORAGE_OBJECT_CREATED", "CloudStorageObject", object.objectId, `Tracked ${object.key}.`, { bucket: object.bucket });
    return object;
  }

  secrets(actor: Actor) {
    const secrets = store.cloudSecrets.filter((secret) => secret.organizationId === actor.organizationId);
    return {
      summary: {
        total: secrets.length,
        active: secrets.filter((secret) => secret.status === "active").length,
        rotating: secrets.filter((secret) => secret.status === "rotating").length,
        dueForRotation: secrets.filter((secret) => new Date(secret.rotationDueAt).getTime() < Date.now()).length
      },
      secrets: secrets.map((secret) => ({ ...secret, name: maskSecretName(secret.name) }))
    };
  }

  createSecret(actor: Actor, input: z.infer<typeof secretSchema>) {
    const parsed = secretSchema.parse(input);
    const now = new Date().toISOString();
    const secret: StoredCloudSecret = {
      id: createId("cloud_secret"),
      secretId: createId("secret"),
      organizationId: actor.organizationId,
      version: 1,
      status: "active",
      rotationDueAt: inDays(parsed.rotationDays),
      ownerId: actor.userId,
      createdAt: now,
      updatedAt: now,
      name: parsed.name,
      category: parsed.category
    };
    store.cloudSecrets.push(secret);
    this.audit(actor, "SECRET_CREATED", "CloudSecret", secret.secretId, "Created masked secret metadata.", { category: secret.category });
    return { ...secret, name: maskSecretName(secret.name) };
  }

  configurations(actor: Actor) {
    const configs = store.cloudConfigurations.filter((config) => config.organizationId === actor.organizationId);
    return {
      summary: {
        total: configs.length,
        active: configs.filter((config) => config.status === "active").length,
        featureFlags: configs.filter((config) => config.scope === "feature_flag").length,
        runtime: configs.filter((config) => config.scope === "runtime").length
      },
      configurations: configs
    };
  }

  setConfiguration(actor: Actor, input: z.infer<typeof configSchema>) {
    const parsed = configSchema.parse(input);
    const now = new Date().toISOString();
    const config: StoredCloudConfiguration = {
      id: createId("cloud_config"),
      configId: createId("cfg"),
      organizationId: actor.organizationId,
      status: "active",
      ownerId: actor.userId,
      createdAt: now,
      updatedAt: now,
      ...parsed
    };
    store.cloudConfigurations.push(config);
    this.audit(actor, "CONFIGURATION_SET", "CloudConfiguration", config.configId, `Set ${config.key}.`, { scope: config.scope });
    return config;
  }

  messages(actor: Actor) {
    const messages = store.cloudMessages.filter((message) => message.organizationId === actor.organizationId);
    return {
      summary: {
        queued: messages.filter((message) => message.status === "queued").length,
        sent: messages.filter((message) => message.status === "sent").length,
        failed: messages.filter((message) => message.status === "failed").length,
        channels: [...new Set(messages.map((message) => message.channel))]
      },
      messages
    };
  }

  queueMessage(actor: Actor, input: z.infer<typeof messageSchema>) {
    const parsed = messageSchema.parse(input);
    const now = new Date().toISOString();
    const message: StoredCloudMessage = {
      id: createId("cloud_message"),
      messageId: createId("msg"),
      organizationId: actor.organizationId,
      status: "queued",
      traceId: createId("trace"),
      nextAction: "Send through configured provider and update delivery status.",
      createdAt: now,
      updatedAt: now,
      ...parsed
    };
    store.cloudMessages.push(message);
    this.audit(actor, "MESSAGE_QUEUED", "CloudMessage", message.messageId, `Queued ${message.channel} message.`, { traceId: message.traceId });
    return message;
  }

  jobs(actor: Actor) {
    return store.cloudJobs.filter((job) => job.organizationId === actor.organizationId);
  }

  createJob(actor: Actor, input: z.infer<typeof jobSchema>) {
    const parsed = jobSchema.parse(input);
    const now = new Date().toISOString();
    const job: StoredCloudJob = {
      id: createId("cloud_job"),
      jobId: createId("job"),
      organizationId: actor.organizationId,
      status: "queued",
      ownerId: actor.userId,
      dueDate: parsed.dueDate || inDays(7),
      validationEvidence: { queuedBy: actor.userId, zeroTrust: true, tenantIsolation: actor.organizationId },
      nextAction: "Assign worker and run validation gates before completion.",
      activityHistory: [{ at: now, status: "queued", message: "Cloud platform job queued." }],
      createdAt: now,
      updatedAt: now,
      ...parsed
    };
    store.cloudJobs.push(job);
    this.audit(actor, "CLOUD_JOB_CREATED", "CloudJob", job.jobId, `Created ${job.jobType} job.`, { priority: job.priority });
    return job;
  }

  ai(actor: Actor) {
    return {
      jobs: this.jobs(actor).filter((job) => job.jobType === "ai_run"),
      agentRuns: store.vaanForgeRuns.filter((run) => run.organizationId === actor.organizationId).length,
      memoryEntries: store.agentMemoryEntries.filter((entry) => entry.organizationId === actor.organizationId).length,
      promptProtection: "prompt-injection-scanning-enabled",
      modelRouting: "provider-abstraction-layer"
    };
  }

  build(actor: Actor) {
    return {
      jobs: this.jobs(actor).filter((job) => job.jobType === "build"),
      buildQueues: store.agentTasks.filter((task) => task.organizationId === actor.organizationId && task.status !== "completed").length,
      artifacts: store.agentFiles.filter((file) => file.organizationId === actor.organizationId).length,
      cache: "artifact-keyed-cache-ready",
      parallelBuilds: cpus().length
    };
  }

  deploy(actor: Actor) {
    return {
      jobs: this.jobs(actor).filter((job) => job.jobType === "deploy"),
      deployments: store.agentDeployments.filter((deployment) => deployment.organizationId === actor.organizationId),
      strategies: ["blue_green", "canary", "rollback"],
      healthChecks: store.agentDeploymentHealthChecks.filter((check) => check.organizationId === actor.organizationId).length,
      releaseHistory: store.agentDeploymentReleases.filter((release) => release.organizationId === actor.organizationId).length
    };
  }

  monitor(actor: Actor) {
    const memory = process.memoryUsage();
    const metrics = [
      this.metric(actor, "monitoring", "cpu_cores", cpus().length, "count"),
      this.metric(actor, "monitoring", "memory_heap_used", memory.heapUsed, "bytes"),
      this.metric(actor, "monitoring", "api_latency", this.gateway(actor).analytics.averageLatencyMs, "ms"),
      this.metric(actor, "build", "queued_build_jobs", this.jobs(actor).filter((job) => job.jobType === "build" && job.status === "queued").length, "count"),
      this.metric(actor, "ai_runtime", "agent_runs", store.vaanForgeRuns.filter((run) => run.organizationId === actor.organizationId).length, "count"),
      this.metric(actor, "deploy", "deployments", store.agentDeployments.filter((deployment) => deployment.organizationId === actor.organizationId).length, "count")
    ];
    store.cloudMetrics.push(...metrics);
    return metrics;
  }

  observability(actor: Actor) {
    return {
      structuredLogs: store.cloudAuditLogs.filter((log) => log.organizationId === actor.organizationId).slice(-50),
      traces: [...new Set(store.cloudEvents.filter((event) => event.organizationId === actor.organizationId).map((event) => event.traceId))],
      metrics: store.cloudMetrics.filter((metric) => metric.organizationId === actor.organizationId).slice(-50),
      alerts: store.cloudServices.filter((service) => service.organizationId === actor.organizationId && service.health !== "healthy").map((service) => ({ serviceId: service.serviceId, reason: `${service.name} is ${service.health}` })),
      dashboards: ["console", "identity", "cloud", "storage", "deployments", "monitoring", "billing"]
    };
  }

  billing(actor: Actor) {
    return {
      subscriptions: store.customerSubscriptions.filter((subscription) => subscription.organizationId === actor.organizationId).length,
      marketplace: store.marketplaceInstalls.filter((install) => install.organizationId === actor.organizationId).length,
      credits: store.customerCreditWallets.filter((wallet) => wallet.organizationId === actor.organizationId).reduce((sum, wallet) => sum + wallet.balance, 0),
      enterpriseLicensing: store.billingPlans.filter((plan) => plan.status === "active" && plan.name.toLowerCase().includes("enterprise")).length,
      whiteLabelReady: true
    };
  }

  control(actor: Actor, input: z.infer<typeof controlActionSchema>) {
    const parsed = controlActionSchema.parse(input);
    if (parsed.action === "rotate_secret") {
      const secret = store.cloudSecrets.find((item) => item.organizationId === actor.organizationId && item.secretId === parsed.entityId);
      if (!secret) throw new Error("Secret not found");
      secret.version += 1;
      secret.status = "rotating";
      secret.lastRotatedAt = new Date().toISOString();
      secret.rotationDueAt = inDays(90);
      secret.updatedAt = new Date().toISOString();
    }
    if (parsed.action === "replay_event") {
      const event = store.cloudEvents.find((item) => item.organizationId === actor.organizationId && item.eventId === parsed.entityId);
      if (!event) throw new Error("Event not found");
      event.status = "replayed";
      event.attempts += 1;
      event.updatedAt = new Date().toISOString();
    }
    if (parsed.action === "disable_service" || parsed.action === "enable_service") {
      const service = store.cloudServices.find((item) => item.organizationId === actor.organizationId && item.serviceId === parsed.entityId);
      if (!service) throw new Error("Service not found");
      service.health = parsed.action === "disable_service" ? "disabled" : "healthy";
      service.updatedAt = new Date().toISOString();
    }
    if (parsed.action === "retry_job") {
      const job = store.cloudJobs.find((item) => item.organizationId === actor.organizationId && item.jobId === parsed.entityId);
      if (!job) throw new Error("Job not found");
      job.status = "queued";
      job.activityHistory.push({ at: new Date().toISOString(), status: "queued", message: parsed.reason });
      job.updatedAt = new Date().toISOString();
    }
    this.audit(actor, "CLOUD_CONTROL_ACTION", "CloudControl", parsed.entityId, parsed.reason, { action: parsed.action });
    return this.console(actor);
  }

  private ensureBaseline(actor: Actor) {
    const existing = store.cloudServices.some((service) => service.organizationId === actor.organizationId);
    if (existing) return;
    const now = new Date().toISOString();
    for (const componentType of componentTypes) {
      const service: StoredCloudService = {
        id: createId("cloud_service"),
        serviceId: createId("svc"),
        organizationId: actor.organizationId,
        name: `kravia-${componentType.replaceAll("_", "-")}`,
        version: "1.0.0",
        componentType,
        health: "healthy",
        dependencies: componentDependencies(componentType),
        region: "ap-south-1",
        environment: "production",
        ownerId: actor.userId,
        endpoint: `/api/v1/${componentEndpoint(componentType)}`,
        lastHeartbeatAt: now,
        createdAt: now,
        updatedAt: now
      };
      store.cloudServices.push(service);
    }
  }

  private metric(actor: Actor, componentType: StoredCloudComponentType, metricName: string, value: number, unit: string) {
    return {
      id: createId("cloud_metric"),
      metricId: createId("metric"),
      organizationId: actor.organizationId,
      componentType,
      metricName,
      value,
      unit,
      region: "ap-south-1",
      traceId: createId("trace"),
      createdAt: new Date().toISOString()
    };
  }

  private audit(actor: Actor, action: string, entityType: string, entityId: string, reason: string, metadata: Record<string, unknown> = {}) {
    store.cloudAuditLogs.push({
      id: createId("cloud_audit"),
      auditId: createId("audit"),
      organizationId: actor.organizationId,
      actorId: actor.userId,
      action,
      entityType,
      entityId,
      reason,
      metadata,
      createdAt: new Date().toISOString()
    });
  }
}

function componentDependencies(componentType: StoredCloudComponentType) {
  const map: Record<StoredCloudComponentType, string[]> = {
    identity: ["secrets", "configuration", "audit"],
    gateway: ["identity", "service_registry", "monitoring"],
    service_registry: ["configuration", "monitoring"],
    event_bus: ["service_registry", "observability"],
    storage: ["secrets", "configuration", "monitoring"],
    secrets: ["audit", "configuration"],
    configuration: ["audit"],
    messaging: ["secrets", "event_bus"],
    ai_runtime: ["secrets", "event_bus", "memory"],
    build: ["storage", "event_bus"],
    deploy: ["build", "monitoring", "secrets"],
    monitoring: ["service_registry"],
    observability: ["monitoring", "event_bus"],
    billing: ["identity", "event_bus"],
    console: ["identity", "gateway", "observability"]
  };
  return map[componentType];
}

function componentEndpoint(componentType: StoredCloudComponentType) {
  const map: Record<StoredCloudComponentType, string> = {
    identity: "auth/cloud",
    gateway: "gateway",
    service_registry: "services",
    event_bus: "events",
    storage: "storage",
    secrets: "secrets",
    configuration: "config",
    messaging: "messaging",
    ai_runtime: "ai",
    build: "build",
    deploy: "deploy",
    monitoring: "monitor",
    observability: "monitor/observability",
    billing: "billing",
    console: "console"
  };
  return map[componentType];
}

function componentToJob(componentType: StoredCloudComponentType) {
  if (componentType === "ai_runtime") return "ai_run";
  if (componentType === "deploy") return "deploy";
  if (componentType === "build") return "build";
  return "health_check";
}

function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function maskSecretName(name: string) {
  return `${name.slice(0, 2)}***${name.slice(-2)}`;
}

export const cloudPlatformService = new CloudPlatformService();
