import type { CandidateInput, CandidateStage, DepartmentInput, EmployeeInput, InterviewInput } from "@vmnexus/shared/hr";
import { hrRepository, type HrRepository } from "./hr.repository";

export class HrService {
  constructor(private readonly repository: HrRepository = hrRepository) {}

  async createDepartment(input: DepartmentInput) {
    return this.repository.createDepartment(input);
  }

  async createEmployee(input: EmployeeInput) {
    return this.repository.createEmployee(input);
  }

  async createCandidate(input: CandidateInput) {
    return this.repository.createCandidate(input);
  }

  async updateCandidateStage(candidateId: string, stage: CandidateStage) {
    return this.repository.updateCandidateStage(candidateId, stage);
  }

  async createInterview(input: InterviewInput) {
    return this.repository.createInterview(input);
  }

  async scoreInterview(interviewId: string, score: number, feedback: string) {
    return this.repository.scoreInterview(interviewId, score, feedback);
  }

  async listDepartments(organizationId: string) {
    return this.repository.listDepartments(organizationId);
  }

  async listEmployees(organizationId: string) {
    return this.repository.listEmployees(organizationId);
  }

  async listCandidates(organizationId: string) {
    return this.repository.listCandidates(organizationId);
  }

  async listInterviews(organizationId: string) {
    return this.repository.listInterviews(organizationId);
  }

  async summary(organizationId: string) {
    const departments = await this.listDepartments(organizationId);
    const employees = await this.listEmployees(organizationId);
    const candidates = await this.listCandidates(organizationId);
    const interviews = await this.listInterviews(organizationId);

    return {
      departments: departments.length,
      employees: employees.length,
      activeEmployees: employees.filter((employee) => employee.status === "ACTIVE").length,
      candidates: candidates.length,
      screening: candidates.filter((candidate) => candidate.stage === "SCREENING").length,
      interviews: interviews.length,
      scheduledInterviews: interviews.filter((interview) => interview.status === "SCHEDULED").length,
      offers: await this.repository.countOffers(organizationId)
    };
  }

  async teamOperations(organizationId: string) {
    const departments = await this.listDepartments(organizationId);
    const employees = await this.listEmployees(organizationId);
    const activeEmployees = employees.filter((employee) => employee.status === "ACTIVE").length;
    const onLeave = employees.filter((employee) => employee.status === "ON_LEAVE").length;

    return {
      orgChart: departments.map((department) => ({
        departmentId: department.id,
        name: department.name,
        leadId: department.leadId,
        employees: employees.filter((employee) => employee.departmentId === department.id).length
      })),
      attendance: {
        mode: "status-derived",
        presentToday: activeEmployees,
        onLeave,
        unassigned: employees.filter((employee) => !employee.departmentId).length
      },
      leaves: {
        pendingRequests: 0,
        approvedToday: onLeave,
        policy: "Leave requests are tracked through employee status until the dedicated leave workflow is enabled."
      },
      performance: {
        reviewCadence: "monthly",
        trackedSignals: ["role", "department", "status", "interview feedback", "task ownership"],
        nextStep: "Connect task completion and manager review scorecards."
      },
      accessControl: {
        roleMatrix: "Founder and Super Admin control final permissions.",
        restrictedAreas: ["finance", "legal", "settings", "audit", "security"],
        permissionCheckRoute: "/api/v1/roles/check"
      }
    };
  }

  health() {
    return this.repository.health();
  }
}

export const hrService = new HrService();
