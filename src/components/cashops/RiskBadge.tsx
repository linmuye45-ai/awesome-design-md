"use client";

import { Badge } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/I18nProvider";
import type { ConfidenceLevel, RiskLevel } from "@/lib/cashops/domain";

const RISK_TONE: Record<RiskLevel, "success" | "warning" | "danger" | "accent"> = {
  safe: "success",
  watch: "warning",
  at_risk: "danger",
  critical: "danger",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useI18n();
  return <Badge tone={RISK_TONE[level]}>{t(`forecast.risk.${level}`)}</Badge>;
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const { t } = useI18n();
  return <Badge tone="neutral">{t(`forecast.confidenceLevel.${level}`)}</Badge>;
}
