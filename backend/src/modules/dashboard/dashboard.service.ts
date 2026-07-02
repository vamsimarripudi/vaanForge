import { store } from "../../database/in-memory-store";
import { financeService } from "../finance/finance.service";
import { tasksService } from "../tasks/tasks.service";
import { supportService } from "../support/support.service";
import { hrService } from "../hr/hr.service";
import { complianceService } from "../compliance/compliance.service";
import { workspacesService } from "../workspaces/workspaces.service";
import { crmService } from "../crm/crm.service";
import type { SuiteType } from "@kravia/shared/types";

export class DashboardService {
  async founderSummary(organizationId: string) {
    const organization = await workspacesService.getOrganization(organizationId);
    const workspaces = await workspacesService.listForOrganization(organizationId);
    const notifications = store.notifications.filter((item) => item.organizationId === organizationId && !item.read);
    const entitlements = await workspacesService.listEntitlements(organizationId);

    const finance = await financeService.summary(organizationId);
    const taskSummary = await tasksService.summary(organizationId);
    const supportSummary = await supportService.summary(organizationId);
    const hrSummary = await hrService.summary(organizationId);
    const complianceSummary = await complianceService.summary(organizationId);

    return {
      organization,
      health: organization ? "Active trial" : "No organization",
      workspacesCount: workspaces.length,
      enabledProductsCount: entitlements.filter((item) => item.enabled).length,
      unreadNotifications: notifications.length,
      finance: {
        revenue: finance.revenueTotal,
        expenses: finance.expenseTotal,
        profit: finance.grossProfit,
        note: "P&L uses revenue minus expenses; GST uses output GST minus input credit."
      },
      operations: {
        tasks: taskSummary.tasks,
        approvals: 0,
        supportTickets: supportSummary.tickets,
        hiringItems: hrSummary.candidates + hrSummary.interviews,
        complianceItems: complianceSummary.complianceItems + complianceSummary.registrations
      }
    };
  }

  async suiteSummary(organizationId: string, suiteType: SuiteType) {
    const organization = await workspacesService.getOrganization(organizationId);
    const workspaces = (await workspacesService.listForOrganization(organizationId)).filter((workspace) => workspace.suiteType === suiteType);
    const entitlements = await workspacesService.listEntitlements(organizationId);
    const finance = await financeService.summary(organizationId);
    const tasks = await tasksService.summary(organizationId);
    const support = await supportService.summary(organizationId);
    const crm = await crmService.summary(organizationId);
    const hr = await hrService.summary(organizationId);
    const compliance = await complianceService.summary(organizationId);

    return {
      suiteType,
      organizationName: organization?.name || "No organization",
      activePlan: organization?.suiteType === suiteType ? organization.activePlan : "not-active",
      billingStatus: organization?.suiteType === suiteType ? organization.billingStatus : "INACTIVE",
      renewalDate: organization?.suiteType === suiteType ? organization.renewalDate : undefined,
      workspaces: workspaces.length,
      enabledProducts: entitlements.filter((item) => item.enabled).length,
      finance: {
        revenue: finance.revenueTotal,
        grossProfit: finance.grossProfit,
        netCashFlow: finance.netCashFlow
      },
      operations: {
        tasks: tasks.tasks,
        done: tasks.done,
        supportTickets: support.tickets,
        openSupport: support.open
      },
      growth: {
        leads: crm.leads,
        customers: crm.customers,
        pipeline: crm.expectedPipeline,
        hiringItems: hr.candidates + hr.interviews,
        complianceItems: compliance.complianceItems + compliance.registrations
      }
    };
  }
}

export const dashboardService = new DashboardService();
