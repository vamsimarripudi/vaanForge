import assert from "node:assert/strict";
import { store } from "../database/in-memory-store";
import { automationService } from "../modules/automation/automation.service";
import { lifecycleService } from "../modules/onboarding/lifecycle.service";
import { notificationsService } from "../modules/notifications/notifications.service";

const actor = { organizationId: "org_lifecycle", workspaceId: "wks_lifecycle", userId: "user_lifecycle", role: "Founder" };

async function run() {
  store.organizations.push({ id: actor.organizationId, name: "Lifecycle Org", suiteType: "VAANFORGE" as any, activePlan: "professional", billingStatus: "ACTIVE" as any, createdAt: new Date().toISOString() });
  store.workspaces.push({ id: actor.workspaceId, organizationId: actor.organizationId, suiteType: "VAANFORGE" as any, name: "Lifecycle Workspace", enabledProducts: ["VAANFORGE" as any], status: "ACTIVE", createdAt: new Date().toISOString() });
  store.projects.push({ id: "proj_lifecycle", organizationId: actor.organizationId, name: "Lifecycle project", description: "Customer onboarding automation", createdAt: new Date().toISOString() });
  store.tasks.push({ id: "task_lifecycle", organizationId: actor.organizationId, projectId: "proj_lifecycle", title: "Approve blueprint", priority: "HIGH" as any, status: "TODO" as any, createdAt: new Date().toISOString() });

const started = lifecycleService.start(actor);
assert.equal(started.progress.status, "in_progress");
assert.equal(started.resumeStep, "welcome");

const patched = lifecycleService.patch(actor, { completedStep: "welcome", role: "Founder", useCase: "Autonomous software delivery" });
assert.equal(patched.progress.completedSteps.includes("welcome"), true);
assert.equal(patched.resumeStep, "create_workspace");

const setup = lifecycleService.updateWorkspaceSetup(actor, {
  workspaceName: "Lifecycle Workspace",
  timezone: "Asia/Kolkata",
  defaultAiProvider: "openai",
  brandColors: { primary: "#10b981" },
  completedSection: "default_ai_provider"
});
assert.equal(setup.setup.defaultAiProvider, "openai");
assert.equal(setup.setup.completedSections.includes("default_ai_provider"), true);

const tour = lifecycleService.updateTour(actor, { tourKey: "dashboard", action: "complete" });
assert.equal(tour.status, "completed");
assert.equal(lifecycleService.tours(actor).find((item) => item.key === "dashboard")?.status, "completed");

const discovery = lifecycleService.updateFeatureDiscovery(actor, { featureKey: "factory-lifecycle", version: "v1.0.0-rc1", action: "viewed" });
assert.equal(discovery.status, "viewed");
assert.equal(lifecycleService.featureDiscovery(actor).find((item) => item.key === "factory-lifecycle")?.viewed, true);

const palette = lifecycleService.commandPalette(actor);
assert.equal(palette.shortcut, "Ctrl/Cmd + K");
assert.ok(palette.commands.some((item) => item.id === "create_project"));
assert.equal(lifecycleService.runCommand(actor, "create_project").command.href, "/projects/new");

const search = lifecycleService.search(actor, "Lifecycle");
assert.equal(search.groups.find((group) => group.category === "Projects")?.results.length, 1);

  const notification = await notificationsService.create({ organizationId: actor.organizationId, userId: actor.userId, source: "projects", actionUrl: "/projects/proj_lifecycle", title: "Project ready", message: "Lifecycle project is ready." });
assert.equal(notificationsService.list(actor.organizationId, actor.userId, { status: "unread" }).length, 1);
assert.equal(notificationsService.markAllRead(actor.organizationId, actor.userId).updated, 1);
assert.equal(notificationsService.archive(notification.id, actor.organizationId, actor.userId)?.archived, true);

  const automation = await automationService.createRule({ organizationId: actor.organizationId, name: "Deployment success webhook", trigger: "DEPLOYMENT_SUCCEEDED", action: "CALL_WEBHOOK", status: "ACTIVE", approvalRequired: false });
assert.equal(automation.trigger, "DEPLOYMENT_SUCCEEDED");
  const automationOs = await automationService.operatingSystem(actor.organizationId);
assert.ok(automationOs.triggers.some((item) => item.trigger === "CREDITS_LOW"));
assert.ok(automationOs.actions.some((item) => item.action === "CALL_WEBHOOK"));

const analytics = lifecycleService.workspaceAnalytics(actor);
assert.equal(analytics.projects >= 1, true);
assert.equal(analytics.users, 0);

const health = lifecycleService.productHealth(actor);
assert.ok(Array.isArray(health.recommendations));
assert.equal(typeof health.workspaceCompleteness, "number");

const completed = lifecycleService.complete(actor);
assert.equal(completed.progress.status, "completed");
assert.equal(completed.resumeStep, "success");

console.log("Product lifecycle test passed for onboarding, workspace setup, tours, discovery, command palette, search, notifications, automation, analytics, and product health.");
}

void run();
