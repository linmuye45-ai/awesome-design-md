import type { Payable, LedgerStatus } from "../types";

export function byStatus(payables: Payable[], status?: LedgerStatus): Payable[] {
  return payables.filter((p) => (status ? p.status === status : true));
}

export function open(payables: Payable[]): Payable[] {
  return payables.filter((p) => p.status !== "paid");
}

export function payroll(payables: Payable[]): Payable[] {
  return payables.filter((p) => p.isPayroll);
}

export function totalOutstanding(payables: Payable[]): number {
  return open(payables).reduce((s, p) => s + p.amount, 0);
}
