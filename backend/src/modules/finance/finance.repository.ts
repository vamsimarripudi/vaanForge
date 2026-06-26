import type { ExpenseInput, RevenueInput } from "@vmnexus/shared/finance";
import { env } from "../../config/env";
import { createId, store, type StoredExpense, type StoredReportExport, type StoredRevenue } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export type ReportType = "PNL" | "GST" | "CASH_FLOW" | "SALES" | "HIRING" | "SUPPORT" | "COMPLIANCE" | "FOUNDER_MONTHLY" | "CA_EXPORT";
export type ReportFormat = "PDF" | "EXCEL";

export type ReportExportInput = {
  organizationId: string;
  reportType: ReportType;
  format: ReportFormat;
  status: "QUEUED" | "READY" | "FAILED";
  fileName: string;
  mimeType: string;
  content: string;
  storageProvider?: string;
  storageKey?: string;
  storageUrl?: string;
};

export interface FinanceRepository {
  addRevenue(input: RevenueInput): Promise<StoredRevenue> | StoredRevenue;
  addExpense(input: ExpenseInput): Promise<StoredExpense> | StoredExpense;
  listRevenue(organizationId: string): Promise<StoredRevenue[]> | StoredRevenue[];
  listExpenses(organizationId: string): Promise<StoredExpense[]> | StoredExpense[];
  createExport(input: ReportExportInput): Promise<StoredReportExport> | StoredReportExport;
  listExports(organizationId: string): Promise<StoredReportExport[]> | StoredReportExport[];
  findExport(exportId: string): Promise<StoredReportExport | undefined> | StoredReportExport | undefined;
  health(): RepositoryHealth;
}

export class MemoryFinanceRepository implements FinanceRepository {
  addRevenue(input: RevenueInput) {
    const revenue = {
      id: createId("rev"),
      ...input,
      createdAt: new Date().toISOString()
    };
    store.revenues.push(revenue);
    return revenue;
  }

  addExpense(input: ExpenseInput) {
    const expense = {
      id: createId("exp"),
      ...input,
      createdAt: new Date().toISOString()
    };
    store.expenses.push(expense);
    return expense;
  }

  listRevenue(organizationId: string) {
    return store.revenues.filter((item) => item.organizationId === organizationId);
  }

  listExpenses(organizationId: string) {
    return store.expenses.filter((item) => item.organizationId === organizationId);
  }

  createExport(input: ReportExportInput) {
    const reportExport = {
      id: createId("rex"),
      ...input,
      createdAt: new Date().toISOString()
    };
    store.reportExports.push(reportExport);
    return reportExport;
  }

  listExports(organizationId: string) {
    return store.reportExports.filter((item) => item.organizationId === organizationId);
  }

  findExport(exportId: string) {
    return store.reportExports.find((item) => item.id === exportId);
  }

  health(): RepositoryHealth {
    return {
      name: "finance",
      mode: "memory",
      writable: true,
      durable: false
    };
  }
}

export class PrismaFinanceRepository implements FinanceRepository {
  async addRevenue(input: RevenueInput) {
    const revenue = await prisma().revenue.create({
      data: {
        organizationId: input.organizationId,
        source: input.source,
        amount: input.amount,
        receivedAt: new Date(input.receivedAt),
        product: input.product
      }
    });
    return this.toRevenue(revenue);
  }

  async addExpense(input: ExpenseInput) {
    const expense = await prisma().expense.create({
      data: {
        organizationId: input.organizationId,
        category: input.category,
        amount: input.amount,
        spentAt: new Date(input.spentAt),
        vendor: input.vendor
      }
    });
    return this.toExpense(expense);
  }

  async listRevenue(organizationId: string) {
    const revenue = await prisma().revenue.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return revenue.map((item: PrismaRevenue) => this.toRevenue(item));
  }

  async listExpenses(organizationId: string) {
    const expenses = await prisma().expense.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return expenses.map((item: PrismaExpense) => this.toExpense(item));
  }

  async createExport(input: ReportExportInput) {
    const reportExport = await prisma().reportExport.create({ data: input });
    return this.toReportExport(reportExport);
  }

  async listExports(organizationId: string) {
    const exports = await prisma().reportExport.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" }
    });
    return exports.map((item: PrismaReportExport) => this.toReportExport(item));
  }

  async findExport(exportId: string) {
    const reportExport = await prisma().reportExport.findUnique({ where: { id: exportId } });
    return reportExport ? this.toReportExport(reportExport) : undefined;
  }

  health(): RepositoryHealth {
    return {
      name: "finance",
      mode: "postgres",
      writable: true,
      durable: true
    };
  }

  private toRevenue(revenue: PrismaRevenue): StoredRevenue {
    return {
      id: revenue.id,
      organizationId: revenue.organizationId,
      source: revenue.source,
      amount: Number(revenue.amount),
      receivedAt: revenue.receivedAt.toISOString(),
      product: revenue.product ?? undefined,
      createdAt: revenue.createdAt.toISOString()
    };
  }

  private toExpense(expense: PrismaExpense): StoredExpense {
    return {
      id: expense.id,
      organizationId: expense.organizationId,
      category: expense.category,
      amount: Number(expense.amount),
      spentAt: expense.spentAt.toISOString(),
      vendor: expense.vendor ?? undefined,
      createdAt: expense.createdAt.toISOString()
    };
  }

  private toReportExport(reportExport: PrismaReportExport): StoredReportExport {
    return {
      id: reportExport.id,
      organizationId: reportExport.organizationId,
      reportType: this.reportType(reportExport.reportType),
      format: this.reportFormat(reportExport.format),
      status: this.reportStatus(reportExport.status),
      fileName: reportExport.fileName ?? "report-export",
      mimeType: reportExport.mimeType ?? "text/plain",
      content: reportExport.content ?? "",
      storageProvider: reportExport.storageProvider ?? undefined,
      storageKey: reportExport.storageKey ?? undefined,
      storageUrl: reportExport.storageUrl ?? undefined,
      createdAt: reportExport.createdAt.toISOString()
    };
  }

  private reportType(value: string): ReportType {
    return value === "PNL" ||
      value === "GST" ||
      value === "CASH_FLOW" ||
      value === "SALES" ||
      value === "HIRING" ||
      value === "SUPPORT" ||
      value === "COMPLIANCE" ||
      value === "FOUNDER_MONTHLY" ||
      value === "CA_EXPORT"
      ? value
      : "PNL";
  }

  private reportFormat(value: string): ReportFormat {
    return value === "PDF" || value === "EXCEL" ? value : "PDF";
  }

  private reportStatus(value: string): StoredReportExport["status"] {
    return value === "QUEUED" || value === "READY" || value === "FAILED" ? value : "FAILED";
  }
}

type PrismaRevenue = {
  id: string;
  organizationId: string;
  source: string;
  amount: unknown;
  receivedAt: Date;
  product: string | null;
  createdAt: Date;
};

type PrismaExpense = {
  id: string;
  organizationId: string;
  category: string;
  amount: unknown;
  spentAt: Date;
  vendor: string | null;
  createdAt: Date;
};

type PrismaReportExport = {
  id: string;
  organizationId: string;
  reportType: string;
  format: string;
  status: string;
  fileName: string | null;
  mimeType: string | null;
  content: string | null;
  storageProvider: string | null;
  storageKey: string | null;
  storageUrl: string | null;
  createdAt: Date;
};

export const financeRepository: FinanceRepository =
  env.persistenceMode === "postgres" ? new PrismaFinanceRepository() : new MemoryFinanceRepository();
