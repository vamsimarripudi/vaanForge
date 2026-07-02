import { createId } from "../../database/in-memory-store";
import { logger } from "../logger";
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
    const now = new Date().toISOString();
    const id = createId("job");
    const job: JobRecord<TPayload> = {
      id,
      name,
      queueName: queueNames[name],
      payload,
      status: "QUEUED",
      attempts: 0,
      maxAttempts: 3,
      idempotencyKey: `${queueNames[name]}:${id}`,
      createdAt: now,
      updatedAt: now
    };

    localJobRecords.push(job);
    await this.enqueueWithRetry(job);
    return job;
  }

  recent() {
    return [...localJobRecords].slice(-50).reverse();
  }

  private async enqueueWithRetry<TPayload>(job: JobRecord<TPayload>) {
    let lastError = "";
    for (let attempt = 1; attempt <= job.maxAttempts; attempt += 1) {
      try {
        job.attempts = attempt;
        job.updatedAt = new Date().toISOString();
        await memoryService.enqueue(job.queueName, job);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown queue adapter error";
        job.lastError = lastError;
        job.updatedAt = new Date().toISOString();
        logger.warn("Job enqueue attempt failed.", {
          jobId: job.id,
          jobName: job.name,
          queueName: job.queueName,
          attempt,
          maxAttempts: job.maxAttempts,
          error: lastError
        });
      }
    }
    job.status = "FAILED";
    logger.error("Job enqueue failed after retries.", {
      jobId: job.id,
      jobName: job.name,
      queueName: job.queueName,
      attempts: job.attempts,
      error: lastError
    });
    throw new Error(`Unable to enqueue ${job.name}`);
  }
}

export const jobService = new JobService();
