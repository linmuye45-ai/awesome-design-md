/**
 * Deterministic 13-week cashflow forecast engine.
 *
 * IMPORTANT: this is the ONLY place cash figures are produced. The AI advisor
 * may explain these numbers but must never compute them. Given identical
 * inputs the output is fully reproducible.
 *
 * Inputs: bank balance, AR (with due dates + expected recovery), AP (with due
 * dates), payroll / rent / tax reserve, recurring expenses, known one-off cash
 * movements, and a light seasonality curve. Output: 13 weekly buckets with
 * opening/closing cash, the lowest-cash week, the first safety-line breach,
 * a risk level, a confidence level, and the top 5 drivers — every number
 * carrying click-through evidence.
 */

import type {
  BankPosition,
  Receivable,
  Payable,
  RecurringExpense,
  OneOffCashMovement,
  ForecastResult,
  ForecastWeek,
  ForecastEvidence,
  ForecastDriver,
  ScenarioId,
  RiskLevel,
  ConfidenceLevel,
} from "./domain";

const HORIZON_WEEKS = 13;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export interface ForecastInputs {
  bank: BankPosition;
  receivables: Receivable[];
  payables: Payable[];
  recurring: RecurringExpense[];
  oneOffs: OneOffCashMovement[];
  safetyLine: number;
  /** Average weekly operating revenue (steady-state sales). */
  weeklyBaselineRevenue: number;
  /** Average weekly operating cash costs (COGS + variable). */
  weeklyBaselineCost: number;
  taxReserveRate: number;
  currency: string;
  /** Anchor "now" — injected so demo mode stays deterministic. */
  now: Date;
}

/** Scenario multipliers applied deterministically (no randomness). */
interface ScenarioParams {
  /** Shift AR collection later by N weeks. */
  collectionDelayWeeks: number;
  /** Fraction of AR that slips entirely out of the horizon. */
  collectionSlipRate: number;
  /** Multiply baseline revenue. */
  revenueMultiplier: number;
  /** Add an extra payroll-sized outflow in an early week. */
  extraPayrollWeek: number | null;
  /** Defer flexible payables by N weeks. */
  payableDeferWeeks: number;
}

function scenarioParams(scenario: ScenarioId, weeklyPayroll: number): ScenarioParams {
  switch (scenario) {
    case "late_collections":
      return {
        collectionDelayWeeks: 3,
        collectionSlipRate: 0.15,
        revenueMultiplier: 1,
        extraPayrollWeek: null,
        payableDeferWeeks: 0,
      };
    case "delayed_payables":
      return {
        collectionDelayWeeks: 0,
        collectionSlipRate: 0,
        revenueMultiplier: 1,
        extraPayrollWeek: null,
        payableDeferWeeks: 2,
      };
    case "payroll_heavy":
      return {
        collectionDelayWeeks: 0,
        collectionSlipRate: 0,
        revenueMultiplier: 1,
        extraPayrollWeek: weeklyPayroll > 0 ? 2 : null,
        payableDeferWeeks: 0,
      };
    case "sales_downturn":
      return {
        collectionDelayWeeks: 1,
        collectionSlipRate: 0.05,
        revenueMultiplier: 0.7,
        extraPayrollWeek: null,
        payableDeferWeeks: 0,
      };
    case "base":
    default:
      return {
        collectionDelayWeeks: 0,
        collectionSlipRate: 0,
        revenueMultiplier: 1,
        extraPayrollWeek: null,
        payableDeferWeeks: 0,
      };
  }
}

/** Light, fixed seasonality curve over 13 weeks (sums to ~13). */
const SEASONALITY: number[] = [1.0, 1.0, 1.05, 1.05, 0.95, 0.95, 1.0, 1.0, 1.1, 1.1, 0.9, 0.9, 1.0];

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  // Week starts Monday.
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function weekIndexFor(date: Date, anchorWeekStart: Date): number {
  return Math.floor((date.getTime() - anchorWeekStart.getTime()) / MS_PER_WEEK);
}

export function runForecast(inputs: ForecastInputs, scenario: ScenarioId = "base"): ForecastResult {
  const anchorWeekStart = startOfWeek(inputs.now);
  const weeklyPayroll =
    inputs.recurring.filter((r) => r.kind === "payroll").reduce((s, r) => s + r.amount, 0) / 4.33;
  const params = scenarioParams(scenario, weeklyPayroll);

  // Build empty weeks.
  const weeks: ForecastWeek[] = [];
  for (let i = 0; i < HORIZON_WEEKS; i++) {
    const weekStart = new Date(anchorWeekStart.getTime() + i * MS_PER_WEEK);
    weeks.push({
      weekIndex: i,
      weekStart: weekStart.toISOString(),
      openingCash: 0,
      inflow: 0,
      outflow: 0,
      closingCash: 0,
      belowSafetyLine: false,
      evidence: [],
    });
  }

  const addEvidence = (
    wi: number,
    direction: "inflow" | "outflow",
    amount: number,
    key: string,
    p?: Record<string, string | number>
  ) => {
    if (wi < 0 || wi >= HORIZON_WEEKS || amount === 0) return;
    const week = weeks[wi];
    if (direction === "inflow") week.inflow += amount;
    else week.outflow += amount;
    const ev: ForecastEvidence = { key, params: p, amount, direction };
    week.evidence.push(ev);
  };

  // Baseline operating revenue / cost with seasonality + scenario multiplier.
  for (let i = 0; i < HORIZON_WEEKS; i++) {
    const season = SEASONALITY[i] ?? 1;
    const rev = Math.round(inputs.weeklyBaselineRevenue * season * params.revenueMultiplier);
    const cost = Math.round(inputs.weeklyBaselineCost * season);
    addEvidence(i, "inflow", rev, "forecast.ev.operatingRevenue", { week: i + 1 });
    addEvidence(i, "outflow", cost, "forecast.ev.operatingCost", { week: i + 1 });
    // Tax reserve set aside on revenue (cash leaves operating cash).
    const taxReserve = Math.round(rev * inputs.taxReserveRate);
    addEvidence(i, "outflow", taxReserve, "forecast.ev.taxReserve", { week: i + 1 });
  }

  // Receivables: land in the week of due date (+ scenario delay), with slip.
  for (const r of inputs.receivables) {
    if (r.status === "paid" || r.status === "written_off") continue;
    const outstanding = r.amount - r.amountPaid;
    if (outstanding <= 0) continue;
    const expected = Math.round(
      outstanding * r.expectedRecoveryRate * (1 - params.collectionSlipRate)
    );
    const due = new Date(r.dueDate);
    const wi = weekIndexFor(due, anchorWeekStart) + params.collectionDelayWeeks;
    addEvidence(wi, "inflow", expected, "forecast.ev.receivable", {
      name: r.customerName,
      invoice: r.invoiceNumber,
    });
  }

  // Payables: land in the week of due date (+ defer for flexible vendors).
  for (const p of inputs.payables) {
    if (p.status === "paid") continue;
    const due = new Date(p.dueDate);
    let wi = weekIndexFor(due, anchorWeekStart);
    if (p.flexible) wi += params.payableDeferWeeks;
    addEvidence(wi, "outflow", p.amount, "forecast.ev.payable", { name: p.vendorName });
  }

  // Recurring expenses: place on their day-of-month within the horizon.
  for (const rec of inputs.recurring) {
    for (let m = 0; m <= 3; m++) {
      const d = new Date(anchorWeekStart);
      d.setMonth(d.getMonth() + m);
      d.setDate(Math.min(rec.dayOfMonth, 28));
      const wi = weekIndexFor(d, anchorWeekStart);
      addEvidence(wi, "outflow", rec.amount, rec.labelKey);
    }
  }

  // Scenario: an extra payroll-sized outflow in an early week.
  if (params.extraPayrollWeek !== null && weeklyPayroll > 0) {
    addEvidence(
      params.extraPayrollWeek,
      "outflow",
      Math.round(weeklyPayroll * 4.33),
      "forecast.ev.extraPayroll"
    );
  }

  // One-off known cash movements.
  for (const o of inputs.oneOffs) {
    const wi = weekIndexFor(new Date(o.date), anchorWeekStart);
    if (o.amount >= 0) addEvidence(wi, "inflow", o.amount, o.labelKey);
    else addEvidence(wi, "outflow", -o.amount, o.labelKey);
  }

  // Roll forward cash balances.
  let cash = inputs.bank.balance;
  let lowestCash = cash;
  let lowestCashWeekStart = weeks[0]?.weekStart ?? inputs.now.toISOString();
  let breachWeekStart: string | null = null;
  for (const w of weeks) {
    w.openingCash = Math.round(cash);
    cash += w.inflow - w.outflow;
    w.closingCash = Math.round(cash);
    w.belowSafetyLine = w.closingCash < inputs.safetyLine;
    if (w.closingCash < lowestCash) {
      lowestCash = w.closingCash;
      lowestCashWeekStart = w.weekStart;
    }
    if (w.belowSafetyLine && !breachWeekStart) breachWeekStart = w.weekStart;
  }

  const riskLevel = computeRisk(lowestCash, inputs.safetyLine, breachWeekStart, weeks);
  const confidence = computeConfidence(inputs);
  const topDrivers = computeTopDrivers(weeks);

  return {
    scenario,
    currency: inputs.currency,
    startingCash: Math.round(inputs.bank.balance),
    safetyLine: inputs.safetyLine,
    weeks,
    lowestCash: Math.round(lowestCash),
    lowestCashWeekStart,
    breachWeekStart,
    riskLevel,
    confidence,
    topDrivers,
  };
}

function computeRisk(
  lowestCash: number,
  safetyLine: number,
  breachWeekStart: string | null,
  weeks: ForecastWeek[]
): RiskLevel {
  if (lowestCash < 0) return "critical";
  if (breachWeekStart) {
    // How early does it breach? Earlier = more risk.
    const idx = weeks.findIndex((w) => w.weekStart === breachWeekStart);
    return idx <= 4 ? "at_risk" : "watch";
  }
  if (lowestCash < safetyLine * 1.5) return "watch";
  return "safe";
}

function computeConfidence(inputs: ForecastInputs): ConfidenceLevel {
  // Confidence rises with the number of grounded records feeding the forecast.
  const records = inputs.receivables.length + inputs.payables.length + inputs.recurring.length;
  if (inputs.bank.sourceKind === "manual" || inputs.bank.sourceKind === "csv") {
    return records >= 8 ? "medium" : "low";
  }
  return records >= 6 ? "high" : "medium";
}

function computeTopDrivers(weeks: ForecastWeek[]): ForecastDriver[] {
  // Aggregate evidence by key, summing absolute impact.
  const agg = new Map<string, ForecastDriver>();
  for (const w of weeks) {
    for (const e of w.evidence) {
      const id = `${e.direction}:${e.key}:${JSON.stringify(e.params ?? {})}`;
      const existing = agg.get(id);
      if (existing) existing.amount += e.amount;
      else agg.set(id, { key: e.key, params: e.params, amount: e.amount, direction: e.direction });
    }
  }
  return [...agg.values()].sort((a, b) => b.amount - a.amount).slice(0, 5);
}

export const SCENARIOS: ScenarioId[] = [
  "base",
  "late_collections",
  "delayed_payables",
  "payroll_heavy",
  "sales_downturn",
];
