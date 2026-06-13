import type { PeerBenchmark } from "../types";

/** Minimum sample size required before any aggregate may be shown (k-anonymity). */
export const K_ANONYMITY_MIN = 20;

export function isAnonymitySafe(benchmark: PeerBenchmark): boolean {
  return benchmark.sampleSize >= K_ANONYMITY_MIN;
}

export function marginPosition(benchmark: PeerBenchmark): "below" | "within" | "above" {
  if (benchmark.yourMargin < benchmark.grossMarginLow) return "below";
  if (benchmark.yourMargin > benchmark.grossMarginHigh) return "above";
  return "within";
}
