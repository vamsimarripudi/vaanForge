"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricGrid } from "@/components/MetricGrid";
import { StatePanel } from "@/components/StatePanel";
import { apiClient } from "@/services/apiClient";

interface HrSummary {
  departments: number;
  employees: number;
  activeEmployees: number;
  candidates: number;
  screening: number;
  interviews: number;
  scheduledInterviews: number;
  offers: number;
}

interface TeamOperations {
  orgChart: Array<{ departmentId: string; name: string; leadId?: string; employees: number }>;
  attendance: { mode: string; presentToday: number; onLeave: number; unassigned: number };
  leaves: { pendingRequests: number; approvedToday: number; policy: string };
  performance: { reviewCadence: string; trackedSignals: string[]; nextStep: string };
  accessControl: { roleMatrix: string; restrictedAreas: string[]; permissionCheckRoute: string };
}

const emptySummary: HrSummary = {
  departments: 0,
  employees: 0,
  activeEmployees: 0,
  candidates: 0,
  screening: 0,
  interviews: 0,
  scheduledInterviews: 0,
  offers: 0
};

export function HrDashboard({ view }: { view: "hr" | "hiring" | "interviews" }) {
  const [summary, setSummary] = useState<HrSummary>(emptySummary);
  const [teamOperations, setTeamOperations] = useState<TeamOperations>({
    orgChart: [],
    attendance: { mode: "loading", presentToday: 0, onLeave: 0, unassigned: 0 },
    leaves: { pendingRequests: 0, approvedToday: 0, policy: "Loading leave policy." },
    performance: { reviewCadence: "loading", trackedSignals: [], nextStep: "Loading performance signals." },
    accessControl: { roleMatrix: "Loading role matrix.", restrictedAreas: [], permissionCheckRoute: "/api/v1/roles/check" }
  });
  const [state, setState] = useState<"loading" | "empty" | "success" | "error">("loading");
  const [workflowState, setWorkflowState] = useState<"empty" | "loading" | "success" | "error">("empty");
  const [workflowMessage, setWorkflowMessage] = useState("Ready for HR, hiring, or interview entry.");
  const [lastDepartmentId, setLastDepartmentId] = useState("");
  const [lastEmployeeId, setLastEmployeeId] = useState("");
  const [lastCandidateId, setLastCandidateId] = useState("");
  const [lastInterviewId, setLastInterviewId] = useState("");

  const refreshSummary = useCallback(async () => {
    return apiClient<HrSummary>("/hr/summary")
      .then((data) => {
        setSummary(data);
        setState(data.employees || data.candidates || data.interviews ? "success" : "empty");
      })
      .catch(() => setState("error"));
  }, []);

  const refreshTeamOperations = useCallback(async () => {
    const operations = await apiClient<TeamOperations>("/hr/team-operations").catch(() => ({
      orgChart: [],
      attendance: { mode: "error", presentToday: 0, onLeave: 0, unassigned: 0 },
      leaves: { pendingRequests: 0, approvedToday: 0, policy: "Team operations failed to load." },
      performance: { reviewCadence: "error", trackedSignals: [], nextStep: "Retry team operations." },
      accessControl: { roleMatrix: "Unavailable", restrictedAreas: [], permissionCheckRoute: "/api/v1/roles/check" }
    }));
    setTeamOperations(operations);
  }, []);

  useEffect(() => {
    void refreshSummary();
    void refreshTeamOperations();
  }, [refreshSummary, refreshTeamOperations]);

  async function createDepartment(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating department.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const department = await apiClient<{ id: string }>("/hr/departments", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({ name: String(formData.get("name") || "") })
      });
      setLastDepartmentId(department.id);
      await refreshSummary();
      await refreshTeamOperations();
      setWorkflowState("success");
      setWorkflowMessage("Department created.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Department creation failed.");
    }
  }

  async function createEmployee(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating employee.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const employee = await apiClient<{ id: string }>("/hr/employees", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          departmentId: String(formData.get("departmentId") || lastDepartmentId || ""),
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          role: String(formData.get("role") || ""),
          status: String(formData.get("status") || "ACTIVE"),
          joinedAt: String(formData.get("joinedAt") || "")
        })
      });
      setLastEmployeeId(employee.id);
      await refreshSummary();
      await refreshTeamOperations();
      setWorkflowState("success");
      setWorkflowMessage("Employee created.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Employee creation failed.");
    }
  }

  async function createCandidate(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating candidate.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const candidate = await apiClient<{ id: string }>("/hr/candidates", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          roleApplied: String(formData.get("roleApplied") || ""),
          stage: String(formData.get("stage") || "APPLIED"),
          source: String(formData.get("source") || "")
        })
      });
      setLastCandidateId(candidate.id);
      await refreshSummary();
      await refreshTeamOperations();
      setWorkflowState("success");
      setWorkflowMessage("Candidate created.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Candidate creation failed.");
    }
  }

  async function createInterview(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Creating interview.");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      const interview = await apiClient<{ id: string }>("/hr/interviews", {
        method: "POST",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          candidateId: String(formData.get("candidateId") || lastCandidateId || ""),
          round: String(formData.get("round") || "TECHNICAL"),
          scheduledAt: String(formData.get("scheduledAt") || ""),
          interviewerId: String(formData.get("interviewerId") || lastEmployeeId || ""),
          status: String(formData.get("status") || "SCHEDULED"),
          vaanMeetLink: String(formData.get("vaanMeetLink") || "")
        })
      });
      setLastInterviewId(interview.id);
      await refreshSummary();
      await refreshTeamOperations();
      setWorkflowState("success");
      setWorkflowMessage("Interview created.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Interview creation failed.");
    }
  }

  async function updateCandidateStage(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Updating candidate stage.");
    const candidateId = String(formData.get("candidateId") || lastCandidateId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/hr/candidates/${candidateId}/stage`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          stage: String(formData.get("stage") || "SCREENING")
        })
      });
      await refreshSummary();
      await refreshTeamOperations();
      setWorkflowState("success");
      setWorkflowMessage("Candidate stage updated and hiring metrics refreshed.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Candidate stage update failed.");
    }
  }

  async function scoreInterview(formData: FormData) {
    setWorkflowState("loading");
    setWorkflowMessage("Scoring interview.");
    const interviewId = String(formData.get("interviewId") || lastInterviewId || "");
    try {
      const csrf = await apiClient<{ csrfToken: string }>("/security/csrf");
      await apiClient(`/hr/interviews/${interviewId}/score`, {
        method: "PATCH",
        headers: { "x-csrf-token": csrf.csrfToken },
        body: JSON.stringify({
          score: Number(formData.get("score") || 0),
          feedback: String(formData.get("feedback") || "")
        })
      });
      await refreshSummary();
      await refreshTeamOperations();
      setWorkflowState("success");
      setWorkflowMessage("Interview scored and marked complete.");
    } catch (error) {
      setWorkflowState("error");
      setWorkflowMessage(error instanceof Error ? error.message : "Interview scoring failed.");
    }
  }

  const titles = {
    hr: "HR Employee OS",
    hiring: "Hiring Pipeline",
    interviews: "Interview Workflow"
  };

  const descriptions = {
    hr: "Departments, employee records, roles, access, and joining visibility.",
    hiring: "Candidate pipeline from application to offer, with stages and source tracking.",
    interviews: "Screening, technical, managerial, HR rounds, scorecards, feedback, and VaanMeet placeholders."
  };

  return (
    <section className="py-8">
      <h1 className="text-4xl font-bold">{titles[view]}</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">{descriptions[view]}</p>
      <div className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <MetricGrid
          metrics={[
            { label: "Departments", value: String(summary.departments), detail: "Org structure records" },
            { label: "Employees", value: String(summary.employees), detail: "Employee records" },
            { label: "Active", value: String(summary.activeEmployees), detail: "Active employees" },
            { label: "Candidates", value: String(summary.candidates), detail: "Hiring pipeline records" },
            { label: "Interviews", value: String(summary.interviews), detail: "Interview rounds" },
            { label: "Offers", value: String(summary.offers), detail: "Offer workflow" }
          ]}
        />
      </div>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Team Operations</h2>
            <p className="mt-2 text-sm text-ink-muted">Org chart, attendance, leaves, performance signals, and access-control guidance.</p>
          </div>
          <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" type="button" onClick={() => void refreshTeamOperations()}>
            Refresh team operations
          </button>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Attendance</p>
            <p className="mt-2 text-2xl font-bold">{teamOperations.attendance.presentToday} present</p>
            <p className="mt-1 text-sm text-ink-muted">{teamOperations.attendance.onLeave} on leave, {teamOperations.attendance.unassigned} unassigned.</p>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Leaves</p>
            <p className="mt-2 text-sm text-ink-muted">{teamOperations.leaves.policy}</p>
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Performance</p>
            <p className="mt-2 text-sm text-ink-muted">Review cadence: {teamOperations.performance.reviewCadence}.</p>
            <p className="mt-1 text-sm text-ink-muted">{teamOperations.performance.nextStep}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Org Chart</p>
            {teamOperations.orgChart.length ? (
              <ul className="mt-3 grid gap-2 text-sm">
                {teamOperations.orgChart.map((department) => (
                  <li key={department.departmentId}>
                    <span className="font-semibold">{department.name}</span>: {department.employees} employees
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Departments will appear after team setup.</p>
            )}
          </div>
          <div className="rounded-md border border-line bg-canvas p-4">
            <p className="text-sm font-semibold text-accent">Access Control</p>
            <p className="mt-2 text-sm text-ink-muted">{teamOperations.accessControl.roleMatrix}</p>
            <p className="mt-2 text-sm text-ink-muted">Restricted areas: {teamOperations.accessControl.restrictedAreas.join(", ") || "None"}.</p>
          </div>
        </div>
      </section>
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <form action={createDepartment} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Department</h2>
          <label className="mt-4 block text-sm font-semibold">
            Name
            <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Operations" />
          </label>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Department
          </button>
        </form>

        <form action={createEmployee} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Employee</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Department ID
              <input name="departmentId" defaultValue={lastDepartmentId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved department" />
            </label>
            <label className="text-sm font-semibold">
              Name
              <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Team member" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input name="email" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="member@vmnexus.local" />
            </label>
            <label className="text-sm font-semibold">
              Role
              <input name="role" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Operations Lead" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="ACTIVE" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="EXITED">Exited</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Joined
              <input name="joinedAt" type="date" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Employee
          </button>
        </form>

        <form action={createCandidate} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Candidate</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Name
              <input name="name" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Candidate name" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input name="email" type="email" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="candidate@vmnexus.local" />
            </label>
            <label className="text-sm font-semibold">
              Role applied
              <input name="roleApplied" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Support Specialist" />
            </label>
            <label className="text-sm font-semibold">
              Source
              <input name="source" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Referral" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Stage
              <select name="stage" defaultValue="APPLIED" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="APPLIED">Applied</option>
                <option value="SCREENING">Screening</option>
                <option value="TECHNICAL">Technical</option>
                <option value="MANAGERIAL">Managerial</option>
                <option value="HR">HR</option>
                <option value="OFFERED">Offered</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Candidate
          </button>
        </form>

        <form action={updateCandidateStage} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Update Candidate Stage</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Candidate ID
              <input name="candidateId" defaultValue={lastCandidateId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved candidate" />
            </label>
            <label className="text-sm font-semibold">
              Stage
              <select name="stage" defaultValue="SCREENING" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="APPLIED">Applied</option>
                <option value="SCREENING">Screening</option>
                <option value="TECHNICAL">Technical</option>
                <option value="MANAGERIAL">Managerial</option>
                <option value="HR">HR</option>
                <option value="OFFERED">Offered</option>
                <option value="REJECTED">Rejected</option>
                <option value="HIRED">Hired</option>
              </select>
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Update Candidate Stage
          </button>
        </form>

        <form action={createInterview} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Create Interview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Candidate ID
              <input name="candidateId" defaultValue={lastCandidateId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved candidate" />
            </label>
            <label className="text-sm font-semibold">
              Interviewer ID
              <input name="interviewerId" defaultValue={lastEmployeeId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved employee" />
            </label>
            <label className="text-sm font-semibold">
              Round
              <select name="round" defaultValue="TECHNICAL" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="SCREENING">Screening</option>
                <option value="TECHNICAL">Technical</option>
                <option value="MANAGERIAL">Managerial</option>
                <option value="HR">HR</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" defaultValue="SCHEDULED" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2">
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Scheduled
              <input name="scheduledAt" type="datetime-local" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">
              Meeting link
              <input name="vaanMeetLink" className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="https://meet.vmnexus.local/demo" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">
            Save Interview
          </button>
        </form>

        <form action={scoreInterview} className="rounded-panel border border-line bg-surface p-5 shadow-panel">
          <h2 className="text-xl font-bold">Score Interview</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Interview ID
              <input name="interviewId" defaultValue={lastInterviewId} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Use saved interview" />
            </label>
            <label className="text-sm font-semibold">
              Score
              <input name="score" type="number" min={0} max={10} defaultValue={8} className="mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Feedback
              <textarea name="feedback" className="mt-2 min-h-24 w-full rounded-md border border-line bg-canvas px-3 py-2" placeholder="Structured feedback and next step" />
            </label>
          </div>
          <button className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white" type="submit">
            Score Interview
          </button>
        </form>
      </section>
      <div className="mt-6">
        <StatePanel state={workflowState} title="HR workflow" detail={workflowMessage} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <StatePanel state="loading" title="Loading HR" detail="Shown while HR data loads." />
        <StatePanel state="empty" title="No HR data" detail="Shown before employee or candidate records exist." />
        <StatePanel state="error" title="HR error" detail="Shown when HR APIs fail." />
        <StatePanel state={state === "success" ? "success" : state === "error" ? "error" : "empty"} title="Workflow state" detail={`${titles[view]} foundation is ready.`} />
      </div>
      <section className="mt-6 rounded-panel border border-line bg-surface p-5 shadow-panel">
        <h2 className="text-xl font-bold">VaanMeet Interview Placeholder</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Interview creation attaches a meeting link placeholder through backend HR workflow until the owned meeting engine is ready.
        </p>
      </section>
    </section>
  );
}
