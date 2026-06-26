export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "EXITED";
export type CandidateStage = "APPLIED" | "SCREENING" | "TECHNICAL" | "MANAGERIAL" | "HR" | "OFFERED" | "REJECTED" | "HIRED";
export type InterviewRound = "SCREENING" | "TECHNICAL" | "MANAGERIAL" | "HR";
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface DepartmentInput {
  organizationId: string;
  name: string;
  leadId?: string;
}

export interface EmployeeInput {
  organizationId: string;
  departmentId?: string;
  name: string;
  email: string;
  role: string;
  status: EmployeeStatus;
  joinedAt?: string;
}

export interface CandidateInput {
  organizationId: string;
  name: string;
  email?: string;
  roleApplied: string;
  stage: CandidateStage;
  source?: string;
}

export interface InterviewInput {
  organizationId: string;
  candidateId: string;
  round: InterviewRound;
  scheduledAt: string;
  interviewerId?: string;
  status: InterviewStatus;
  vaanMeetLink?: string;
}
