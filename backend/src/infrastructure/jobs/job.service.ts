import { createId } from "../../database/in-memory-store";
import { memoryService } from "../memory/memory.service";
import type { JobName, JobQueue, JobRecord } from "./job.interface";

const queueNames: Record<JobName, string> = {
  REPORT_EXPORT_REQUESTED: "reports.exports",
  AUTOMATION_RULE_CREATED: "automation.rules",
  VAANFORGE_BLUEPRINT_REQUESTED: "vaanforge.blueprints",
  VAANFORGE_EXECUTION_REQUESTED: "vaanforge.execution"
};

export const localJobRecords: JobRecord[] = [];

export class JobService implements JobQueue {
  async enqueue<TPayload>(name: JobName, payload: TPayload): Promise<JobRecord<TPayload>> {
    const job: JobRecord<TPayload> = {
      id: createId("job"),
      name,
      queueName: queueNames[name],
      payload,
      status: "QUEUED",
      createdAt: new Date().toISOString()
    };

    localJobRecords.push(job);
    await memoryService.enqueue(job.queueName, job);
    return job;
  }

  recent() {
    return [...localJobRecords].slice(-50).reverse();
  }
}

export const jobService = new JobService();
