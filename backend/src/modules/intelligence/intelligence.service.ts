import { aiService } from "../../infrastructure/ai/ai.service";
import { financeService } from "../finance/finance.service";
import { tasksService } from "../tasks/tasks.service";
import { supportService } from "../support/support.service";
import { crmService } from "../crm/crm.service";
import { hrService } from "../hr/hr.service";
import { intelligenceRepository, type IntelligenceRepository } from "./intelligence.repository";

export class IntelligenceService {
  constructor(private readonly repository: IntelligenceRepository = intelligenceRepository) {}

  async summary(organizationId: string) {
    const finance = await financeService.summary(organizationId);
    const tasks = await tasksService.summary(organizationId);
    const support = await supportService.summary(organizationId);
    const summary = await aiService.generateIntelligence({ finance, tasks, support });
    const snapshot = await this.repository.createSnapshot({ organizationId, ...summary });
    return { ...summary, snapshotId: snapshot.id, generatedAt: snapshot.createdAt };
  }

  async latest(organizationId: string) {
    return this.repository.latestSnapshot(organizationId);
  }

  async operatingSystem(organizationId: string) {
    const finance = await financeService.summary(organizationId);
    const tasks = await tasksService.summary(organizationId);
    const support = await supportService.summary(organizationId);
    const crm = await crmService.summary(organizationId);
    const hr = await hrService.summary(organizationId);
    const latest = await this.latest(organizationId);

    return {
      explainReports: {
        summary: latest?.reportExplanation || `Revenue ${finance.revenueTotal}, expenses ${finance.expenseTotal}, gross profit ${finance.grossProfit}, and GST payable ${finance.gstPayable}.`,
        source: "/api/v1/reports/operating-system"
      },
      suggestNextTasks: latest?.nextTasks?.length
        ? latest.nextTasks.map((task) => ({ task, route: "/api/v1/tasks" }))
        : [{ task: tasks.blocked ? "Review blocked work and assign owners." : "Create the next operating task.", route: "/api/v1/tasks" }],
      detectRisks: latest?.riskSignals?.length
        ? latest.riskSignals.map((risk) => ({ risk, severity: "review" }))
        : [
            { risk: finance.netCashFlow < 0 ? "Negative cash flow" : "Cash flow currently non-negative", severity: finance.netCashFlow < 0 ? "high" : "monitor" },
            { risk: support.open ? "Open support load requires review" : "No open support load detected", severity: support.open ? "medium" : "monitor" }
          ],
      suggestFollowUps: [
        { title: "Sales follow-up", route: "/api/v1/crm/sales-operations", reason: `${crm.leads} leads and ${crm.customers} customers available.` },
        { title: "Support follow-up", route: "/api/v1/support/operations", reason: `${support.open} open tickets need attention.` },
        { title: "Renewal follow-up", route: "/api/v1/crm/customer-portal", reason: "Use renewal status before customer outreach." }
      ],
      draftCommunications: [
        { title: "Customer update", channel: "CUSTOMER_FOLLOW_UP", draft: "We reviewed your workspace status and prepared the next support step." },
        { title: "Founder alert", channel: "ANNOUNCEMENT", draft: "Monthly operating signals are ready for review." }
      ],
      summarizeTickets: {
        open: support.open,
        resolved: support.resolved,
        summary: support.open ? "Open tickets should be reviewed by priority and SLA." : "No open ticket pressure detected."
      },
      summarizeInterviews: {
        candidates: hr.candidates,
        interviews: hr.interviews,
        summary: hr.interviews ? "Interview pipeline has active records for review." : "No active interview records yet."
      },
      financialAssistant: {
        revenue: finance.revenueTotal,
        expenses: finance.expenseTotal,
        netCashFlow: finance.netCashFlow,
        suggestion: finance.netCashFlow < 0 ? "Reduce discretionary spend and review collections." : "Review founder payout and reserve targets."
      },
      salesAssistant: {
        leads: crm.leads,
        customers: crm.customers,
        expectedPipeline: crm.expectedPipeline,
        suggestion: crm.leads ? "Prioritize leads by expected value and next action." : "Create lead sources before pipeline analysis."
      },
      disclaimer: latest?.disclaimer || "Deterministic assistant output for operating support; review before action."
    };
  }

  health() {
    return this.repository.health();
  }
}

export const intelligenceService = new IntelligenceService();
