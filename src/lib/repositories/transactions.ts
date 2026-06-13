import type { Transaction, TransactionType } from "../types";
import { now, isSameDay } from "../clock";

/** Read helpers over the transaction collection (pure, store-agnostic). */

export function byType(transactions: Transaction[], type: TransactionType): Transaction[] {
  return transactions.filter((t) => t.type === type);
}

export function todays(transactions: Transaction[]): Transaction[] {
  const today = now();
  return transactions.filter((t) => isSameDay(new Date(t.occurredAt), today));
}

export function totalByCategory(transactions: Transaction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of transactions) out[t.category] = (out[t.category] ?? 0) + t.amount;
  return out;
}

export function sortByOccurredDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}
