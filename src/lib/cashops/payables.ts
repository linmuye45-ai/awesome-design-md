/**
 * Payables & vendor-negotiation engine (deterministic).
 *
 * Responsibilities:
 *  - AP aging + upcoming bills.
 *  - Classify each bill as must_pay / can_delay / can_negotiate using
 *    transparent rules (payroll / rent / tax are always must_pay; flexible
 *    vendors with room before due date can_delay; large flexible bills
 *    can_negotiate installments).
 *  - Produce keyed delay / installment negotiation DRAFTS. No auto-pay — every
 *    output is an Action Center draft requiring owner approval.
 */

import type { AgingBucket, BusinessAction, Payable, PayablePlan, PayableTreatment } from "./domain";

const DAY = 24 * 60 * 60 * 1000;

export function daysUntilDue(p: Payable, now: Date): number {
  return Math.floor((new Date(p.dueDate).getTime() - now.getTime()) / DAY);
}

export function apBucketFor(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1_30";
  if (daysPastDue <= 60) return "31_60";
  if (daysPastDue <= 90) return "61_90";
  return "90_plus";
}

function isOpen(p: Payable): boolean {
  return p.status !== "paid";
}

export interface ApAgingSummary {
  bucket: AgingBucket;
  count: number;
  amount: number;
}

export function apAgingSummary(payables: Payable[], now: Date): ApAgingSummary[] {
  const order: AgingBucket[] = ["current", "1_30", "31_60", "61_90", "90_plus"];
  const map = new Map<AgingBucket, ApAgingSummary>(
    order.map((b) => [b, { bucket: b, count: 0, amount: 0 }])
  );
  for (const p of payables) {
    if (!isOpen(p)) continue;
    const dpd = -daysUntilDue(p, now);
    const b = apBucketFor(dpd);
    const entry = map.get(b)!;
    entry.count += 1;
    entry.amount += p.amount;
  }
  return order.map((b) => map.get(b)!);
}

/** Cash due within the next `days` window. */
export function upcomingAp(payables: Payable[], now: Date, days = 14): number {
  return payables
    .filter((p) => {
      if (!isOpen(p)) return false;
      const dtd = daysUntilDue(p, now);
      return dtd <= days;
    })
    .reduce((s, p) => s + p.amount, 0);
}

function classify(p: Payable): PayableTreatment {
  if (p.isPayroll || p.isTax) return "must_pay";
  if (p.isRent) return "must_pay";
  if (!p.flexible) return "must_pay";
  // Flexible vendor: large bills are negotiation candidates; smaller ones delay.
  if (p.amount >= 10000) return "can_negotiate";
  return "can_delay";
}

function suggestedDelayDays(p: Payable, treatment: PayableTreatment, now: Date): number {
  if (treatment === "must_pay") return 0;
  const dtd = daysUntilDue(p, now);
  // Aim to push to ~21 days out, but never suggest a negative delay.
  if (treatment === "can_negotiate") return 30;
  return Math.max(7, 21 - Math.max(0, dtd));
}

function reasonKeys(
  p: Payable,
  treatment: PayableTreatment,
  dtd: number
): PayablePlan["reasonKeys"] {
  const reasons: PayablePlan["reasonKeys"] = [];
  if (treatment === "must_pay") {
    if (p.isPayroll) reasons.push({ key: "payables.reason.payroll" });
    else if (p.isRent) reasons.push({ key: "payables.reason.rent" });
    else if (p.isTax) reasons.push({ key: "payables.reason.tax" });
    else reasons.push({ key: "payables.reason.inflexible" });
  } else if (treatment === "can_negotiate") {
    reasons.push({ key: "payables.reason.largeFlexible", params: { amount: p.amount } });
  } else {
    reasons.push({ key: "payables.reason.flexible" });
  }
  if (dtd < 0) reasons.push({ key: "payables.reason.overdue", params: { days: -dtd } });
  else if (dtd <= 7) reasons.push({ key: "payables.reason.dueSoon", params: { days: dtd } });
  return reasons;
}

/** Build a treatment plan for every open payable, ordered by urgency. */
export function payablePlans(payables: Payable[], now: Date): PayablePlan[] {
  const plans: PayablePlan[] = payables.filter(isOpen).map((p) => {
    const treatment = classify(p);
    const dtd = daysUntilDue(p, now);
    return {
      payable: p,
      treatment,
      daysUntilDue: dtd,
      suggestedDelayDays: suggestedDelayDays(p, treatment, now),
      reasonKeys: reasonKeys(p, treatment, dtd),
    };
  });
  // Sort by soonest due first.
  return plans.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

/** Bills that can be deferred/negotiated, ordered by potential cash relief. */
export function negotiablePlans(payables: Payable[], now: Date): PayablePlan[] {
  return payablePlans(payables, now)
    .filter((pl) => pl.treatment !== "must_pay")
    .sort((a, b) => b.payable.amount - a.payable.amount);
}

/** Total near-term outflow we could defer with vendor cooperation. */
export function deferrableCash(payables: Payable[], now: Date, withinDays = 21): number {
  return negotiablePlans(payables, now)
    .filter((pl) => pl.daysUntilDue <= withinDays)
    .reduce((s, pl) => s + pl.payable.amount, 0);
}

/**
 * Build a keyed vendor-negotiation draft (delay or installment) for a payable.
 * Nothing is paid — this is an Action Center draft only.
 */
export function buildNegotiationDraft(
  plan: PayablePlan
): Omit<BusinessAction, "id" | "businessId" | "status" | "createdAt" | "updatedAt"> {
  const p = plan.payable;
  const installment = plan.treatment === "can_negotiate";
  const bodyKey = installment ? "payables.body.installment" : "payables.body.delay";
  return {
    type: installment ? "supplier_negotiation" : "delay_payment",
    titleKey: installment ? "payables.draft.installmentTitle" : "payables.draft.delayTitle",
    titleParams: { name: p.vendorName, amount: p.amount },
    rationaleKey: "payables.draft.rationale",
    rationaleParams: { amount: p.amount, days: plan.suggestedDelayDays },
    draftKey: bodyKey,
    draftParams: {
      name: p.vendorName,
      amount: p.amount,
      days: plan.suggestedDelayDays,
      bill: p.billNumber,
    },
    channel: "email",
    evidenceKeys: [
      { key: "payables.ev.bill", params: { bill: p.billNumber, amount: p.amount } },
      { key: "payables.ev.due", params: { days: plan.daysUntilDue } },
    ],
    targetPayableId: p.id,
    impactAmount: p.amount,
    confidence: p.flexible ? "high" : "low",
  };
}
