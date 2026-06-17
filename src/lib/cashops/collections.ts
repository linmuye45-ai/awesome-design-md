/**
 * Receivables & collections engine (deterministic).
 *
 * Responsibilities:
 *  - AR aging into current / 1-30 / 31-60 / 61-90 / 90+ buckets.
 *  - Prioritize collection targets by a transparent, reproducible score
 *    (large amount + long overdue + historically slow payer + recoverable).
 *  - Produce keyed, multilingual collection DRAFTS in three tones
 *    (friendly / firm / final_notice) for email / SMS / WhatsApp. Drafts are
 *    never sent here — they become Action Center drafts the owner approves.
 *
 * No LLM, no randomness: identical inputs → identical output.
 */

import type {
  AgingBucket,
  BusinessAction,
  CollectionTarget,
  DraftChannel,
  DraftTone,
  Receivable,
} from "./domain";

export interface AgingSummary {
  bucket: AgingBucket;
  count: number;
  amount: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function daysOverdue(r: Receivable, now: Date): number {
  return Math.floor((now.getTime() - new Date(r.dueDate).getTime()) / DAY);
}

export function bucketFor(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return "current";
  if (daysPastDue <= 30) return "1_30";
  if (daysPastDue <= 60) return "31_60";
  if (daysPastDue <= 90) return "61_90";
  return "90_plus";
}

export function outstandingOf(r: Receivable): number {
  return Math.max(0, r.amount - r.amountPaid);
}

function isCollectible(r: Receivable): boolean {
  return r.status !== "paid" && r.status !== "written_off" && outstandingOf(r) > 0;
}

/** Aging summary across the standard buckets, in fixed order. */
export function agingSummary(receivables: Receivable[], now: Date): AgingSummary[] {
  const order: AgingBucket[] = ["current", "1_30", "31_60", "61_90", "90_plus"];
  const map = new Map<AgingBucket, AgingSummary>(
    order.map((b) => [b, { bucket: b, count: 0, amount: 0 }])
  );
  for (const r of receivables) {
    if (!isCollectible(r)) continue;
    const b = bucketFor(daysOverdue(r, now));
    const entry = map.get(b)!;
    entry.count += 1;
    entry.amount += outstandingOf(r);
  }
  return order.map((b) => map.get(b)!);
}

export function totalOverdue(receivables: Receivable[], now: Date): number {
  return receivables
    .filter((r) => isCollectible(r) && daysOverdue(r, now) > 0)
    .reduce((s, r) => s + outstandingOf(r), 0);
}

/**
 * Deterministic 0..100 priority score. Weighted blend of:
 *  - amount outstanding (normalized, 40%)
 *  - days overdue (normalized to 90+, 30%)
 *  - historical slowness (avgDaysLate, 15%)
 *  - recoverability (expectedRecoveryRate, 15%) — prefer collectible cash.
 */
function scoreTarget(r: Receivable, now: Date, maxOutstanding: number): number {
  const outstanding = outstandingOf(r);
  const dpd = Math.max(0, daysOverdue(r, now));
  const amountScore = maxOutstanding > 0 ? outstanding / maxOutstanding : 0;
  const overdueScore = Math.min(1, dpd / 90);
  const slowScore = Math.min(1, r.avgDaysLate / 30);
  const recoverScore = r.expectedRecoveryRate;
  const raw = amountScore * 0.4 + overdueScore * 0.3 + slowScore * 0.15 + recoverScore * 0.15;
  return Math.round(raw * 100);
}

/** Reason keys explaining a target's priority (most salient first). */
function reasonKeys(
  r: Receivable,
  dpd: number,
  maxOutstanding: number
): CollectionTarget["reasonKeys"] {
  const reasons: CollectionTarget["reasonKeys"] = [];
  const outstanding = outstandingOf(r);
  if (maxOutstanding > 0 && outstanding >= maxOutstanding * 0.6) {
    reasons.push({ key: "collections.reason.largeAmount", params: { amount: outstanding } });
  }
  if (dpd > 60) {
    reasons.push({ key: "collections.reason.longOverdue", params: { days: dpd } });
  } else if (dpd > 0) {
    reasons.push({ key: "collections.reason.overdue", params: { days: dpd } });
  }
  if (r.avgDaysLate >= 15) {
    reasons.push({ key: "collections.reason.slowPayer", params: { days: r.avgDaysLate } });
  }
  if (r.expectedRecoveryRate >= 0.85) {
    reasons.push({ key: "collections.reason.recoverable" });
  } else if (r.expectedRecoveryRate < 0.6) {
    reasons.push({ key: "collections.reason.atRiskRecovery" });
  }
  return reasons;
}

/**
 * Rank overdue receivables into prioritized collection targets. Only overdue
 * (dpd > 0) items are targets; current invoices aren't chased.
 */
export function collectionTargets(
  receivables: Receivable[],
  now: Date,
  limit = 5
): CollectionTarget[] {
  const collectible = receivables.filter((r) => isCollectible(r) && daysOverdue(r, now) > 0);
  const maxOutstanding = collectible.reduce((m, r) => Math.max(m, outstandingOf(r)), 0);

  const targets: CollectionTarget[] = collectible.map((r) => {
    const dpd = daysOverdue(r, now);
    const outstanding = outstandingOf(r);
    return {
      receivable: r,
      score: scoreTarget(r, now, maxOutstanding),
      bucket: bucketFor(dpd),
      daysOverdue: dpd,
      reasonKeys: reasonKeys(r, dpd, maxOutstanding),
      expectedRecoveryAmount: Math.round(outstanding * r.expectedRecoveryRate),
    };
  });

  return targets.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Total cash we can realistically expect to recover from current targets. */
export function expectedRecoveredCash(receivables: Receivable[], now: Date): number {
  return collectionTargets(receivables, now, 999).reduce((s, t) => s + t.expectedRecoveryAmount, 0);
}

// ---------------------------------------------------------------------------
// Draft generation (keyed; localized at render in the advisor language)
// ---------------------------------------------------------------------------

/**
 * Build a keyed collection draft action for a receivable. The body key encodes
 * tone; params carry the (free-text) customer name + (numeric) amount + days,
 * which the i18n layer formats per advisor language. Nothing is sent.
 */
export function buildCollectionDraft(
  r: Receivable,
  now: Date,
  tone: DraftTone,
  channel: DraftChannel
): Omit<BusinessAction, "id" | "businessId" | "status" | "createdAt" | "updatedAt"> {
  const dpd = Math.max(0, daysOverdue(r, now));
  const outstanding = outstandingOf(r);
  const params = {
    name: r.customerName,
    amount: outstanding,
    invoice: r.invoiceNumber,
    days: dpd,
  };
  return {
    type: "collect_payment",
    titleKey: "collections.draft.title",
    titleParams: { name: r.customerName, amount: outstanding },
    rationaleKey: "collections.draft.rationale",
    rationaleParams: { days: dpd, amount: outstanding },
    draftKey: `collections.body.${tone}`,
    draftParams: params,
    channel,
    tone,
    evidenceKeys: [
      { key: "collections.ev.invoice", params: { invoice: r.invoiceNumber, amount: outstanding } },
      { key: "collections.ev.overdue", params: { days: dpd } },
      {
        key: "collections.ev.expectedRecovery",
        params: { amount: Math.round(outstanding * r.expectedRecoveryRate) },
      },
    ],
    targetReceivableId: r.id,
    impactAmount: Math.round(outstanding * r.expectedRecoveryRate),
    confidence:
      r.expectedRecoveryRate >= 0.85 ? "high" : r.expectedRecoveryRate >= 0.6 ? "medium" : "low",
  };
}

export const DRAFT_TONES: DraftTone[] = ["friendly", "firm", "final_notice"];
export const DRAFT_CHANNELS: DraftChannel[] = ["email", "sms", "whatsapp"];
