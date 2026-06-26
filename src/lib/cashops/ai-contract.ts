/**
 * ATLAS CashOps — AI advisor tool-calling contract.
 *
 * The advisor is strictly human-in-the-loop and never invents numbers:
 *  - All amounts, dates, customer/vendor lists, and risk levels come from
 *    TOOL RESULTS (deterministic engine), referenced by i18n keys + params.
 *  - The response shape is FIXED: Direct answer, Evidence, Risk,
 *    Recommended action, Draft actions, plus missingData when data is absent.
 *  - The advisor offers OPERATIONAL guidance only — never formal tax, legal,
 *    or lending advice (enforced by `needsDisclaimer` + a compliance line).
 */

import type { ActionType, ConfidenceLevel, RiskLevel } from "./domain";

/** Tools the advisor may call. Mirrors a real LLM tool schema. */
export type ToolName =
  | "getBankPosition"
  | "getForecast"
  | "getReceivablesAging"
  | "getCollectionTargets"
  | "getPayablesPlan"
  | "getMetrics"
  | "draftCollectionMessage"
  | "draftVendorNegotiation";

export interface ToolSpec {
  name: ToolName;
  descriptionKey: string;
  parameters: string[];
  /** Domains of data this tool reads (used to surface missingData). */
  reads: ("bank" | "ar" | "ap" | "forecast" | "metrics")[];
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: "getBankPosition",
    descriptionKey: "ai.tool.getBankPosition",
    parameters: [],
    reads: ["bank"],
  },
  {
    name: "getForecast",
    descriptionKey: "ai.tool.getForecast",
    parameters: ["scenario"],
    reads: ["forecast"],
  },
  {
    name: "getReceivablesAging",
    descriptionKey: "ai.tool.getReceivablesAging",
    parameters: [],
    reads: ["ar"],
  },
  {
    name: "getCollectionTargets",
    descriptionKey: "ai.tool.getCollectionTargets",
    parameters: ["limit"],
    reads: ["ar"],
  },
  {
    name: "getPayablesPlan",
    descriptionKey: "ai.tool.getPayablesPlan",
    parameters: [],
    reads: ["ap"],
  },
  {
    name: "getMetrics",
    descriptionKey: "ai.tool.getMetrics",
    parameters: [],
    reads: ["metrics"],
  },
  {
    name: "draftCollectionMessage",
    descriptionKey: "ai.tool.draftCollectionMessage",
    parameters: ["receivableId", "tone", "channel"],
    reads: ["ar"],
  },
  {
    name: "draftVendorNegotiation",
    descriptionKey: "ai.tool.draftVendorNegotiation",
    parameters: ["payableId", "delayDays"],
    reads: ["ap"],
  },
];

export type AdvisorIntent =
  | "cash_position"
  | "forecast_query"
  | "collections_query"
  | "payables_query"
  | "metrics_query"
  | "draft_request"
  | "compliance_question"
  | "unknown";

/** A keyed text fragment, re-localized at render in the advisor language. */
export interface KeyedText {
  key: string;
  params?: Record<string, string | number>;
}

/**
 * The FIXED advisor response structure. Carries i18n keys only (never prose),
 * so the advisor language can be switched live with no regeneration.
 */
export interface AdvisorResponse {
  intent: AdvisorIntent;
  /** Direct answer. */
  answer: KeyedText;
  /** Evidence — grounded line items from tool results. */
  evidence: KeyedText[];
  /** Risk callout, if any. */
  risk?: KeyedText;
  riskLevel?: RiskLevel;
  /** Recommended next action in prose. */
  recommendation?: KeyedText;
  /** Draft actions the owner can add to the Action Center. */
  draftActions: ActionType[];
  /** Names of tools the advisor invoked. */
  usedTools: ToolName[];
  /** Data domains the advisor could not read (and how to connect them). */
  missingData: { domainKey: string; connectKey: string }[];
  confidence: ConfidenceLevel;
  /** Operational-guidance-only disclaimer must be shown. */
  needsDisclaimer: boolean;
}
