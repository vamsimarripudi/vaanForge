"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { API_BASE_URL, apiClient } from "@/services/apiClient";

interface OperationsSummary {
  projects: number;
  tasks: number;
  allocated: number;
  blocked: number;
  done: number;
}

type ReadinessCheck = {
  key: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

type ReadinessSummary = {
  status: "ready" | "limited" | "not-ready";
  mode: "memory" | "postgres";
  checks: ReadinessCheck[];
};

type ProjectRecord = {
  id: string;
  name: string;
  ownerId?: string;
  dueDate?: string;
  createdAt: string;
};

type TaskRecord = {
  id: string;
  title: string;
  ownerId?: string;
  priority: string;
  status: string;
  dueDate?: string;
  createdAt: string;
};

type WorkAllocation = {
  comments: Array<{ taskId: string; count: number; latest: string }>;
  attachments: Array<{ taskId: string; count: number; storage: string; route: string }>;
  recurringTasks: Array<{ title: string; cadence: string; priority: string; status: string }>;
  allocationRules: {
    ownerRequired: boolean;
    dueDateRecommended: boolean;
    priorityLevels: string[];
    statusFlow: string[];
  };
};

const emptySummary: OperationsSummary = { projects: 0, tasks: 0, allocated: 0, blocked: 0, done: 0 };

const emptyWorkAllocation: WorkAllocation = {
  comments: [],
  attachments: [],
  recurringTasks: [],
  allocationRules: { ownerRequired: true, dueDateRecommended: true, priorityLevels: [], statusFlow: [] }
};

export function OperationsDashboard() {
  const [summary, setSummary] = useState<OperationsSummary>(emptySummary);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [workAllocation, setWorkAllocation] = useState<WorkAllocation>(emptyWorkAllocation);
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for project and task entry.");
  const [readiness, setReadiness] = useState<ReadinessSummary | null>(null);
  const [readinessState, setReadinessState] = useState<"loading" | "success" | "error">("loading");
  const [lastTaskId, setLastTaskId] = useState("");

  const refreshSummary = useCallback(async () => {
    return apiClient<OperationsSummary>("/tasks/summary")
      .then((data) => {
        setSummary(data);
        setState(data.tasks || data.projects ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  const refreshRecords = useCallback(async () => {
    const [nextProjects, nextTasks, nextWorkAllocation] = await Promise.all([
      apiClient<ProjectRecord[]>("/tasks/projects").catch(() => []),
      apiClient<TaskRecord[]>("/tasks").catch(() => []),
      apiClient<WorkAllocation>("/tasks/work-allocation").catch(() => emptyWorkAllocation)
    ]);
    setProjects(nextProjects.slice(0, 8));
    setTasks(nextTasks.slice(0, 8));
    setWorkAllocation(nextWorkAllocation);
  }, []);

  useEffect(() => {
    void refreshSummary();
    void refreshRecords();
    fetch(`${API_BASE_URL}/system/readiness`, { credentials: "include" })
      .then(async (response) => {
        const payload = await response.json();
        if (!payload.data) {
          throw new Error("Readiness payload missing.");
        }
        setReadiness(payload.data as ReadinessSummary);
        setReadinessState("success");
      })
      .catch(() => setReadinessState("error"));
  }, [refreshRecords, refreshSummary]);

  async function createProject(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating project.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient("/tasks/projects", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          description: String(formData.get("description") || ""),
          dueDate: String(formData.get("dueDate") || "")
        })
      });
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Project created and allocation metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Project creation failed.");
    }
  }

  async function createTask(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating task.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const task = await apiClient<{ id: string }>("/tasks", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          title: String(formData.get("title") || ""),
          description: String(formData.get("description") || ""),
          priority: String(formData.get("priority") || "MEDIUM"),
          status: String(formData.get("status") || "TODO"),
          dueDate: String(formData.get("dueDate") || "")
        })
      });
      setLastTaskId(task.id);
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Task created and allocation metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Task creation failed.");
    }
  }

  async function assignTask(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Assigning task.");
    const taskId = String(formData.get("taskId") || lastTaskId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/tasks/${taskId}/assign`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          ownerId: String(formData.get("ownerId") || "")
        })
      });
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Task assigned and allocation metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Task assignment failed.");
    }
  }

  async function updateTaskStatus(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating task status.");
    const taskId = String(formData.get("taskId") || lastTaskId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          status: String(formData.get("status") || "IN_PROGRESS")
        })
      });
      await refreshSummary();
      await refreshRecords();
      setWorkflowState("success");
      setWorkflowMessage("Task status updated and metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Task status update failed.");
    }
  }

  const counts = readiness?.checks.reduce(
    (totals, check) => ({ ...totals, [check.status]: totals[check.status] + 1 }),
    { pass: 0, warn: 0, fail: 0 }
  ) ?? { pass: 0, warn: 0, fail: 0 };
  const blockers = readiness?.checks.filter((check) => check.status !== "pass").slice(0, 6) ?? [];

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">Tasks & Work Allocation</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Projects, task ownership, priority, status, and allocation tracking for founder and operating teams.
      </p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Projects", value: String(summary.projects), detail: "Active project records" },
            { label: "Tasks", value: String(summary.tasks), detail: "Total work items" },
            { label: "Allocated", value: String(summary.allocated), detail: "Tasks with owners" },
            { label: "Blocked", value: String(summary.blocked), detail: "Needs attention" },
            { label: "Done", value: String(summary.done), detail: "Completed work" },
            { label: "State", value: state, detail: "Loading, empty, error, success ready" }
          ]}
        />
      </div>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={createProject} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Project</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm font-semibold">
              Name
              <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Launch operations" />
            </label>
            <label className="text-sm font-semibold">
              Description
              <input name="description" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Workstream notes" />
            </label>
            <label className="text-sm font-semibold">
              Due date
              <input name="dueDate" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Project
          </button>
        </form>

        <form action={createTask} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Task</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              Title
              <input name="title" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Prepare founder dashboard" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Description
              <input name="description" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Task details" />
            </label>
            <label className="text-sm font-semibold">
              Priority
              <select name="priority" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="HIGH">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" defaultValue="TODO">
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Due date
              <input name="dueDate" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Task
          </button>
        </form>

        <form action={assignTask} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Assign Task</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Task ID
              <input name="taskId" defaultValue={lastTaskId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved task" />
            </label>
            <label className="text-sm font-semibold">
              Owner ID
              <input name="ownerId" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Team member ID" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Assign Task
          </button>
        </form>

        <form action={updateTaskStatus} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Update Task Status</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Task ID
              <input name="taskId" defaultValue={lastTaskId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved task" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="IN_PROGRESS" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Update Status
          </button>
        </form>
      </section>
      <div className="mt-6">
        <StatePanel state={workflowState} title="Work entry" detail={workflowMessage} />
      </div>
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshRecords()}>
              Refresh work records
            </button>
          </div>
          {projects.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Name</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Owner</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4">{project.name}</td>
                      <td className="py-3 pr-4">{project.ownerId || "-"}</td>
                      <td className="py-3 pr-4">{project.dueDate || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatePanel state="empty" title="No projects" detail="Saved projects will appear here." />
          )}
        </div>

        <div className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold">Recent Tasks</h2>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshRecords()}>
              Refresh tasks
            </button>
          </div>
          {tasks.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Title</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Owner</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Priority</th>
                    <th className="border-b border-line py-2 pr-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4">{task.title}</td>
                      <td className="py-3 pr-4">{task.ownerId || "-"}</td>
                      <td className="py-3 pr-4">{task.priority}</td>
                      <td className="py-3 pr-4">{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <StatePanel state="empty" title="No tasks" detail="Saved tasks will appear here." />
          )}
        </div>
      </section>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">Work Allocation OS</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Comments</h3>
            {workAllocation.comments.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {workAllocation.comments.slice(0, 5).map((item) => (
                  <li key={item.taskId} className="border-b border-line pb-3 last:border-0">
                    <strong>{item.taskId}</strong>
                    <p className="mt-1 text-ink-muted">{item.count} comments / {item.latest}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel state="empty" title="No comments" detail="Task comments appear after task descriptions or threaded notes exist." />
            )}
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Attachments</h3>
            {workAllocation.attachments.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {workAllocation.attachments.slice(0, 5).map((item) => (
                  <li key={item.taskId} className="border-b border-line pb-3 last:border-0">
                    <strong>{item.taskId}</strong>
                    <p className="mt-1 text-ink-muted">{item.storage} / {item.route}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <StatePanel state="empty" title="No attachments" detail="Task attachments use the Document OS upload route." />
            )}
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <h3 className="font-bold">Recurring Tasks</h3>
            <ul className="mt-3 space-y-3 text-sm">
              {workAllocation.recurringTasks.map((item) => (
                <li key={item.title} className="border-b border-line pb-3 last:border-0">
                  <div className="flex justify-between gap-3">
                    <strong>{item.title}</strong>
                    <span>{item.cadence}</span>
                  </div>
                  <p className="mt-1 text-ink-muted">{item.priority} / {item.status}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 rounded-md border border-line bg-canvas p-3 text-sm text-ink-muted">
          Owners required: {String(workAllocation.allocationRules.ownerRequired)} / due dates recommended: {String(workAllocation.allocationRules.dueDateRecommended)} / priorities: {workAllocation.allocationRules.priorityLevels.join(", ")} / statuses: {workAllocation.allocationRules.statusFlow.join(", ")}
        </p>
      </section>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Launch Readiness</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {readinessState === "loading"
                ? "Checking production launch dependencies."
                : readinessState === "error"
                  ? "Readiness checks are unavailable."
                  : `System is ${readiness?.status} with ${readiness?.mode} persistence.`}
            </p>
          </div>
          <span className="rounded-md border border-line px-3 py-2 text-sm font-semibold uppercase">
            {readinessState === "success" ? readiness?.status : readinessState}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatePanel state="success" title="Passing" detail={`${counts.pass} checks ready.`} />
          <StatePanel state={counts.warn ? "error" : "empty"} title="Warnings" detail={`${counts.warn} checks need launch review.`} />
          <StatePanel state={counts.fail ? "error" : "empty"} title="Failures" detail={`${counts.fail} checks block production.`} />
        </div>
        {blockers.length ? (
          <ul className="mt-5 grid gap-3">
            {blockers.map((check) => (
              <li key={check.key} className="rounded-md border border-line bg-canvas p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold">{check.key}</span>
                  <span className="text-xs font-semibold uppercase text-ink-muted">{check.status}</span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">{check.message}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading work" detail="Shown while task data loads." />
        <StatePanel state="empty" title="No work yet" detail="Shown before projects or tasks exist." />
        <StatePanel state="error" title="Work error" detail="Shown when task APIs fail." />
        <StatePanel state="success" title="Allocation ready" detail="Projects and tasks can be assigned." />
      </div>
    </section>
  );
}
