import type { AiActionType } from "../types";

/**
 * Maps an AiActionType to the i18n keys + default params used to seed an
 * Action Center draft. Keys are language-neutral; the Action Center renders
 * them in the advisor language. This is the single source the action buttons
 * across Ask / Dashboard / Cashflow / Customers / Schedule use, so a button
 * tap anywhere produces a consistent, owner-confirmable draft.
 */
export interface DraftSeed {
  titleKey: string;
  reasonKey: string;
  draftKey: string;
  params?: Record<string, string | number>;
  evidenceKeys?: string[];
  impactAmount?: number;
}

const SEEDS: Record<AiActionType, DraftSeed> = {
  collect_payment: {
    titleKey: "mock.action.collectPayment.title",
    reasonKey: "mock.action.collectPayment.reason",
    draftKey: "mock.action.collectPayment.draft",
    params: { amount: 5600, count: 1 },
    evidenceKeys: ["mock.action.collectPayment.ev1", "mock.action.collectPayment.ev2"],
    impactAmount: 5600,
  },
  delay_payment: {
    titleKey: "mock.action.delayPayment.title",
    reasonKey: "mock.action.delayPayment.reason",
    draftKey: "mock.action.delayPayment.draft",
    params: { amount: 2400, days: 3 },
    evidenceKeys: ["mock.action.delayPayment.ev1"],
    impactAmount: 2400,
  },
  customer_winback: {
    titleKey: "mock.action.winback.title",
    reasonKey: "mock.action.winback.reason",
    draftKey: "mock.action.winback.draft",
    params: { visits: 52, days: 45 },
    evidenceKeys: ["mock.action.winback.ev1"],
    impactAmount: 1200,
  },
  // The remaining action types reuse the winback copy shape as a generic draft
  // placeholder; in production each would have a dedicated template.
  review_reply: {
    titleKey: "mock.action.winback.title",
    reasonKey: "mock.action.winback.reason",
    draftKey: "mock.action.winback.draft",
    params: { visits: 1, days: 1 },
  },
  schedule_adjustment: {
    titleKey: "mock.action.delayPayment.title",
    reasonKey: "mock.action.delayPayment.reason",
    draftKey: "mock.action.delayPayment.draft",
    params: { amount: 0, days: 1 },
  },
  supplier_negotiation: {
    titleKey: "mock.action.delayPayment.title",
    reasonKey: "mock.action.delayPayment.reason",
    draftKey: "mock.action.delayPayment.draft",
    params: { amount: 6200, days: 5 },
    impactAmount: 6200,
  },
  inventory_reminder: {
    titleKey: "mock.action.winback.title",
    reasonKey: "mock.action.winback.reason",
    draftKey: "mock.action.winback.draft",
    params: { visits: 0, days: 0 },
  },
  monthly_review: {
    titleKey: "mock.action.winback.title",
    reasonKey: "mock.action.winback.reason",
    draftKey: "mock.action.winback.draft",
    params: { visits: 0, days: 0 },
  },
};

export function draftForActionType(type: AiActionType): DraftSeed {
  return SEEDS[type];
}
