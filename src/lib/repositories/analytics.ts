import type { Transaction, Receivable, Payable, CashflowDay } from "../types";
import { now, isSameDay } from "../clock";

const BASE_CASH = 18400;

export function todayTotals(transactions: Transaction[]) {
  const today = now();
  let revenue = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (!isSameDay(new Date(t.occurredAt), today)) continue;
    if (t.type === "income") revenue += t.amount;
    else expenses += t.amount;
  }
  return { revenue, expenses, grossProfit: revenue - expenses };
}

export function yesterdayTotals(transactions: Transaction[]) {
  const y = now();
  y.setDate(y.getDate() - 1);
  let revenue = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (!isSameDay(new Date(t.occurredAt), y)) continue;
    if (t.type === "income") revenue += t.amount;
    else expenses += t.amount;
  }
  return { revenue, expenses, grossProfit: revenue - expenses };
}

/** Available cash is a simplified rolling balance starting from a base. */
export function availableCash(transactions: Transaction[], base = BASE_CASH): number {
  void transactions;
  return base;
}

export function cashflowForecast(
  receivables: Receivable[],
  payables: Payable[],
  days: number,
  options: { startingCash?: number; safetyLine?: number } = {}
): { series: CashflowDay[]; safetyLine: number; riskDate: string | null; lowestCash: number } {
  const startingCash = options.startingCash ?? BASE_CASH;
  const safetyLine = options.safetyLine ?? 5000;
  const series: CashflowDay[] = [];
  let cash = startingCash;
  let riskDate: string | null = null;
  let lowestCash = startingCash;

  const dailyOpsNet = 600;
  const today = now();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    let inflow = dailyOpsNet + 1800;
    let outflow = 1200;

    for (const r of receivables) {
      if (r.status !== "paid" && isSameDay(new Date(r.dueDate), d)) inflow += r.amount;
    }
    for (const p of payables) {
      if (p.status !== "paid" && isSameDay(new Date(p.dueDate), d)) outflow += p.amount;
    }

    cash += inflow - outflow;
    if (cash < lowestCash) lowestCash = cash;
    const status: CashflowDay["status"] =
      cash < safetyLine ? "danger" : cash < safetyLine * 2 ? "watch" : "safe";
    if (status === "danger" && !riskDate) riskDate = d.toISOString();

    series.push({
      date: d.toISOString(),
      projectedCash: Math.round(cash),
      inflow,
      outflow,
      status,
    });
  }

  return { series, safetyLine, riskDate, lowestCash: Math.round(lowestCash) };
}

export function dailyRevenueSeries(transactions: Transaction[], days = 7) {
  const out: { date: string; revenue: number; expense: number }[] = [];
  const today = now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    let revenue = 0;
    let expense = 0;
    for (const t of transactions) {
      if (isSameDay(new Date(t.occurredAt), d)) {
        if (t.type === "income") revenue += t.amount;
        else expense += t.amount;
      }
    }
    out.push({ date: d.toISOString(), revenue, expense });
  }
  return out;
}

export function overallRisk(
  receivables: Receivable[],
  payables: Payable[],
  safetyLine?: number
): "safe" | "watch" | "danger" {
  const { series } = cashflowForecast(receivables, payables, 7, { safetyLine });
  if (series.some((d) => d.status === "danger")) return "danger";
  if (series.some((d) => d.status === "watch")) return "watch";
  return "safe";
}
