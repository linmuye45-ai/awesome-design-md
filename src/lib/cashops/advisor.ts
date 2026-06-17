/**
 * CashOps AI advisor — mock tool-calling engine.
 *
 * Simulates an LLM that is wired to the deterministic engines via the tool
 * contract (ai-contract.ts). It NEVER computes money: it routes the question to
 * an intent, "calls" the relevant tools (the deterministic engines), and emits
 * a FIXED-shape AdvisorResponse carrying only i18n keys + params drawn from
 * tool results. If a needed data domain is missing it returns missingData with
 * a connect hint instead of guessing. Compliance questions trigger a
 * disclaimer and offer no formal tax/legal/lending advice.
 */

import type { AdvisorIntent, AdvisorResponse, KeyedText, ToolName } from "./ai-contract";
import type {
  BankPosition,
  BusinessAction,
  ConfidenceLevel,
  DataDomain,
  ForecastResult,
  Payable,
  Receivable,
} from "./domain";
import { agingSummary, collectionTargets, totalOverdue } from "./collections";
import { payablePlans, upcomingAp } from "./payables";
import type { DashboardMetrics } from "./metrics";

export interface AdvisorContext {
  bank: BankPosition | null;
  receivables: Receivable[];
  payables: Payable[];
  actions: BusinessAction[];
  forecast: ForecastResult | null;
  metrics: DashboardMetrics | null;
  /** Domains that have at least one connected data source. */
  connectedDomains: Set<DataDomain | "forecast" | "metrics">;
  now: Date;
}

const COMPLIANCE_RX =
  /\b(tax|taxes|legal|lawyer|attorney|lawsuit|loan|lending|borrow|mortgage|irs|audit\s+risk|deduct|write[- ]off)\b/i;

function classifyIntent(text: string): AdvisorIntent {
  const q = text.toLowerCase();
  if (COMPLIANCE_RX.test(q)) return "compliance_question";
  if (/\b(draft|message|write|remind|chase|email|sms|whatsapp)\b/.test(q)) return "draft_request";
  if (/\b(collect|overdue|receivable|invoice|owe|owes|chase|ar\b)/.test(q))
    return "collections_query";
  if (/\b(pay|payable|vendor|supplier|bill|ap\b|delay)/.test(q)) return "payables_query";
  if (/\b(forecast|13[- ]week|runway|cash\s*flow|cashflow|gap|breach|safety)/.test(q))
    return "forecast_query";
  if (/\b(metric|dso|kpi|dashboard|accuracy|recovered)/.test(q)) return "metrics_query";
  if (/\b(cash|balance|bank|how much|money)/.test(q)) return "cash_position";
  return "unknown";
}

function missingFor(
  domains: (DataDomain | "forecast" | "metrics")[],
  ctx: AdvisorContext
): AdvisorResponse["missingData"] {
  const missing: AdvisorResponse["missingData"] = [];
  for (const d of domains) {
    if (!ctx.connectedDomains.has(d)) {
      missing.push({ domainKey: `ai.missing.${d}`, connectKey: `ai.connect.${d}` });
    }
  }
  return missing;
}

export function runAdvisor(text: string, ctx: AdvisorContext): AdvisorResponse {
  const intent = classifyIntent(text);
  const base: AdvisorResponse = {
    intent,
    answer: { key: "ai.answer.unknown" },
    evidence: [],
    draftActions: [],
    usedTools: [],
    missingData: [],
    confidence: "medium",
    needsDisclaimer: false,
  };

  switch (intent) {
    case "cash_position":
      return cashPosition(ctx, base);
    case "forecast_query":
      return forecastQuery(ctx, base);
    case "collections_query":
      return collectionsQuery(ctx, base);
    case "payables_query":
      return payablesQuery(ctx, base);
    case "metrics_query":
      return metricsQuery(ctx, base);
    case "draft_request":
      return draftRequest(ctx, base);
    case "compliance_question":
      return complianceQuestion(base);
    case "unknown":
    default:
      return {
        ...base,
        answer: { key: "ai.answer.unknown" },
        evidence: [{ key: "ai.ev.tryAsking" }],
      };
  }
}

function cashPosition(ctx: AdvisorContext, base: AdvisorResponse): AdvisorResponse {
  const usedTools: ToolName[] = ["getBankPosition"];
  const missingData = missingFor(["bank"], ctx);
  if (!ctx.bank || missingData.length) {
    return {
      ...base,
      usedTools,
      missingData,
      answer: { key: "ai.answer.noBank" },
      confidence: "low",
    };
  }
  const evidence: KeyedText[] = [
    { key: "ai.ev.bankBalance", params: { amount: ctx.bank.balance } },
  ];
  if (ctx.forecast) {
    usedTools.push("getForecast");
    evidence.push({ key: "ai.ev.lowestCash", params: { amount: ctx.forecast.lowestCash } });
  }
  return {
    ...base,
    usedTools,
    answer: { key: "ai.answer.cashPosition", params: { amount: ctx.bank.balance } },
    evidence,
    confidence: ctx.forecast?.confidence ?? "medium",
  };
}

function forecastQuery(ctx: AdvisorContext, base: AdvisorResponse): AdvisorResponse {
  const usedTools: ToolName[] = ["getForecast"];
  const missingData = missingFor(["forecast"], ctx);
  if (!ctx.forecast || missingData.length) {
    return {
      ...base,
      usedTools,
      missingData,
      answer: { key: "ai.answer.noForecast" },
      confidence: "low",
    };
  }
  const f = ctx.forecast;
  const breached = f.breachWeekStart !== null;
  const evidence: KeyedText[] = [
    { key: "ai.ev.lowestCash", params: { amount: f.lowestCash } },
    { key: "ai.ev.safetyLine", params: { amount: f.safetyLine } },
  ];
  for (const d of f.topDrivers.slice(0, 3)) {
    evidence.push({ key: d.key, params: d.params });
  }
  return {
    ...base,
    usedTools,
    answer: {
      key: breached ? "ai.answer.forecastRisk" : "ai.answer.forecastSafe",
      params: { lowest: f.lowestCash, safety: f.safetyLine },
    },
    evidence,
    risk: breached ? { key: "ai.risk.breach" } : undefined,
    riskLevel: f.riskLevel,
    recommendation: breached ? { key: "ai.next.collectFirst" } : undefined,
    draftActions: breached ? ["collect_payment", "delay_payment"] : [],
    confidence: f.confidence,
  };
}

function collectionsQuery(ctx: AdvisorContext, base: AdvisorResponse): AdvisorResponse {
  const usedTools: ToolName[] = ["getReceivablesAging", "getCollectionTargets"];
  const missingData = missingFor(["ar"], ctx);
  if (missingData.length) {
    return {
      ...base,
      usedTools,
      missingData,
      answer: { key: "ai.answer.noAr" },
      confidence: "low",
    };
  }
  const overdue = totalOverdue(ctx.receivables, ctx.now);
  const targets = collectionTargets(ctx.receivables, ctx.now, 3);
  const aging = agingSummary(ctx.receivables, ctx.now);
  const ninetyPlus = aging.find((a) => a.bucket === "90_plus");
  const evidence: KeyedText[] = [{ key: "ai.ev.overdueAr", params: { amount: overdue } }];
  for (const tgt of targets) {
    evidence.push({
      key: "ai.ev.target",
      params: {
        name: tgt.receivable.customerName,
        amount: tgt.expectedRecoveryAmount,
        days: tgt.daysOverdue,
      },
    });
  }
  const confidence: ConfidenceLevel =
    targets.length >= 2 ? "high" : targets.length === 1 ? "medium" : "low";
  return {
    ...base,
    usedTools,
    answer: { key: "ai.answer.collections", params: { amount: overdue, count: targets.length } },
    evidence,
    risk:
      ninetyPlus && ninetyPlus.amount > 0
        ? { key: "ai.risk.staleAr", params: { amount: ninetyPlus.amount } }
        : undefined,
    recommendation: targets.length
      ? { key: "ai.next.collectTop", params: { name: targets[0].receivable.customerName } }
      : undefined,
    draftActions: targets.length ? ["collect_payment"] : [],
    confidence,
  };
}

function payablesQuery(ctx: AdvisorContext, base: AdvisorResponse): AdvisorResponse {
  const usedTools: ToolName[] = ["getPayablesPlan"];
  const missingData = missingFor(["ap"], ctx);
  if (missingData.length) {
    return {
      ...base,
      usedTools,
      missingData,
      answer: { key: "ai.answer.noAp" },
      confidence: "low",
    };
  }
  const plans = payablePlans(ctx.payables, ctx.now);
  const negotiable = plans.filter((p) => p.treatment !== "must_pay");
  const upcoming = upcomingAp(ctx.payables, ctx.now, 14);
  const evidence: KeyedText[] = [{ key: "ai.ev.upcomingAp", params: { amount: upcoming } }];
  for (const pl of negotiable.slice(0, 3)) {
    evidence.push({
      key: "ai.ev.payablePlan",
      params: {
        name: pl.payable.vendorName,
        amount: pl.payable.amount,
        days: pl.suggestedDelayDays,
      },
    });
  }
  return {
    ...base,
    usedTools,
    answer: { key: "ai.answer.payables", params: { amount: upcoming, count: negotiable.length } },
    evidence,
    recommendation: negotiable.length
      ? { key: "ai.next.negotiate", params: { name: negotiable[0].payable.vendorName } }
      : undefined,
    draftActions: negotiable.length ? ["delay_payment", "supplier_negotiation"] : [],
    confidence: "high",
  };
}

function metricsQuery(ctx: AdvisorContext, base: AdvisorResponse): AdvisorResponse {
  const usedTools: ToolName[] = ["getMetrics"];
  const missingData = missingFor(["metrics"], ctx);
  if (!ctx.metrics || missingData.length) {
    return {
      ...base,
      usedTools,
      missingData,
      answer: { key: "ai.answer.noMetrics" },
      confidence: "low",
    };
  }
  const m = ctx.metrics;
  return {
    ...base,
    usedTools,
    answer: { key: "ai.answer.metrics", params: { runway: m.daysCashRunway, dso: m.dso } },
    evidence: [
      { key: "ai.ev.cashAtRisk", params: { amount: m.cashAtRisk } },
      { key: "ai.ev.expectedRecovered", params: { amount: m.expectedRecoveredCash } },
      { key: "ai.ev.dso", params: { days: m.dso } },
    ],
    confidence: "high",
  };
}

function draftRequest(ctx: AdvisorContext, base: AdvisorResponse): AdvisorResponse {
  const usedTools: ToolName[] = ["getCollectionTargets", "draftCollectionMessage"];
  const missingData = missingFor(["ar"], ctx);
  if (missingData.length) {
    return {
      ...base,
      usedTools,
      missingData,
      answer: { key: "ai.answer.noAr" },
      confidence: "low",
    };
  }
  const targets = collectionTargets(ctx.receivables, ctx.now, 1);
  if (!targets.length) {
    return {
      ...base,
      usedTools,
      answer: { key: "ai.answer.noOverdue" },
      evidence: [{ key: "ai.ev.draftFirst" }],
      confidence: "medium",
    };
  }
  const t = targets[0];
  return {
    ...base,
    usedTools,
    answer: {
      key: "ai.answer.draftReady",
      params: { name: t.receivable.customerName, amount: t.expectedRecoveryAmount },
    },
    evidence: [{ key: "ai.ev.draftFirst" }],
    recommendation: { key: "ai.next.reviewDraft" },
    draftActions: ["collect_payment"],
    confidence: "high",
  };
}

function complianceQuestion(base: AdvisorResponse): AdvisorResponse {
  return {
    ...base,
    answer: { key: "ai.answer.compliance" },
    evidence: [{ key: "ai.ev.operationalOnly" }],
    recommendation: { key: "ai.next.consultPro" },
    confidence: "medium",
    needsDisclaimer: true,
  };
}

export const SAMPLE_QUESTION_KEYS = [
  "advisor.sample.runway",
  "advisor.sample.collections",
  "advisor.sample.payables",
  "advisor.sample.draft",
  "advisor.sample.metrics",
] as const;
