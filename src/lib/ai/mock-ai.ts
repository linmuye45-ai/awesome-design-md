import type { AiResponse } from "../types";
import { routeIntent } from "./intent-router";
import {
  type ToolContext,
  getRevenueSummary,
  getCashflowForecast,
  getCustomerRiskSegments,
  getEmployeeAttendance,
} from "./tools";
import { buildResponse } from "./response-builder";

/**
 * Mock AI engine. Produces a structured, data-grounded AiResponse that carries
 * i18n KEYS only — never localized prose. The advisor language is applied at
 * render time via `tAdvisor`, so it works identically for all 12 locales and
 * switching advisor language is instant with no re-generation.
 *
 * Drop-in replaceable by a real tool-calling LLM: same input (text + context)
 * -> same AiResponse shape.
 */
export function generateMockResponse(text: string, ctx: ToolContext): AiResponse {
  const intent = routeIntent(text);

  switch (intent) {
    case "finance_query": {
      const { today, monthRevenue } = getRevenueSummary(ctx);
      return buildResponse({
        intent,
        answerKey: "ai.answer.finance",
        answerParams: {
          revenue: today.revenue,
          expenses: today.expenses,
          profit: today.grossProfit,
        },
        evidence: [
          { key: "ai.ev.todayRevenue", params: { amount: today.revenue } },
          { key: "ai.ev.todayExpenses", params: { amount: today.expenses } },
          { key: "ai.ev.monthRevenue", params: { amount: monthRevenue } },
        ],
        riskKey: today.grossProfit < 0 ? "ai.risk.negativeProfit" : undefined,
        nextStepKey: "ai.next.reviewMonth",
        actions: ["monthly_review"],
        usedTools: ["getRevenueSummary"],
      });
    }

    case "cashflow_forecast": {
      const { riskDate, safetyLine, lowestCash } = getCashflowForecast(ctx, 14);
      const openReceivables = ctx.receivables.filter((r) => r.status !== "paid");
      return buildResponse({
        intent,
        answerKey: riskDate ? "ai.answer.cashflowRisk" : "ai.answer.cashflowSafe",
        answerParams: { safety: safetyLine, lowest: lowestCash },
        evidence: [
          { key: "ai.ev.safetyLine", params: { amount: safetyLine } },
          { key: "ai.ev.lowestCash", params: { amount: lowestCash } },
          {
            key: "ai.ev.openReceivables",
            params: {
              count: openReceivables.length,
              amount: openReceivables.reduce((s, r) => s + r.amount, 0),
            },
          },
        ],
        riskKey: riskDate ? "ai.risk.cashflowDanger" : undefined,
        nextStepKey: "ai.next.collect",
        actions: ["collect_payment", "delay_payment"],
        usedTools: ["getCashflowForecast", "getReceivables"],
      });
    }

    case "customer_query": {
      const groups = getCustomerRiskSegments(ctx);
      const atRisk = groups.at_risk.concat(groups.dormant);
      return buildResponse({
        intent,
        answerKey: "ai.answer.customers",
        answerParams: { count: atRisk.length },
        evidence: atRisk.map((c) => ({
          key: "ai.ev.customerVisits",
          params: { name: `@${c.nameKey}`, visits: c.visitCount },
        })),
        riskKey: atRisk.length > 0 ? "ai.risk.churn" : undefined,
        nextStepKey: "ai.next.winback",
        actions: ["customer_winback"],
        usedTools: ["getCustomerRiskSegments"],
      });
    }

    case "employee_query": {
      const att = getEmployeeAttendance(ctx);
      const present = att.filter((a) => a.clockedInToday).length;
      return buildResponse({
        intent,
        answerKey: "ai.answer.staffing",
        answerParams: { present, total: att.length, suggested: 4 },
        evidence: att.map((a) => ({
          key: a.clockedInToday ? "ai.ev.clockedIn" : "ai.ev.notClockedIn",
          params: { name: `@${a.nameKey}` },
        })),
        nextStepKey: "ai.next.schedule",
        actions: ["schedule_adjustment"],
        usedTools: ["getEmployeeAttendance"],
      });
    }

    case "draft_message":
      return buildResponse({
        intent,
        answerKey: "ai.answer.draft",
        evidence: [{ key: "ai.ev.draftFirst" }],
        nextStepKey: "ai.next.collect",
        actions: ["collect_payment"],
        usedTools: ["draftMessage"],
      });

    case "report_generation":
      return buildResponse({
        intent,
        answerKey: "ai.answer.report",
        evidence: [{ key: "ai.ev.reportScope" }],
        nextStepKey: "ai.next.generateReport",
        actions: ["monthly_review"],
        usedTools: ["getRevenueSummary", "getExpenseSummary", "getCashflowForecast"],
      });

    case "peer_benchmark":
      return buildResponse({
        intent,
        answerKey: "ai.answer.peer",
        evidence: [{ key: "ai.ev.anonymity" }],
        usedTools: ["getCustomerRiskSegments"],
      });

    case "compliance_question":
      return buildResponse({
        intent,
        answerKey: "ai.answer.compliance",
        missingData: ["professional_advisor"],
      });

    default:
      return buildResponse({
        intent: "unknown",
        answerKey: "ai.answer.unknown",
        missingData: ["intent"],
      });
  }
}
