export type JobName = "REPORT_EXPORT_REQUESTED" | "AUTOMATION_RULE_CREATED" | "VAANFORGE_BLUEPRINT_REQUESTED" | "VAANFORGE_EXECUTION_REQUESTED";

export type JobStatus = "QUEUED" | "ACKNOWLEDGED" | "FAILED";

export type JobRecord<TPayload = unknown> = {
  id: string;
  name: JobName;
  queueName: string;
  payload: TPayload;
  status: JobStatus;
  createdAt: string;
};

export interface JobQueue {
  enqueue<TPayload>(name: JobName, payload: TPayload): Promise<JobRecord<TPayload>>;
  recent(): JobRecord[];
}
