import type {
  Transaction,
  Receivable,
  Payable,
  Customer,
  Employee,
  LedgerStatus,
  CustomerSegment,
} from "../types";
import { todayTotals, cashflowForecast, dailyRevenueSeries } from "../repositories/analytics";
import { realNowIso } from "../clock";

/**
 * Tool layer for AI tool-calling. In production these are server functions the
 * LLM can invoke. Here they read from an in-memory store snapshot. Signatures
 * mirror a real tool schema so swapping in a real API is trivial.
 */

export interface ToolContext {
  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  customers: Customer[];
  employees: Employee[];
}

export function getRevenueSummary(ctx: ToolContext, _dateRange?: { from: string; to: string }) {
  void _dateRange;
  const today = todayTotals(ctx.transactions);
  const series = dailyRevenueSeries(ctx.transactions, 7);
  const monthRevenue = ctx.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  return { today, series, monthRevenue };
}

export function getExpenseSummary(ctx: ToolContext, _dateRange?: { from: string; to: string }) {
  void _dateRange;
  const byCategory: Record<string, number> = {};
  for (const t of ctx.transactions) {
    if (t.type === "expense") byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }
  return { byCategory, today: todayTotals(ctx.transactions).expenses };
}

export function getCashflowForecast(ctx: ToolContext, days: number) {
  return cashflowForecast(ctx.receivables, ctx.payables, days);
}

export function getReceivables(ctx: ToolContext, status?: LedgerStatus) {
  return ctx.receivables.filter((r) => (status ? r.status === status : true));
}

export function getPayables(ctx: ToolContext, status?: LedgerStatus) {
  return ctx.payables.filter((p) => (status ? p.status === status : true));
}

export function getTopProducts(_ctx: ToolContext, _metric: "revenue" | "volume" = "revenue") {
  void _ctx;
  void _metric;
  // Demo placeholder — product names referenced via i18n keys, no raw prose.
  return [
    { nameKey: "mock.product.beefNoodles", revenue: 12800 },
    { nameKey: "mock.product.dumplings", revenue: 7400 },
    { nameKey: "mock.product.coldDrinks", revenue: 3100 },
  ];
}

export function getEmployeeAttendance(ctx: ToolContext, employeeId?: string) {
  return ctx.employees
    .filter((e) => (employeeId ? e.id === employeeId : true))
    .map((e) => ({ id: e.id, nameKey: e.nameKey, clockedInToday: !!e.clockedInToday }));
}

export function getCustomerRiskSegments(ctx: ToolContext) {
  const groups: Record<CustomerSegment, Customer[]> = {
    high_value: [],
    new: [],
    at_risk: [],
    price_sensitive: [],
    dormant: [],
  };
  for (const c of ctx.customers) groups[c.riskSegment].push(c);
  return groups;
}

export function draftMessage(
  type: string,
  recipient: string,
  context: string
): { type: string; recipient: string; draftKey: string; context: string } {
  return { type, recipient, draftKey: `mock.action.${type}.draft`, context };
}

export function createTask(assignee: string, title: string, dueDate: string) {
  return { id: `task_${Date.now()}`, assignee, title, dueDate, status: "open" as const };
}

export function logAiRecommendation(recommendation: string) {
  return { logged: true, recommendation, at: realNowIso() };
}
