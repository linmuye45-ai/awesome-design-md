/**
 * Dashboard metrics engine (deterministic).
 *
 * Computes the headline operating metrics from grounded records + the forecast.
 * Every number here is reproducible and click-through-able; the AI advisor may
 * cite these but never recomputes them.
 *
 * Metrics: cash at risk, expected recovered cash, actions approved/executed,
 * days cash runway, DSO, overdue AR, upcoming AP, and a forecast-accuracy
 * estimate.
 */

import type { BankPosition, BusinessAction, ForecastResult, Payable, Receivable } from "./domain";
import { expectedRecoveredCash, outstandingOf, totalOverdue } from "./collections";
import { upcomingAp } from "./payables";

export interface DashboardMetrics {
  /** Cash projected below the safety line at the trough (0 if never breached). */
  cashAtRisk: number;
  expectedRecoveredCash: number;
  actionsApproved: number;
  actionsExecuted: number;
  /** Weeks of runway until cash would hit zero in the base forecast (capped 13+). */
  daysCashRunway: number;
  /** Days Sales Outstanding (AR / avg daily revenue). */
  dso: number;
  overdueAr: number;
  upcomingAp: number;
  /** 0..1 estimate of how reliable the forecast is given data coverage. */
  forecastAccuracy: number;
}

const DAY = 24 * 60 * 60 * 1000;

/** Runway in DAYS: how long until the base-forecast cash curve hits zero. */
function runwayDays(forecast: ForecastResult, now: Date): number {
  for (const w of forecast.weeks) {
    if (w.closingCash <= 0) {
      const end = new Date(w.weekStart).getTime() + 7 * DAY;
      return Math.max(0, Math.round((end - now.getTime()) / DAY));
    }
  }
  // Never hits zero within the horizon.
  return forecast.weeks.length * 7;
}

/** DSO = (total AR / trailing daily revenue). */
function computeDso(receivables: Receivable[], weeklyBaselineRevenue: number): number {
  const totalAr = receivables
    .filter((r) => r.status !== "paid" && r.status !== "written_off")
    .reduce((s, r) => s + outstandingOf(r), 0);
  const dailyRevenue = weeklyBaselineRevenue / 7;
  if (dailyRevenue <= 0) return 0;
  return Math.round(totalAr / dailyRevenue);
}

/**
 * Forecast accuracy estimate from data coverage + confidence. A heuristic
 * stand-in for back-tested accuracy until real outcome data exists.
 */
function accuracyFromConfidence(forecast: ForecastResult): number {
  switch (forecast.confidence) {
    case "high":
      return 0.88;
    case "medium":
      return 0.74;
    case "low":
    default:
      return 0.6;
  }
}

export function computeMetrics(input: {
  bank: BankPosition;
  receivables: Receivable[];
  payables: Payable[];
  actions: BusinessAction[];
  forecast: ForecastResult;
  weeklyBaselineRevenue: number;
  now: Date;
}): DashboardMetrics {
  const { receivables, payables, actions, forecast, weeklyBaselineRevenue, now } = input;

  const cashAtRisk =
    forecast.lowestCash < forecast.safetyLine
      ? Math.round(forecast.safetyLine - forecast.lowestCash)
      : 0;

  return {
    cashAtRisk,
    expectedRecoveredCash: expectedRecoveredCash(receivables, now),
    actionsApproved: actions.filter((a) => a.status === "approved").length,
    actionsExecuted: actions.filter((a) => a.status === "executed").length,
    daysCashRunway: runwayDays(forecast, now),
    dso: computeDso(receivables, weeklyBaselineRevenue),
    overdueAr: totalOverdue(receivables, now),
    upcomingAp: upcomingAp(payables, now, 14),
    forecastAccuracy: accuracyFromConfidence(forecast),
  };
}
