import type { Receivable, LedgerStatus } from "../types";

export function byStatus(receivables: Receivable[], status?: LedgerStatus): Receivable[] {
  return receivables.filter((r) => (status ? r.status === status : true));
}

export function open(receivables: Receivable[]): Receivable[] {
  return receivables.filter((r) => r.status !== "paid");
}

export function overdue(receivables: Receivable[]): Receivable[] {
  return receivables.filter((r) => r.status === "overdue");
}

export function totalOutstanding(receivables: Receivable[]): number {
  return open(receivables).reduce((s, r) => s + r.amount, 0);
}
