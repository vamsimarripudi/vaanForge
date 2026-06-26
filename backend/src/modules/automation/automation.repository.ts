import type { AutomationAction, AutomationRuleInput, AutomationStatus, AutomationTrigger } from "@vmnexus/shared/growth";
import { env } from "../../config/env";
import { createId, store, type StoredAutomationRule } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface AutomationRepository {
  createRule(input: AutomationRuleInput): Promise<StoredAutomationRule> | StoredAutomationRule;
  list(organizationId: string): Promise<StoredAutomationRule[]> | StoredAutomationRule[];
  health(): RepositoryHealth;
}

export class MemoryAutomationRepository implements AutomationRepository {
  createRule(input: AutomationRuleInput) {
    const rule = { id: createId("aut"), ...input, createdAt: new Date().toISOString() };
    store.automationRules.push(rule);
    return rule;
  }

  list(organizationId: string) {
    return store.automationRules.filter((item) => item.organizationId === organizationId);
  }

  health(): RepositoryHealth {
    return { name: "automation", mode: "memory", writable: true, durable: false };
  }
}

export class PrismaAutomationRepository implements AutomationRepository {
  async createRule(input: AutomationRuleInput) {
    const rule = await prisma().automationRule.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        trigger: input.trigger,
        action: input.action,
        status: input.status,
        approvalRequired: input.approvalRequired
      }
    });
    return this.toRule(rule);
  }

  async list(organizationId: string) {
    const rules = await prisma().automationRule.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
    return rules.map((rule: PrismaAutomationRule) => this.toRule(rule));
  }

  health(): RepositoryHealth {
    return { name: "automation", mode: "postgres", writable: true, durable: true };
  }

  private toRule(rule: PrismaAutomationRule): StoredAutomationRule {
    return {
      id: rule.id,
      organizationId: rule.organizationId,
      name: rule.name,
      trigger: this.trigger(rule.trigger),
      action: this.action(rule.action),
      status: this.status(rule.status),
      approvalRequired: rule.approvalRequired,
      createdAt: rule.createdAt.toISOString()
    };
  }

  private trigger(value: string): AutomationTrigger {
    return value === "LEAD_CREATED" || value === "TICKET_CREATED" || value === "RENEWAL_DUE" || value === "REPORT_READY" || value === "TASK_OVERDUE"
      ? value
      : "LEAD_CREATED";
  }

  private action(value: string): AutomationAction {
    return value === "CREATE_TASK" || value === "SEND_NOTIFICATION" || value === "QUEUE_REPORT" || value === "REQUEST_APPROVAL" ? value : "REQUEST_APPROVAL";
  }

  private status(value: string): AutomationStatus {
    return value === "DRAFT" || value === "ACTIVE" || value === "PAUSED" ? value : "DRAFT";
  }
}

type PrismaAutomationRule = {
  id: string;
  organizationId: string;
  name: string;
  trigger: string;
  action: string;
  status: string;
  approvalRequired: boolean;
  createdAt: Date;
};

export const automationRepository: AutomationRepository =
  env.persistenceMode === "postgres" ? new PrismaAutomationRepository() : new MemoryAutomationRepository();
