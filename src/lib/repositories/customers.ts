import type { Customer, CustomerSegment } from "../types";

export function bySegment(customers: Customer[], segment: CustomerSegment): Customer[] {
  return customers.filter((c) => c.riskSegment === segment);
}

export function atRisk(customers: Customer[]): Customer[] {
  return customers.filter((c) => c.riskSegment === "at_risk" || c.riskSegment === "dormant");
}

export function byValueDesc(customers: Customer[]): Customer[] {
  return [...customers].sort((a, b) => b.totalSpend - a.totalSpend);
}

export function atRiskCount(customers: Customer[]): number {
  return atRisk(customers).length;
}
