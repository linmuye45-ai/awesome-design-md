"use client";

import { useState } from "react";
import { Card, PageHeader, Badge } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { RiskBadge, ConfidenceBadge } from "@/components/cashops/RiskBadge";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { selectForecast } from "@/lib/cashops/selectors";
import { SCENARIOS } from "@/lib/cashops/forecast";
import { cn } from "@/lib/cn";
import type { ScenarioId } from "@/lib/cashops/domain";

export default function ForecastPage() {
  const { t, formatCurrency, formatDate } = useI18n();
  const now = useNow();
  const [scenario, setScenario] = useState<ScenarioId>("base");
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const forecast = useAppStore((s) => selectForecast(s, now, scenario));

  if (!forecast) {
    return <PageHeader title={t("forecast.title")} subtitle={t("empty.generic")} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("forecast.title")} subtitle={t("forecast.subtitle")} />

      {/* Scenario selector */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((sc) => (
          <button
            key={sc}
            onClick={() => {
              setScenario(sc);
              setOpenWeek(null);
            }}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium transition",
              scenario === sc
                ? "border-accent bg-accent/10 text-accent"
                : "border-ink/15 text-ink/70 hover:bg-ink/5"
            )}
          >
            {t(`forecast.scenarios.${sc}`)}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label={t("forecast.startingCash")}
          value={formatCurrency(forecast.startingCash)}
        />
        <SummaryCard
          label={t("forecast.lowestCash")}
          value={formatCurrency(forecast.lowestCash)}
          tone={forecast.lowestCash < forecast.safetyLine ? "danger" : "neutral"}
        />
        <SummaryCard label={t("forecast.safetyLine")} value={formatCurrency(forecast.safetyLine)} />
        <Card className="flex flex-col gap-2">
          <span className="text-xs font-medium text-ink/50">{t("forecast.riskLevel")}</span>
          <div className="flex flex-wrap gap-1.5">
            <RiskBadge level={forecast.riskLevel} />
            <ConfidenceBadge level={forecast.confidence} />
          </div>
          <span className="text-[11px] text-ink/45">
            {forecast.breachWeekStart
              ? t("forecast.breachDate") + ": " + formatDate(forecast.breachWeekStart)
              : t("forecast.noBreach")}
          </span>
        </Card>
      </div>

      {/* Top drivers */}
      <Card>
        <h2 className="mb-3 text-sm font-bold text-ink">{t("forecast.topDrivers")}</h2>
        <ul className="space-y-2">
          {forecast.topDrivers.map((d, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-ink/70">{t(d.key, d.params)}</span>
              <span
                className={cn(
                  "numeric font-semibold",
                  d.direction === "inflow" ? "text-success" : "text-danger"
                )}
              >
                <NumericText>
                  {d.direction === "inflow" ? "+" : "−"}
                  {formatCurrency(d.amount)}
                </NumericText>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 13-week table */}
      <Card className="overflow-x-auto">
        <p className="mb-3 text-xs text-ink/50">{t("forecast.clickHint")}</p>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-start text-xs text-ink/50">
              <th className="px-2 py-2 text-start">{t("forecast.weekColumn")}</th>
              <th className="px-2 py-2 text-end">{t("forecast.openingCash")}</th>
              <th className="px-2 py-2 text-end">{t("forecast.inflow")}</th>
              <th className="px-2 py-2 text-end">{t("forecast.outflow")}</th>
              <th className="px-2 py-2 text-end">{t("forecast.closingCash")}</th>
            </tr>
          </thead>
          <tbody>
            {forecast.weeks.map((w) => (
              <tr
                key={w.weekIndex}
                onClick={() => setOpenWeek(openWeek === w.weekIndex ? null : w.weekIndex)}
                className={cn(
                  "cursor-pointer border-b border-ink/5 transition hover:bg-ink/3",
                  w.belowSafetyLine && "bg-danger/5"
                )}
              >
                <td className="px-2 py-2">
                  <div className="font-medium text-ink">
                    {t("common.week", { n: w.weekIndex + 1 })}
                  </div>
                  <div className="text-[11px] text-ink/45">{formatDate(w.weekStart)}</div>
                </td>
                <td className="px-2 py-2 text-end">
                  <NumericText>{formatCurrency(w.openingCash)}</NumericText>
                </td>
                <td className="px-2 py-2 text-end text-success">
                  <NumericText>+{formatCurrency(w.inflow)}</NumericText>
                </td>
                <td className="px-2 py-2 text-end text-danger">
                  <NumericText>−{formatCurrency(w.outflow)}</NumericText>
                </td>
                <td className="px-2 py-2 text-end">
                  <span
                    className={cn(
                      "numeric font-semibold",
                      w.belowSafetyLine ? "text-danger" : "text-ink"
                    )}
                  >
                    <NumericText>{formatCurrency(w.closingCash)}</NumericText>
                  </span>
                  {w.belowSafetyLine && (
                    <Badge tone="danger" className="ms-1">
                      {t("forecast.risk.at_risk")}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Evidence drawer for the open week */}
        {openWeek !== null && (
          <div className="mt-4 rounded-xl bg-ink/3 p-4">
            <h3 className="mb-2 text-sm font-bold text-ink">
              {t("forecast.evidenceTitle", { week: t("common.week", { n: openWeek + 1 }) })}
            </h3>
            {forecast.weeks[openWeek].evidence.length === 0 ? (
              <p className="text-sm text-ink/50">{t("forecast.evidenceEmpty")}</p>
            ) : (
              <ul className="space-y-1.5">
                {forecast.weeks[openWeek].evidence.map((e, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-ink/70">{t(e.key, e.params)}</span>
                    <span
                      className={cn(
                        "numeric font-semibold",
                        e.direction === "inflow" ? "text-success" : "text-danger"
                      )}
                    >
                      <NumericText>
                        {e.direction === "inflow" ? "+" : "−"}
                        {formatCurrency(e.amount)}
                      </NumericText>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink/50">{label}</span>
      <span
        className={cn("numeric text-xl font-bold", tone === "danger" ? "text-danger" : "text-ink")}
      >
        <NumericText>{value}</NumericText>
      </span>
    </Card>
  );
}
