import { calculateGstPayable, calculateProfitMargin, type ExpenseInput, type RevenueInput } from "@kravia/shared/finance";
import { jobService } from "../../infrastructure/jobs/job.service";
import { storageService } from "../../infrastructure/storage/storage.service";
import { financeRepository, type FinanceRepository, type ReportFormat, type ReportType } from "./finance.repository";

export class FinanceService {
  constructor(private readonly repository: FinanceRepository = financeRepository) {}

  async addRevenue(input: RevenueInput) {
    return this.repository.addRevenue(input);
  }

  async addExpense(input: ExpenseInput) {
    return this.repository.addExpense(input);
  }

  async listRevenue(organizationId: string) {
    return this.repository.listRevenue(organizationId);
  }

  async listExpenses(organizationId: string) {
    return this.repository.listExpenses(organizationId);
  }

  async summary(organizationId: string) {
    const revenue = await this.listRevenue(organizationId);
    const expenses = await this.listExpenses(organizationId);
    const revenueTotal = revenue.reduce((sum, item) => sum + item.amount, 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const grossProfit = Number((revenueTotal - expenseTotal).toFixed(2));
    const gstPayable = calculateGstPayable(revenueTotal, expenseTotal);

    return {
      revenueTotal,
      expenseTotal,
      grossProfit,
      profitMarginPercent: calculateProfitMargin(revenueTotal, grossProfit),
      gstPayable,
      cashIn: revenueTotal,
      cashOut: expenseTotal,
      netCashFlow: grossProfit
    };
  }

  async analytics(organizationId: string) {
    const revenue = await this.listRevenue(organizationId);
    const expenses = await this.listExpenses(organizationId);
    const summary = await this.summary(organizationId);
    const products = [...new Set(revenue.map((item) => item.product || "Unassigned"))];
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const revenueTotal = revenue.reduce((sum, item) => sum + item.amount, 0);

    const productPerformance = products.map((product) => {
      const productRevenue = revenue.filter((item) => (item.product || "Unassigned") === product).reduce((sum, item) => sum + item.amount, 0);
      const allocatedExpense = revenueTotal > 0 ? Number(((productRevenue / revenueTotal) * expenseTotal).toFixed(2)) : 0;
      return {
        product,
        revenue: productRevenue,
        allocatedExpense,
        profit: Number((productRevenue - allocatedExpense).toFixed(2)),
        marginPercent: calculateProfitMargin(productRevenue, productRevenue - allocatedExpense)
      };
    });

    const reserve = Number((summary.grossProfit * 0.4).toFixed(2));
    const reinvestment = Number((summary.grossProfit * 0.35).toFixed(2));
    const complianceHold = Number((summary.grossProfit * 0.1).toFixed(2));
    const founderPayout = Number(Math.max(summary.grossProfit - reserve - reinvestment - complianceHold, 0).toFixed(2));

    return {
      founderPayoutPlanning: {
        grossProfit: summary.grossProfit,
        reserve,
        reinvestment,
        complianceHold,
        suggestedFounderPayout: founderPayout,
        rule: "Payout after reserving runway, reinvestment, and tax/compliance buffers."
      },
      productWiseRevenue: productPerformance.map(({ product, revenue }) => ({ product, revenue })),
      productWiseProfit: productPerformance,
      caExport: {
        reportType: "CA_EXPORT" as ReportType,
        availableFormats: ["EXCEL", "PDF"] as ReportFormat[],
        includes: ["P&L", "GST", "cash flow", "product-wise revenue", "product-wise profit", "founder payout planning"]
      }
    };
  }

  async queueExport(organizationId: string, reportType: ReportType, format: ReportFormat) {
    await jobService.enqueue("REPORT_EXPORT_REQUESTED", { organizationId, reportType, format });
    const summary = await this.summary(organizationId);
    const fileName = `${reportType.toLowerCase()}-${organizationId}.${format === "EXCEL" ? "csv" : "html"}`;
    const content =
      format === "EXCEL"
        ? [
            "Metric,Value",
            `Revenue,${summary.revenueTotal}`,
            `Expenses,${summary.expenseTotal}`,
            `Gross Profit,${summary.grossProfit}`,
            `Profit Margin %,${summary.profitMarginPercent}`,
            `GST Payable,${summary.gstPayable}`,
            `Net Cash Flow,${summary.netCashFlow}`,
            `CA Export,${reportType === "CA_EXPORT" ? "Yes" : "No"}`
          ].join("\n")
        : `<html><body><h1>${reportType} Report</h1><p>Revenue: ${summary.revenueTotal}</p><p>Expenses: ${summary.expenseTotal}</p><p>Gross Profit: ${summary.grossProfit}</p><p>GST Payable: ${summary.gstPayable}</p><p>Net Cash Flow: ${summary.netCashFlow}</p><p>CA Export: ${reportType === "CA_EXPORT" ? "Yes" : "No"}</p></body></html>`;

    const mimeType = format === "EXCEL" ? "text/csv" : "text/html";
    const storedObject = await storageService.putObject({
      key: `reports/${organizationId}/${fileName}`,
      content,
      mimeType
    });

    return this.repository.createExport({
      organizationId,
      reportType,
      format,
      status: "READY" as const,
      fileName,
      mimeType,
      content,
      storageProvider: storedObject.provider,
      storageKey: storedObject.key,
      storageUrl: storedObject.url
    });
  }

  async listExports(organizationId: string) {
    return this.repository.listExports(organizationId);
  }

  async findExport(exportId: string) {
    return this.repository.findExport(exportId);
  }

  health() {
    return this.repository.health();
  }
}

export const financeService = new FinanceService();
