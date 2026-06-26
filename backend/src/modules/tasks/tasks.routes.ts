import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { tasksService } from "./tasks.service";

export const tasksRouter = Router();

const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const statusSchema = z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]);

tasksRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await tasksService.summary(organizationId) : { projects: 0, tasks: 0, allocated: 0, blocked: 0, done: 0 } });
});

tasksRouter.get("/work-allocation", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await tasksService.workAllocation(organizationId)
      : { projects: [], tasks: [], comments: [], attachments: [], recurringTasks: [], allocationRules: { ownerRequired: true, dueDateRecommended: true, priorityLevels: [], statusFlow: [] } }
  });
});

tasksRouter.get("/projects", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await tasksService.listProjects(organizationId) : [] });
});

tasksRouter.post("/projects", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), description: z.string().optional(), ownerId: z.string().optional(), dueDate: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid project request" });
    return;
  }
  const project = await tasksService.createProject({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "WORKSPACE_CREATED", entityType: "Project", entityId: project.id, metadata: { ...project } });
  response.status(201).json({ data: project });
});

tasksRouter.get("/", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await tasksService.listTasks(organizationId) : [] });
});

tasksRouter.post("/", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z
    .object({
      projectId: z.string().optional(),
      title: z.string().min(2),
      description: z.string().optional(),
      ownerId: z.string().optional(),
      dueDate: z.string().optional(),
      priority: prioritySchema.default("MEDIUM"),
      status: statusSchema.default("TODO")
    })
    .safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid task request" });
    return;
  }
  const task = await tasksService.createTask({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "WORKSPACE_CREATED", entityType: "Task", entityId: task.id, metadata: { ...task } });
  response.status(201).json({ data: task });
});

tasksRouter.patch("/:taskId/assign", authMiddleware, requirePermission("workspace:create"), async (request, response) => {
  const parsed = z.object({ ownerId: z.string().min(2) }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid assignment request" });
    return;
  }
  const task = await tasksService.assignTask(String(request.params.taskId), parsed.data.ownerId);
  if (!task) {
    response.status(404).json({ error: "Task not found" });
    return;
  }
  response.json({ data: task });
});

tasksRouter.patch("/:taskId/status", authMiddleware, async (request, response) => {
  const parsed = z.object({ status: statusSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid status request" });
    return;
  }
  const task = await tasksService.updateStatus(String(request.params.taskId), parsed.data.status);
  if (!task) {
    response.status(404).json({ error: "Task not found" });
    return;
  }
  response.json({ data: task });
});
