import type { Business } from "../types";

export function safetyLine(business: Business | null): number {
  return business?.safetyCashBuffer ?? 5000;
}

export function isDemo(business: Business | null): boolean {
  return business?.demoMode ?? true;
}

export function currencyOf(business: Business | null): string {
  return business?.currency ?? "USD";
}
