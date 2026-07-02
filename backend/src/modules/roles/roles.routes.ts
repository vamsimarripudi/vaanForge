import { Router } from "express";
import { z } from "zod";
import { coreRoles } from "@kravia/shared/roles";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { rolesService } from "./roles.service";

export const rolesRouter = Router();

rolesRouter.get("/", authMiddleware, requirePermission("settings:manage"), (_request, response) => {
  response.json({ data: rolesService.list() });
});

rolesRouter.post("/check", authMiddleware, (request, response) => {
  const parsed = z
    .object({
      role: z.enum(coreRoles),
      permission: z.string()
    })
    .safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid role check", issues: parsed.error.issues });
    return;
  }

  response.json({ data: rolesService.check(parsed.data.role, parsed.data.permission) });
});
