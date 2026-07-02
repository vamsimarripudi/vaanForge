import type {
  CandidateInput,
  CandidateStage,
  DepartmentInput,
  EmployeeInput,
  EmployeeStatus,
  InterviewInput,
  InterviewRound,
  InterviewStatus
} from "@kravia/shared/hr";
import { env } from "../../config/env";
import {
  createId,
  store,
  type StoredCandidate,
  type StoredDepartment,
  type StoredEmployee,
  type StoredInterview
} from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface HrRepository {
  createDepartment(input: DepartmentInput): Promise<StoredDepartment> | StoredDepartment;
  createEmployee(input: EmployeeInput): Promise<StoredEmployee> | StoredEmployee;
  createCandidate(input: CandidateInput): Promise<StoredCandidate> | StoredCandidate;
  updateCandidateStage(candidateId: string, stage: CandidateStage): Promise<StoredCandidate | null> | StoredCandidate | null;
  createInterview(input: InterviewInput): Promise<StoredInterview> | StoredInterview;
  scoreInterview(interviewId: string, score: number, feedback: string): Promise<StoredInterview | null> | StoredInterview | null;
  listDepartments(organizationId: string): Promise<StoredDepartment[]> | StoredDepartment[];
  listEmployees(organizationId: string): Promise<StoredEmployee[]> | StoredEmployee[];
  listCandidates(organizationId: string): Promise<StoredCandidate[]> | StoredCandidate[];
  listInterviews(organizationId: string): Promise<StoredInterview[]> | StoredInterview[];
  countOffers(organizationId: string): Promise<number> | number;
  health(): RepositoryHealth;
}

export class MemoryHrRepository implements HrRepository {
  createDepartment(input: DepartmentInput) {
    const department = { id: createId("dep"), ...input, createdAt: new Date().toISOString() };
    store.departments.push(department);
    return department;
  }

  createEmployee(input: EmployeeInput) {
    const employee = { id: createId("emp"), ...input, createdAt: new Date().toISOString() };
    store.employees.push(employee);
    return employee;
  }

  createCandidate(input: CandidateInput) {
    const candidate = { id: createId("can"), ...input, createdAt: new Date().toISOString() };
    store.candidates.push(candidate);
    return candidate;
  }

  updateCandidateStage(candidateId: string, stage: CandidateStage) {
    const candidate = store.candidates.find((item) => item.id === candidateId);
    if (!candidate) {
      return null;
    }
    candidate.stage = stage;
    return candidate;
  }

  createInterview(input: InterviewInput) {
    const interview = {
      id: createId("int"),
      ...input,
      vaanMeetLink: input.vaanMeetLink || `https://meet.example.com/interview-${input.candidateId}`,
      createdAt: new Date().toISOString()
    };
    store.interviews.push(interview);
    return interview;
  }

  scoreInterview(interviewId: string, score: number, feedback: string) {
    const interview = store.interviews.find((item) => item.id === interviewId);
    if (!interview) {
      return null;
    }
    interview.score = score;
    interview.feedback = feedback;
    interview.status = "COMPLETED";
    return interview;
  }

  listDepartments(organizationId: string) {
    return store.departments.filter((item) => item.organizationId === organizationId);
  }

  listEmployees(organizationId: string) {
    return store.employees.filter((item) => item.organizationId === organizationId);
  }

  listCandidates(organizationId: string) {
    return store.candidates.filter((item) => item.organizationId === organizationId);
  }

  listInterviews(organizationId: string) {
    return store.interviews.filter((item) => item.organizationId === organizationId);
  }

  countOffers(organizationId: string) {
    return store.offers.filter((offer) => offer.organizationId === organizationId).length;
  }

  health(): RepositoryHealth {
    return {
      name: "hr",
      mode: "memory",
      writable: true,
      durable: false
    };
  }
}

export class PrismaHrRepository implements HrRepository {
  async createDepartment(input: DepartmentInput) {
    const department = await prisma().department.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        leadId: input.leadId
      }
    });
    return this.toDepartment(department);
  }

  async createEmployee(input: EmployeeInput) {
    const employee = await prisma().employee.create({
      data: {
        organizationId: input.organizationId,
        departmentId: input.departmentId,
        name: input.name,
        email: input.email,
        role: input.role,
        status: input.status,
        joinedAt: input.joinedAt ? new Date(input.joinedAt) : undefined
      }
    });
    return this.toEmployee(employee);
  }

  async createCandidate(input: CandidateInput) {
    const candidate = await prisma().candidate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email,
        roleApplied: input.roleApplied,
        stage: input.stage,
        source: input.source
      }
    });
    return this.toCandidate(candidate);
  }

  async updateCandidateStage(candidateId: string, stage: CandidateStage) {
    try {
      const candidate = await prisma().candidate.update({
        where: { id: candidateId },
        data: { stage }
      });
      return this.toCandidate(candidate);
    } catch {
      return null;
    }
  }

  async createInterview(input: InterviewInput) {
    const interview = await prisma().interview.create({
      data: {
        organizationId: input.organizationId,
        candidateId: input.candidateId,
        round: input.round,
        scheduledAt: new Date(input.scheduledAt),
        interviewerId: input.interviewerId,
        status: input.status,
        vaanMeetLink: input.vaanMeetLink || `https://meet.example.com/interview-${input.candidateId}`
      }
    });
    return this.toInterview(interview);
  }

  async scoreInterview(interviewId: string, score: number, feedback: string) {
    try {
      const interview = await prisma().interview.update({
        where: { id: interviewId },
        data: { score, feedback, status: "COMPLETED" }
      });
      return this.toInterview(interview);
    } catch {
      return null;
    }
  }

  async listDepartments(organizationId: string) {
    const departments = await prisma().department.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return departments.map((department: PrismaDepartment) => this.toDepartment(department));
  }

  async listEmployees(organizationId: string) {
    const employees = await prisma().employee.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return employees.map((employee: PrismaEmployee) => this.toEmployee(employee));
  }

  async listCandidates(organizationId: string) {
    const candidates = await prisma().candidate.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return candidates.map((candidate: PrismaCandidate) => this.toCandidate(candidate));
  }

  async listInterviews(organizationId: string) {
    const interviews = await prisma().interview.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return interviews.map((interview: PrismaInterview) => this.toInterview(interview));
  }

  async countOffers(organizationId: string) {
    return prisma().offer.count({ where: { organizationId } });
  }

  health(): RepositoryHealth {
    return {
      name: "hr",
      mode: "postgres",
      writable: true,
      durable: true
    };
  }

  private toDepartment(department: PrismaDepartment): StoredDepartment {
    return {
      id: department.id,
      organizationId: department.organizationId,
      name: department.name,
      leadId: department.leadId ?? undefined,
      createdAt: department.createdAt.toISOString()
    };
  }

  private toEmployee(employee: PrismaEmployee): StoredEmployee {
    return {
      id: employee.id,
      organizationId: employee.organizationId,
      departmentId: employee.departmentId ?? undefined,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: this.employeeStatus(employee.status),
      joinedAt: employee.joinedAt?.toISOString(),
      createdAt: employee.createdAt.toISOString()
    };
  }

  private toCandidate(candidate: PrismaCandidate): StoredCandidate {
    return {
      id: candidate.id,
      organizationId: candidate.organizationId,
      name: candidate.name,
      email: candidate.email ?? undefined,
      roleApplied: candidate.roleApplied,
      stage: this.candidateStage(candidate.stage),
      source: candidate.source ?? undefined,
      createdAt: candidate.createdAt.toISOString()
    };
  }

  private toInterview(interview: PrismaInterview): StoredInterview {
    return {
      id: interview.id,
      organizationId: interview.organizationId,
      candidateId: interview.candidateId,
      round: this.interviewRound(interview.round),
      scheduledAt: interview.scheduledAt.toISOString(),
      interviewerId: interview.interviewerId ?? undefined,
      status: this.interviewStatus(interview.status),
      vaanMeetLink: interview.vaanMeetLink ?? undefined,
      score: interview.score ?? undefined,
      feedback: interview.feedback ?? undefined,
      createdAt: interview.createdAt.toISOString()
    };
  }

  private employeeStatus(value: string): EmployeeStatus {
    return value === "ACTIVE" || value === "ON_LEAVE" || value === "EXITED" ? value : "ACTIVE";
  }

  private candidateStage(value: string): CandidateStage {
    return value === "APPLIED" ||
      value === "SCREENING" ||
      value === "TECHNICAL" ||
      value === "MANAGERIAL" ||
      value === "HR" ||
      value === "OFFERED" ||
      value === "REJECTED" ||
      value === "HIRED"
      ? value
      : "APPLIED";
  }

  private interviewRound(value: string): InterviewRound {
    return value === "SCREENING" || value === "TECHNICAL" || value === "MANAGERIAL" || value === "HR" ? value : "SCREENING";
  }

  private interviewStatus(value: string): InterviewStatus {
    return value === "SCHEDULED" || value === "COMPLETED" || value === "CANCELLED" ? value : "SCHEDULED";
  }
}

type PrismaDepartment = {
  id: string;
  organizationId: string;
  name: string;
  leadId: string | null;
  createdAt: Date;
};

type PrismaEmployee = {
  id: string;
  organizationId: string;
  departmentId: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: Date | null;
  createdAt: Date;
};

type PrismaCandidate = {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  roleApplied: string;
  stage: string;
  source: string | null;
  createdAt: Date;
};

type PrismaInterview = {
  id: string;
  organizationId: string;
  candidateId: string;
  round: string;
  scheduledAt: Date;
  interviewerId: string | null;
  status: string;
  vaanMeetLink: string | null;
  score: number | null;
  feedback: string | null;
  createdAt: Date;
};

export const hrRepository: HrRepository = env.persistenceMode === "postgres" ? new PrismaHrRepository() : new MemoryHrRepository();
