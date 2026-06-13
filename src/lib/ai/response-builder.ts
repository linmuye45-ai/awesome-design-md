import type { AiIntent, AiResponse, AiActionType } from "../types";
import { needsDisclaimer } from "./safety";

interface BuildArgs {
  intent: AiIntent;
  answerKey: string;
  answerParams?: Record<string, string | number>;
  evidence?: { key: string; params?: Record<string, string | number> }[];
  riskKey?: string;
  riskParams?: Record<string, string | number>;
  nextStepKey?: string;
  actions?: AiActionType[];
  usedTools?: string[];
  missingData?: string[];
}

/**
 * Builds a structured, language-neutral AiResponse. The response carries i18n
 * KEYS (never localized prose), so the UI re-renders it in the current AI
 * advisor language on every paint — switching advisor language is instant.
 */
export function buildResponse(args: BuildArgs): AiResponse {
  const hasRisk = !!args.riskKey;
  return {
    intent: args.intent,
    answerKey: args.answerKey,
    answerParams: args.answerParams,
    evidence: args.evidence ?? [],
    riskKey: args.riskKey,
    riskParams: args.riskParams,
    nextStepKey: args.nextStepKey,
    actions: args.actions ?? [],
    usedTools: args.usedTools ?? [],
    missingData: args.missingData ?? [],
    needsDisclaimer: needsDisclaimer(args.intent, hasRisk),
  };
}
