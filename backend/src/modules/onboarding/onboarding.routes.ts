import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { requirePermission } from "../../guards/permission.guard";
import { sendError } from "../../http/error-response";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { discoveryPatchSchema, lifecycleService, onboardingPatchSchema, tourPatchSchema, workspaceSetupPatchSchema, type LifecycleActor } from "./lifecycle.service";

export const onboardingRouter = Router();

const searchSchema = z.object({ q: z.string().max(120).default("") });
const commandSchema = z.object({ commandId: z.string().min(2), source: z.enum(["palette", "search", "shortcut"]).default("palette") });

onboardingRouter.get("/", authMiddleware, (request, response) => {
  response.json({
    data: {
      ...lifecycleService.get(actor(request)),
      businessTypes: ["Education", "Events", "Creators", "Services", "Hybrid"],
      requiredPortals: ["Founder", "Client", "Customer", "Creator", "Partner"],
      recommendedSuites: ["EDUCATION_SUITE", "VMETRON_SUITE"],
      handoffRoute: "/api/v1/workspaces",
      workspaceActivation: {
        method: "POST",
        requiredFields: ["organizationName", "workspaceName", "suiteType", "planId"]
      }
    }
  });
});

onboardingRouter.post("/start", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  response.status(201).json({ data: lifecycleService.start(actor(request)) });
});

onboardingRouter.patch("/", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  const parsed = onboardingPatchSchema.safeParse(request.body);
  if (!parsed.success) {
    sendError(response, request, 422, { code: "VALIDATION_ERROR", message: "Please correct the onboarding step data.", recoverable: true, nextAction: "fix_fields", fieldErrors: fieldErrors(parsed.error) });
    return;
  }
  response.json({ data: lifecycleService.patch(actor(request), parsed.data) });
});

onboardingRouter.post("/complete", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  response.json({ data: lifecycleService.complete(actor(request)) });
});

onboardingRouter.get("/workspace-setup", authMiddleware, (request, response) => {
  response.json({ data: lifecycleService.workspaceSetup(actor(request)) });
});

onboardingRouter.patch("/workspace-setup", authMiddleware, requirePermission("settings:manage"), (request, response) => {
  const parsed = workspaceSetupPatchSchema.safeParse(request.body);
  if (!parsed.success) {
    sendError(response, request, 422, { code: "VALIDATION_ERROR", message: "Please correct the workspace setup data.", recoverable: true, nextAction: "fix_fields", fieldErrors: fieldErrors(parsed.error) });
    return;
  }
  response.json({ data: lifecycleService.updateWorkspaceSetup(actor(request), parsed.data) });
});

onboardingRouter.get("/tours", authMiddleware, (request, response) => {
  response.json({ data: lifecycleService.tours(actor(request)) });
});

onboardingRouter.post("/tours", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  const parsed = tourPatchSchema.safeParse(request.body);
  if (!parsed.success) {
    sendError(response, request, 422, { code: "VALIDATION_ERROR", message: "Please correct the product tour action.", recoverable: true, nextAction: "fix_fields", fieldErrors: fieldErrors(parsed.error) });
    return;
  }
  response.json({ data: lifecycleService.updateTour(actor(request), parsed.data) });
});

onboardingRouter.get("/feature-discovery", authMiddleware, (request, response) => {
  response.json({ data: lifecycleService.featureDiscovery(actor(request)) });
});

onboardingRouter.post("/feature-discovery", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  const parsed = discoveryPatchSchema.safeParse(request.body);
  if (!parsed.success) {
    sendError(response, request, 422, { code: "VALIDATION_ERROR", message: "Please correct the feature discovery action.", recoverable: true, nextAction: "fix_fields", fieldErrors: fieldErrors(parsed.error) });
    return;
  }
  response.json({ data: lifecycleService.updateFeatureDiscovery(actor(request), parsed.data) });
});

onboardingRouter.get("/command-palette", authMiddleware, (request, response) => {
  response.json({ data: lifecycleService.commandPalette(actor(request)) });
});

onboardingRouter.post("/command-palette/run", authMiddleware, requirePermission("profile:manage"), (request, response) => {
  const parsed = commandSchema.safeParse(request.body);
  if (!parsed.success) {
    sendError(response, request, 422, { code: "VALIDATION_ERROR", message: "Please choose a valid command.", recoverable: true, nextAction: "fix_fields", fieldErrors: fieldErrors(parsed.error) });
    return;
  }
  response.json({ data: lifecycleService.runCommand(actor(request), parsed.data.commandId, parsed.data.source) });
});

onboardingRouter.get("/search", authMiddleware, (request, response) => {
  const parsed = searchSchema.safeParse(request.query);
  response.json({ data: lifecycleService.search(actor(request), parsed.success ? parsed.data.q : "") });
});

onboardingRouter.get("/workspace-analytics", authMiddleware, (request, response) => {
  response.json({ data: lifecycleService.workspaceAnalytics(actor(request)) });
});

onboardingRouter.get("/product-health", authMiddleware, (request, response) => {
  response.json({ data: lifecycleService.productHealth(actor(request)) });
});

function actor(request: Request): LifecycleActor {
  return {
    organizationId: request.session?.organizationId ?? "org_unassigned",
    userId: request.session?.userId ?? "user_unassigned",
    role: request.session?.role ?? "Viewer"
  };
}

function fieldErrors(error: z.ZodError) {
  return Object.fromEntries(Object.entries(error.flatten().fieldErrors).map(([key, value]) => [key, value?.[0] ?? "Invalid value."]));
}
