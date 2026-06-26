import type { ProjectInput, TaskInput, WorkPriority, WorkStatus } from "@vmnexus/shared/operations";
import { env } from "../../config/env";
import { createId, store, type StoredProject, type StoredTask } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface TasksRepository {
  createProject(input: ProjectInput): Promise<StoredProject> | StoredProject;
  createTask(input: TaskInput): Promise<StoredTask> | StoredTask;
  assignTask(taskId: string, ownerId: string): Promise<StoredTask | null> | StoredTask | null;
  updateStatus(taskId: string, status: WorkStatus): Promise<StoredTask | null> | StoredTask | null;
  listProjects(organizationId: string): Promise<StoredProject[]> | StoredProject[];
  listTasks(organizationId: string): Promise<StoredTask[]> | StoredTask[];
  health(): RepositoryHealth;
}

export class MemoryTasksRepository implements TasksRepository {
  createProject(input: ProjectInput) {
    const project = { id: createId("prj"), ...input, createdAt: new Date().toISOString() };
    store.projects.push(project);
    return project;
  }

  createTask(input: TaskInput) {
    const task = { id: createId("tsk"), ...input, createdAt: new Date().toISOString() };
    store.tasks.push(task);
    return task;
  }

  assignTask(taskId: string, ownerId: string) {
    const task = store.tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }
    task.ownerId = ownerId;
    return task;
  }

  updateStatus(taskId: string, status: WorkStatus) {
    const task = store.tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }
    task.status = status;
    return task;
  }

  listProjects(organizationId: string) {
    return store.projects.filter((item) => item.organizationId === organizationId);
  }

  listTasks(organizationId: string) {
    return store.tasks.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return {
      name: "tasks",
      mode: "memory",
      writable: true,
      durable: false
    };
  }
}

export class PrismaTasksRepository implements TasksRepository {
  async createProject(input: ProjectInput) {
    const project = await prisma().project.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        ownerId: input.ownerId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined
      }
    });
    return this.toProject(project);
  }

  async createTask(input: TaskInput) {
    const task = await prisma().task.create({
      data: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        ownerId: input.ownerId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        priority: input.priority,
        status: input.status
      }
    });
    return this.toTask(task);
  }

  async assignTask(taskId: string, ownerId: string) {
    try {
      const task = await prisma().task.update({
        where: { id: taskId },
        data: { ownerId }
      });
      return this.toTask(task);
    } catch {
      return null;
    }
  }

  async updateStatus(taskId: string, status: WorkStatus) {
    try {
      const task = await prisma().task.update({
        where: { id: taskId },
        data: { status }
      });
      return this.toTask(task);
    } catch {
      return null;
    }
  }

  async listProjects(organizationId: string) {
    const projects = await prisma().project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return projects.map((project: PrismaProject) => this.toProject(project));
  }

  async listTasks(organizationId: string) {
    const tasks = await prisma().task.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return tasks.map((task: PrismaTask) => this.toTask(task));
  }

  health(): RepositoryHealth {
    return {
      name: "tasks",
      mode: "postgres",
      writable: true,
      durable: true
    };
  }

  private toProject(project: PrismaProject): StoredProject {
    return {
      id: project.id,
      organizationId: project.organizationId,
      name: project.name,
      description: project.description ?? undefined,
      ownerId: project.ownerId ?? undefined,
      dueDate: project.dueDate?.toISOString(),
      createdAt: project.createdAt.toISOString()
    };
  }

  private toTask(task: PrismaTask): StoredTask {
    return {
      id: task.id,
      organizationId: task.organizationId,
      projectId: task.projectId ?? undefined,
      title: task.title,
      description: task.description ?? undefined,
      ownerId: task.ownerId ?? undefined,
      dueDate: task.dueDate?.toISOString(),
      priority: this.priority(task.priority),
      status: this.status(task.status),
      createdAt: task.createdAt.toISOString()
    };
  }

  private priority(value: string): WorkPriority {
    return value === "LOW" || value === "MEDIUM" || value === "HIGH" || value === "URGENT" ? value : "MEDIUM";
  }

  private status(value: string): WorkStatus {
    return value === "TODO" || value === "IN_PROGRESS" || value === "REVIEW" || value === "DONE" || value === "BLOCKED" ? value : "TODO";
  }
}

type PrismaProject = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  dueDate: Date | null;
  createdAt: Date;
};

type PrismaTask = {
  id: string;
  organizationId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  ownerId: string | null;
  dueDate: Date | null;
  priority: string;
  status: string;
  createdAt: Date;
};

export const tasksRepository: TasksRepository =
  env.persistenceMode === "postgres" ? new PrismaTasksRepository() : new MemoryTasksRepository();
