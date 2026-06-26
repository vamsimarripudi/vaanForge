import { financeService } from "../finance/finance.service";
import type { ReportFormat, ReportType } from "../finance/finance.repository";

export class ReportsService {
  reportsOs() {
    return {
      reportCatalog: [
        { reportType: "PNL", label: "P&L report", source: "/api/v1/finance/pnl" },
        { reportType: "GST", label: "GST report", source: "/api/v1/finance/gst" },
        { reportType: "CASH_FLOW", label: "Cash flow report", source: "/api/v1/finance/cash-flow" },
        { reportType: "SALES", label: "Sales report", source: "/api/v1/crm/sales-operations" },
        { reportType: "HIRING", label: "Hiring report", source: "/api/v1/hr/team-operations" },
        { reportType: "SUPPORT", label: "Support report", source: "/api/v1/support/operations" },
        { reportType: "COMPLIANCE", label: "Compliance report", source: "/api/v1/compliance/operating-system" },
        { reportType: "FOUNDER_MONTHLY", label: "Founder monthly report", source: "/api/v1/dashboard/founder" }
      ],
      downloadFormats: [
        { format: "EXCEL", label: "Excel download", route: "/api/v1/reports/exports" },
        { format: "PDF", label: "PDF download", route: "/api/v1/reports/exports" }
      ],
      suiteSeparation: {
        education: ["Institution activity", "Meetings", "Forms", "Support", "Subscription usage"],
        vmetron: ["Events", "Registrations", "Meetings", "Forms", "Promotions", "Support"],
        founderCombined: ["Revenue", "Usage", "Support", "Compliance", "Monthly founder report"]
      }
    };
  }

  async queueExport(organizationId: string, reportType: ReportType, format: ReportFormat) {
    return financeService.queueExport(organizationId, reportType, format);
  }

  async listExports(organizationId: string) {
    return financeService.listExports(organizationId);
  }

  async findExport(exportId: string) {
    return financeService.findExport(exportId);
  }
}

export const reportsService = new ReportsService();
