"use client";

import { useMemo } from "react";
import { useAppStore } from "./store";
import { now as clockNow } from "./clock";

/**
 * The app's "now" as a stable Date for the current render. In demo mode this is
 * the fixed anchor; in production it's wall-clock. Recomputed when the business
 * mode changes so the demo/production switch takes effect immediately.
 */
export function useNow(): Date {
  const mode = useAppStore((s) => s.business?.mode);
  // `mode` is intentionally the only dep: clockNow() reads the demo-mode flag
  // internally, so we recompute "now" precisely when the mode toggles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => clockNow(), [mode]);
}
