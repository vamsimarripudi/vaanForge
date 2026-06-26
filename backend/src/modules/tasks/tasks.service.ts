import type { ProjectInput, TaskInput, WorkStatus } from "@vmnexus/shared/operations";
import { realtimeService } from "../../infrastructure/realtime/realtime.service";
import { tasksRepository, type TasksRepository } from "./tasks.repository";

export class TasksService {
  constructor(private readonly repository: TasksRepository = tasksRepository) {}

  async createProject(input: ProjectInput) {
    return this.repository.createProject(input);
  }

  async createTask(input: TaskInput) {
    const task = await this.repository.createTask(input);
    await realtimeService.publishUpdate(`organization:${task.organizationId}:tasks`, { type: "TASK_CREATED", task });
    return task;
  }

  async assignTask(taskId: string, ownerId: string) {
    const task = await this.repository.assignTask(taskId, ownerId);
    if (task) {
      await realtimeService.publishUpdate(`organization:${task.organizationId}:tasks`, { type: "TASK_ASSIGNED", task });
    }
    return task;
  }

  async updateStatus(taskId: string, status: WorkStatus) {
    const task = await this.repository.updateStatus(taskId, status);
    if (task) {
      await realtimeService.publishUpdate(`organization:${task.organizationId}:tasks`, { type: "TASK_STATUS_UPDATED", task });
    }
    return task;
  }

  async listProjects(organizationId: string) {
    return this.repository.listProjects(organizationId);
  }

  async listTasks(organizationId: string) {
    return this.repository.listTasks(organizationId);
  }

  async summary(organizationId: string) {
    const tasks = await this.listTasks(organizationId);
    const projects = await this.listProjects(organizationId);
    return {
      projects: projects.length,
      tasks: tasks.length,
      allocated: tasks.filter((task) => Boolean(task.ownerId)).length,
      blocked: tasks.filter((task) => task.status === "BLOCKED").length,
      done: tasks.filter((task) => task.status === "DONE").length
    };
  }

  async workAllocation(organizationId: string) {
    const tasks = await this.listTasks(organizationId);
    const projects = await this.listProjects(organizationId);

    return {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        ownerId: project.ownerId || "unassigned",
        dueDate: project.dueDate || "not scheduled"
      })),
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        projectId: task.projectId,
        ownerId: task.ownerId || "unassigned",
        dueDate: task.dueDate || "not scheduled",
        priority: task.priority,
        status: task.status
      })),
      comments: tasks.map((task) => ({
        taskId: task.id,
        count: task.description ? 1 : 0,
        latest: task.description || "No comment added yet."
      })),
      attachments: tasks.map((task) => ({
        taskId: task.id,
        count: 0,
        storage: "Document OS attachment placeholder",
        route: "/api/v1/files/uploads"
      })),
      recurringTasks: [
        { title: "Weekly review", cadence: "weekly", priority: "MEDIUM", status: "TODO" },
        { title: "Monthly founder report", cadence: "monthly", priority: "HIGH", status: "TODO" },
        { title: "Renewal reminder review", cadence: "monthly", priority: "HIGH", status: "TODO" }
      ],
      allocationRules: {
        ownerRequired: true,
        dueDateRecommended: true,
        priorityLevels: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        statusFlow: ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]
      }
    };
  }

  health() {
    return this.repository.health();
  }
}

export const tasksService = new TasksService();
