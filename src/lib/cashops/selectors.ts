/**
 * Derived selectors that turn raw store state into engine inputs/outputs.
 * Keeps the deterministic-engine wiring in one place so every page (forecast,
 * dashboard, advisor) computes from the SAME inputs.
 */

import type { DataDomain, ForecastResult, ScenarioId } from "./domain";
import { runForecast, type ForecastInputs } from "./forecast";
import { computeMetrics, type DashboardMetrics } from "./metrics";
import { INDUSTRY_BASELINES } from "./demo-data";
import type { AdvisorContext } from "./advisor";
import type { useAppStore } from "@/lib/store";

type StoreState = ReturnType<typeof useAppStore.getState>;

/** Build the forecast engine inputs from store state. */
export function forecastInputsFromState(state: StoreState, now: Date): ForecastInputs | null {
  const { business, bank } = state;
  if (!business || !bank) return null;
  const baseline = INDUSTRY_BASELINES[business.industry];
  return {
    bank,
    receivables: state.receivables,
    payables: state.payables,
    recurring: state.recurring,
    oneOffs: state.oneOffs,
    safetyLine: business.cashSafetyLine,
    weeklyBaselineRevenue: baseline.revenue,
    weeklyBaselineCost: baseline.cost,
    taxReserveRate: business.taxReserveRate,
    currency: business.currency,
    now,
  };
}

export function selectForecast(
  state: StoreState,
  now: Date,
  scenario: ScenarioId = "base"
): ForecastResult | null {
  const inputs = forecastInputsFromState(state, now);
  if (!inputs) return null;
  return runForecast(inputs, scenario);
}

export function selectMetrics(state: StoreState, now: Date): DashboardMetrics | null {
  const { business, bank } = state;
  if (!business || !bank) return null;
  const forecast = selectForecast(state, now, "base");
  if (!forecast) return null;
  const baseline = INDUSTRY_BASELINES[business.industry];
  return computeMetrics({
    bank,
    receivables: state.receivables,
    payables: state.payables,
    actions: state.actions,
    forecast,
    weeklyBaselineRevenue: baseline.revenue,
    now,
  });
}

/** Which data domains currently have a connected source (for missingData). */
export function connectedDomains(state: StoreState): Set<DataDomain | "forecast" | "metrics"> {
  const set = new Set<DataDomain | "forecast" | "metrics">();
  for (const ds of state.dataSources) {
    if (ds.status === "disconnected") continue;
    for (const d of ds.domains) set.add(d);
  }
  if (state.bank) set.add("forecast").add("metrics");
  return set;
}

export function advisorContextFromState(state: StoreState, now: Date): AdvisorContext {
  return {
    bank: state.bank,
    receivables: state.receivables,
    payables: state.payables,
    actions: state.actions,
    forecast: selectForecast(state, now, "base"),
    metrics: selectMetrics(state, now),
    connectedDomains: connectedDomains(state),
    now,
  };
}
