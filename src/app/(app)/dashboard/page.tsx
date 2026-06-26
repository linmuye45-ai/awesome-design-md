"use client";

import Link from "next/link";
import {
  AlertTriangle,
  TrendingUp,
  Wallet,
  Clock,
  Receipt,
  HandCoins,
  CheckCircle2,
  Send,
  Gauge,
} from "lucide-react";
import { Card, PageHeader, Button } from "@/components/ui/primitives";
import { StatCard } from "@/components/StatCard";
import { NumericText } from "@/components/NumericText";
import { RiskBadge, ConfidenceBadge } from "@/components/cashops/RiskBadge";
import { DraftActionCard } from "@/components/cashops/DraftActionCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { selectForecast, selectMetrics } from "@/lib/cashops/selectors";
import { can, canSeeSensitiveFinancials } from "@/lib/permissions";

export default function Dashboard() {
  const { t, formatCurrency, formatPercent } = useI18n();
  const now = useNow();
  const role = useAppStore((s) => s.role);
  const business = useAppStore((s) => s.business);
  const actions = useAppStore((s) => s.actions);
  const forecast = useAppStore((s) => selectForecast(s, now, "base"));
  const metrics = useAppStore((s) => selectMetrics(s, now));

  const fullView = can(role, "dashboard.full");
  const seeSensitive = canSeeSensitiveFinancials(role);

  if (!business || !forecast || !metrics) {
    return <PageHeader title={t("dashboard.title")} subtitle={t("empty.generic")} />;
  }

  const headlineKey =
    forecast.riskLevel === "safe"
      ? "dashboard.headlineSafe"
      : forecast.riskLevel === "watch"
        ? "dashboard.headlineWatch"
        : "dashboard.headlineRisk";

  const topDrafts = actions.filter((a) => a.status === "draft").slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.greeting", { name: business.name })}
      />

      {/* Headline read */}
      <Card className="flex flex-col gap-3 border-s-4 border-accent">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-accent" />
          <RiskBadge level={forecast.riskLevel} />
          <ConfidenceBadge level={forecast.confidence} />
        </div>
        <p className="text-base font-medium leading-relaxed text-ink">
          {t(headlineKey, { lowest: forecast.lowestCash, safety: forecast.safetyLine })}
        </p>
        <Link href="/forecast">
          <Button variant="ghost">
            <TrendingUp className="h-4 w-4" /> {t("dashboard.viewForecast")}
          </Button>
        </Link>
      </Card>

      {!fullView && <Card className="text-sm text-ink/60">{t("dashboard.summaryOnly")}</Card>}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.cashAtRisk")}
          value={seeSensitive ? formatCurrency(metrics.cashAtRisk) : "•••"}
          icon={AlertTriangle}
          tone={metrics.cashAtRisk > 0 ? "danger" : "success"}
        />
        <StatCard
          label={t("dashboard.daysRunway")}
          value={String(metrics.daysCashRunway)}
          icon={Clock}
          meaning={fullView ? t("dashboard.runwayMeaning") : undefined}
          tone={metrics.daysCashRunway < 30 ? "danger" : "neutral"}
        />
        <StatCard
          label={t("dashboard.expectedRecovered")}
          value={seeSensitive ? formatCurrency(metrics.expectedRecoveredCash) : "•••"}
          icon={HandCoins}
          tone="success"
        />
        <StatCard
          label={t("dashboard.dso")}
          value={String(metrics.dso)}
          icon={Receipt}
          meaning={fullView ? t("dashboard.dsoMeaning") : undefined}
        />
        {fullView && (
          <>
            <StatCard
              label={t("dashboard.overdueAr")}
              value={seeSensitive ? formatCurrency(metrics.overdueAr) : "•••"}
              icon={HandCoins}
              tone="warning"
            />
            <StatCard
              label={t("dashboard.upcomingAp")}
              value={seeSensitive ? formatCurrency(metrics.upcomingAp) : "•••"}
              icon={Wallet}
            />
            <StatCard
              label={t("dashboard.actionsApproved")}
              value={String(metrics.actionsApproved)}
              icon={CheckCircle2}
            />
            <StatCard
              label={t("dashboard.actionsExecuted")}
              value={String(metrics.actionsExecuted)}
              icon={Send}
            />
          </>
        )}
      </div>

      {/* Forecast accuracy */}
      <Card className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink/70">{t("dashboard.forecastAccuracy")}</span>
        <span className="numeric text-lg font-bold text-ink">
          <NumericText>{formatPercent(metrics.forecastAccuracy)}</NumericText>
        </span>
      </Card>

      {/* Top actions */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">{t("dashboard.topActions")}</h2>
        {topDrafts.length === 0 ? (
          <Card className="text-sm text-ink/55">{t("dashboard.noActions")}</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {topDrafts.map((a) => (
              <DraftActionCard key={a.id} action={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
