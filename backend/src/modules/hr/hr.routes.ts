import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requirePermission } from "../../guards/permission.guard";
import { auditService } from "../audit/audit.service";
import { hrService } from "./hr.service";

export const hrRouter = Router();

const employeeStatusSchema = z.enum(["ACTIVE", "ON_LEAVE", "EXITED"]);
const candidateStageSchema = z.enum(["APPLIED", "SCREENING", "TECHNICAL", "MANAGERIAL", "HR", "OFFERED", "REJECTED", "HIRED"]);
const interviewRoundSchema = z.enum(["SCREENING", "TECHNICAL", "MANAGERIAL", "HR"]);
const interviewStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]);

hrRouter.get("/summary", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await hrService.summary(organizationId)
      : { departments: 0, employees: 0, activeEmployees: 0, candidates: 0, screening: 0, interviews: 0, scheduledInterviews: 0, offers: 0 }
  });
});

hrRouter.get("/team-operations", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({
    data: organizationId
      ? await hrService.teamOperations(organizationId)
      : {
          orgChart: [],
          attendance: { mode: "status-derived", presentToday: 0, onLeave: 0, unassigned: 0 },
          leaves: { pendingRequests: 0, approvedToday: 0, policy: "No active workspace." },
          performance: { reviewCadence: "monthly", trackedSignals: [], nextStep: "Activate workspace." },
          accessControl: { roleMatrix: "No active workspace.", restrictedAreas: [], permissionCheckRoute: "/api/v1/roles/check" }
        }
  });
});

hrRouter.get("/departments", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listDepartments(organizationId) : [] });
});

hrRouter.post("/departments", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), leadId: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid department request" });
    return;
  }
  const department = await hrService.createDepartment({ ...parsed.data, organizationId });
  response.status(201).json({ data: department });
});

hrRouter.get("/employees", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listEmployees(organizationId) : [] });
});

hrRouter.post("/employees", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z
    .object({
      departmentId: z.string().optional(),
      name: z.string().min(2),
      email: z.string().email(),
      role: z.string().min(2),
      status: employeeStatusSchema.default("ACTIVE"),
      joinedAt: z.string().optional()
    })
    .safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid employee request" });
    return;
  }
  const employee = await hrService.createEmployee({ ...parsed.data, organizationId });
  auditService.record({ actorId: request.session!.userId, organizationId, action: "SECURITY_ACTION", entityType: "Employee", entityId: employee.id, metadata: { ...employee } });
  response.status(201).json({ data: employee });
});

hrRouter.get("/candidates", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listCandidates(organizationId) : [] });
});

hrRouter.post("/candidates", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z.object({ name: z.string().min(2), email: z.string().email().optional(), roleApplied: z.string().min(2), stage: candidateStageSchema.default("APPLIED"), source: z.string().optional() }).safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid candidate request" });
    return;
  }
  response.status(201).json({ data: await hrService.createCandidate({ ...parsed.data, organizationId }) });
});

hrRouter.patch("/candidates/:candidateId/stage", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const parsed = z.object({ stage: candidateStageSchema }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid candidate stage request" });
    return;
  }
  const candidate = await hrService.updateCandidateStage(String(request.params.candidateId), parsed.data.stage);
  if (!candidate) {
    response.status(404).json({ error: "Candidate not found" });
    return;
  }
  response.json({ data: candidate });
});

hrRouter.get("/interviews", authMiddleware, async (request, response) => {
  const organizationId = request.session?.organizationId;
  response.json({ data: organizationId ? await hrService.listInterviews(organizationId) : [] });
});

hrRouter.post("/interviews", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const organizationId = request.session?.organizationId;
  const parsed = z
    .object({
      candidateId: z.string().min(2),
      round: interviewRoundSchema,
      scheduledAt: z.string(),
      interviewerId: z.string().optional(),
      status: interviewStatusSchema.default("SCHEDULED"),
      vaanMeetLink: z.string().optional()
    })
    .safeParse(request.body);
  if (!parsed.success || !organizationId) {
    response.status(400).json({ error: "Invalid interview request" });
    return;
  }
  response.status(201).json({ data: await hrService.createInterview({ ...parsed.data, organizationId }) });
});

hrRouter.patch("/interviews/:interviewId/score", authMiddleware, requirePermission("hr:manage"), async (request, response) => {
  const parsed = z.object({ score: z.number().min(0).max(10), feedback: z.string().min(2) }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid interview score request" });
    return;
  }
  const interview = await hrService.scoreInterview(String(request.params.interviewId), parsed.data.score, parsed.data.feedback);
  if (!interview) {
    response.status(404).json({ error: "Interview not found" });
    return;
  }
  response.json({ data: interview });
});
