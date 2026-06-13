import type { Transaction, Receivable, Payable } from "../types";
import { todayTotals, cashflowForecast } from "./analytics";
import { totalOutstanding as receivablesOutstanding } from "./receivables";
import { totalOutstanding as payablesOutstanding } from "./payables";

/**
 * Aggregates the headline numbers for the monthly report. The report COPY is
 * fully localized via i18n keys at render time (advisor language); this layer
 * only computes the figures.
 */
export function monthlyReportMetrics(
  transactions: Transaction[],
  receivables: Receivable[],
  payables: Payable[]
) {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const grossProfit = income - expense;
  const margin = income > 0 ? grossProfit / income : 0;
  const { riskDate, lowestCash } = cashflowForecast(receivables, payables, 14);

  return {
    income,
    expense,
    grossProfit,
    margin,
    today: todayTotals(transactions),
    openReceivables: receivablesOutstanding(receivables),
    openPayables: payablesOutstanding(payables),
    riskDate,
    lowestCash,
  };
}
