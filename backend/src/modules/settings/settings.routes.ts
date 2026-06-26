import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { settingsService } from "./settings.service";

export const settingsRouter = Router();

settingsRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await settingsService.summary(organizationId) : { themeMode: "system", emailNotifications: false, smsNotifications: false, apiKeysConfigured: false } });
});

settingsRouter.get("/operating-system", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await settingsService.operatingSystem(organizationId)
      : {
          companyProfile: { organizationId: "none", status: "empty", route: "/api/v1/workspaces" },
          users: { status: "empty", route: "/api/v1/auth/session", note: "Create a workspace to load users." },
          roles: { status: "empty", route: "/api/v1/roles" },
          permissions: { status: "empty", route: "/api/v1/roles/check" },
          themes: { themeMode: "system", options: ["light", "dark", "system"] },
          domains: { status: "empty", keys: [] },
          billing: { billingEmail: "not configured", route: "/api/v1/billing/summary" },
          notifications: { email: false, sms: false, route: "/api/v1/notifications" },
          templates: [],
          security: { status: "empty", controls: [] },
          apiKeysPlaceholder: { configured: false, status: "placeholder", providerGroups: [] }
        }
  });
});

settingsRouter.patch("/", authMiddleware, requirePermission("settings:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ themeMode: z.enum(["light", "dark", "system"]), billingEmail: z.string().email().optional(), notificationEmail: z.boolean().optional(), notificationSms: z.boolean().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid settings request" });
    return;
  }
  const settings = await settingsService.update({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "SETTINGS_CHANGED", entityType: "OrganizationSettings", entityId: organizationId, metadata: { ...settings } });
  response.json({ data: settings });
});
