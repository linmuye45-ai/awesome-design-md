import type { AiActionType, AiIntent } from "../types";

/**
 * AI safety guardrails. These encode the non-negotiable rules:
 *  - never auto-send, auto-delete, or auto-modify amounts
 *  - all outbound actions are drafts requiring owner approval
 *  - legal / tax / financing topics get a compliance disclaimer
 */

const DISCLAIMER_INTENTS: AiIntent[] = ["compliance_question"];

const OUTBOUND_ACTION_TYPES: AiActionType[] = [
  "collect_payment",
  "delay_payment",
  "customer_winback",
  "review_reply",
  "supplier_negotiation",
];

export function needsDisclaimer(intent: AiIntent, hasRisk: boolean): boolean {
  return DISCLAIMER_INTENTS.includes(intent) || hasRisk;
}

/** Outbound actions must always start life as a draft (never executed by AI). */
export function isOutboundAction(type: AiActionType): boolean {
  return OUTBOUND_ACTION_TYPES.includes(type);
}

/** The AI may only ever create drafts. This is asserted before action creation. */
export function assertDraftOnly(status: string): void {
  if (status !== "draft") {
    throw new Error(`AI safety violation: actions may only be created as "draft", got "${status}"`);
  }
}
