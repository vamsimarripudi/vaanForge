import type { AutomationRuleInput } from "@vmnexus/shared/growth";
import { jobService } from "../../infrastructure/jobs/job.service";
import { realtimeService } from "../../infrastructure/realtime/realtime.service";
import { automationRepository, type AutomationRepository } from "./automation.repository";

export class AutomationService {
  constructor(private readonly repository: AutomationRepository = automationRepository) {}

  async createRule(input: AutomationRuleInput) {
    const rule = await this.repository.createRule(input);
    await jobService.enqueue("AUTOMATION_RULE_CREATED", { organizationId: input.organizationId, ruleId: rule.id, trigger: rule.trigger, action: rule.action });
    await realtimeService.publishUpdate(`organization:${input.organizationId}:approvals`, { type: "AUTOMATION_RULE_CREATED", rule });
    return rule;
  }

  async list(organizationId: string) {
    return this.repository.list(organizationId);
  }

  async summary(organizationId: string) {
    const rules = await this.list(organizationId);
    return {
      rules: rules.length,
      active: rules.filter((item) => item.status === "ACTIVE").length,
      paused: rules.filter((item) => item.status === "PAUSED").length,
      approvalRequired: rules.filter((item) => item.approvalRequired).length
    };
  }

  async operatingSystem(organizationId: string) {
    const rules = await this.list(organizationId);
    const activeRules = rules.filter((rule) => rule.status === "ACTIVE");

    return {
      triggers: [
        { trigger: "LEAD_CREATED", purpose: "Start sales follow-up automation." },
        { trigger: "TICKET_CREATED", purpose: "Notify support owners and create escalation tasks." },
        { trigger: "RENEWAL_DUE", purpose: "Send renewal reminders before plan expiry." },
        { trigger: "REPORT_READY", purpose: "Notify founders when report generation completes." },
        { trigger: "TASK_OVERDUE", purpose: "Create recovery tasks and approval checks." }
      ],
      actions: [
        { action: "CREATE_TASK", route: "/api/v1/tasks" },
        { action: "SEND_NOTIFICATION", route: "/api/v1/notifications" },
        { action: "QUEUE_REPORT", route: "/api/v1/reports/exports" },
        { action: "REQUEST_APPROVAL", route: "/api/v1/audit" }
      ],
      conditions: [
        { condition: "status === ACTIVE", appliesTo: "All automation runs" },
        { condition: "approvalRequired === true", appliesTo: "Approval rules" },
        { condition: "trigger matches source event", appliesTo: "Follow-up, renewal, report, and task flows" }
      ],
      approvalRules: rules
        .filter((rule) => rule.approvalRequired)
        .map((rule) => ({ ruleId: rule.id, name: rule.name, trigger: rule.trigger, action: rule.action, status: rule.status })),
      followUpAutomation: activeRules
        .filter((rule) => rule.trigger === "LEAD_CREATED")
        .map((rule) => ({ ruleId: rule.id, name: rule.name, action: rule.action, destination: "/api/v1/crm/sales-operations" })),
      renewalReminders: activeRules
        .filter((rule) => rule.trigger === "RENEWAL_DUE")
        .map((rule) => ({ ruleId: rule.id, name: rule.name, action: rule.action, destination: "/api/v1/crm/customer-portal" })),
      reportGeneration: activeRules
        .filter((rule) => rule.action === "QUEUE_REPORT" || rule.trigger === "REPORT_READY")
        .map((rule) => ({ ruleId: rule.id, name: rule.name, route: "/api/v1/reports/exports", status: rule.status })),
      taskCreation: activeRules
        .filter((rule) => rule.action === "CREATE_TASK" || rule.trigger === "TASK_OVERDUE")
        .map((rule) => ({ ruleId: rule.id, name: rule.name, route: "/api/v1/tasks", status: rule.status })),
      templates: [
        { title: "Lead follow-up", trigger: "LEAD_CREATED", action: "SEND_NOTIFICATION" },
        { title: "Renewal reminder", trigger: "RENEWAL_DUE", action: "SEND_NOTIFICATION" },
        { title: "Monthly report generation", trigger: "REPORT_READY", action: "QUEUE_REPORT" },
        { title: "Overdue task recovery", trigger: "TASK_OVERDUE", action: "CREATE_TASK" }
      ]
    };
  }

  health() {
    return this.repository.health();
  }
}

export const automationService = new AutomationService();
