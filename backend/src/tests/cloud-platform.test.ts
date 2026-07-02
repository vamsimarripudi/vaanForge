import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { cloudPlatformService } from "../modules/cloud-platform/cloud-platform.service";

const actor = { organizationId: `org_kcp_${Date.now()}`, userId: "kcp-admin", role: "Super Admin" };

store.cloudServices = [];
store.cloudEvents = [];
store.cloudStorageObjects = [];
store.cloudSecrets = [];
store.cloudConfigurations = [];
store.cloudMessages = [];
store.cloudJobs = [];
store.cloudMetrics = [];
store.cloudAuditLogs = [];

const consoleSnapshot = cloudPlatformService.console(actor);
assert.equal(consoleSnapshot.product, "KRAVIA Cloud Platform");
assert.equal(consoleSnapshot.parentCompany, "KRAVIA PRIVATE LIMITED");
assert.equal(consoleSnapshot.serviceRegistry.length, 15);
assert.equal(consoleSnapshot.gateway.jwtValidation, true);
assert.equal(consoleSnapshot.identity.oidcReady, true);

const registered = cloudPlatformService.registerService(actor, {
  name: "kravia-test-worker",
  version: "1.0.1",
  componentType: "build",
  dependencies: ["storage", "event_bus"],
  region: "ap-south-1",
  environment: "production",
  ownerId: actor.userId,
  endpoint: "/api/v1/build"
});
assert.equal(registered.health, "healthy");

const event = cloudPlatformService.publishEvent(actor, {
  topic: "build.completed",
  producerServiceId: registered.serviceId,
  payload: { buildId: "build_1", status: "completed" }
});
assert.equal(event.status, "published");
assert.ok(event.traceId.startsWith("trace_"));

const object = cloudPlatformService.createStorageObject(actor, {
  bucket: "build-artifacts",
  key: "release/app.tar.gz",
  objectType: "artifact",
  sizeBytes: 1024,
  contentType: "application/gzip",
  lifecyclePolicy: "retain-365-days"
});
assert.equal(object.encrypted, true);

const secret = cloudPlatformService.createSecret(actor, { name: "RAZORPAY_KEY_SECRET", category: "api_key", rotationDays: 30 });
assert.equal(secret.name.includes("***"), true);
assert.equal(JSON.stringify(cloudPlatformService.secrets(actor)).includes("RAZORPAY_KEY_SECRET"), false);

const config = cloudPlatformService.setConfiguration(actor, {
  key: "agent.generation.enabled",
  scope: "feature_flag",
  value: { enabled: true },
  environment: "production"
});
assert.equal(config.status, "active");

const message = cloudPlatformService.queueMessage(actor, { channel: "email", recipient: "ops@example.com", provider: "smtp" });
assert.equal(message.status, "queued");

const aiJob = cloudPlatformService.createJob(actor, { jobType: "ai_run", priority: "HIGH" });
const buildJob = cloudPlatformService.createJob(actor, { jobType: "build", priority: "URGENT", artifactId: object.objectId });
const deployJob = cloudPlatformService.createJob(actor, { jobType: "deploy", priority: "HIGH", releaseId: "rel_1" });
assert.equal(aiJob.status, "queued");
assert.equal(buildJob.artifactId, object.objectId);
assert.equal(deployJob.releaseId, "rel_1");

const rotated = cloudPlatformService.control(actor, { action: "rotate_secret", entityId: store.cloudSecrets[0].secretId, reason: "Routine rotation before production launch." });
assert.equal(rotated.secrets.rotating, 1);
assert.ok(store.cloudAuditLogs.some((log) => log.action === "CLOUD_CONTROL_ACTION"));

const replayed = cloudPlatformService.control(actor, { action: "replay_event", entityId: event.eventId, reason: "Replay event after subscriber recovery." });
assert.equal(replayed.eventBus.traced >= 1, true);

const monitoring = cloudPlatformService.monitor(actor);
assert.ok(monitoring.length >= 6);
assert.equal(cloudPlatformService.observability(actor).structuredLogs.length >= 1, true);
assert.equal(cloudPlatformService.billing(actor).whiteLabelReady, true);

console.log("KRAVIA Cloud Platform test passed through identity, gateway, registry, events, storage, secrets, config, messaging, AI/build/deploy jobs, monitoring, control actions, and audit logs.");
