export interface RevenueInput {
  organizationId: string;
  source: string;
  amount: number;
  receivedAt: string;
  product?: string;
}

export interface ExpenseInput {
  organizationId: string;
  category: string;
  amount: number;
  spentAt: string;
  vendor?: string;
}

export interface FinanceSummary {
  revenueTotal: number;
  expenseTotal: number;
  grossProfit: number;
  profitMarginPercent: number;
  gstPayable: number;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}

export const calculateProfitMargin = (revenueTotal: number, grossProfit: number) => {
  if (revenueTotal <= 0) {
    return 0;
  }
  return Number(((grossProfit / revenueTotal) * 100).toFixed(2));
};

export const calculateGstPayable = (revenueTotal: number, expenseTotal: number, gstRate = 0.18) => {
  const outputGst = revenueTotal * gstRate;
  const inputCredit = expenseTotal * gstRate;
  return Number(Math.max(outputGst - inputCredit, 0).toFixed(2));
};
