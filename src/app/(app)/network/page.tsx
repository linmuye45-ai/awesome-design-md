"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ShieldCheck, Users, TrendingUp, Truck, Megaphone, Lock } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, Button, Badge } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { mockPeerBenchmark } from "@/lib/mock-data";
import { isAnonymitySafe, K_ANONYMITY_MIN } from "@/lib/repositories/peer-network";

export default function NetworkPage() {
  const { t, formatPercent, locale } = useI18n();
  const { toast } = useToast();
  const b = mockPeerBenchmark;

  const anonymitySafe = isAnonymitySafe(b);

  const chartData = b.costStructure.map((c) => ({
    category: t(`ledger.expenseCategory.${c.category}`),
    you: Math.round(c.you * 100),
    peers: Math.round(c.peers * 100),
  }));

  const marginPct = (b.yourMargin - b.grossMarginLow) / (b.grossMarginHigh - b.grossMarginLow);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("network.title")} subtitle={t("network.subtitle")} />

      <Card className="mb-4 flex items-start gap-3 border border-ink/10 bg-ink/[0.03] shadow-none">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ink/50" />
        <div>
          <p className="text-sm leading-snug text-ink/60">{t("network.anonymityNotice")}</p>
          <p className="mt-1 text-xs font-medium text-ink/50">
            {t("network.sampleSize", { count: b.sampleSize })}
          </p>
        </div>
      </Card>

      {!anonymitySafe ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock className="h-10 w-10 text-ink/20" />
          <p className="max-w-sm text-sm text-ink/60">
            {t("network.kAnonymityBlocked", { min: K_ANONYMITY_MIN })}
          </p>
        </Card>
      ) : (
        <>
          {/* Gross margin range */}
          <Card className="mb-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink">{t("network.grossMarginRange")}</h2>
            </div>
            <div className="relative mt-6 h-2 rounded-full bg-ink/10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-warning/30 via-success/40 to-success/30" />
              <div
                className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-accent shadow rtl:translate-x-1/2"
                style={{ insetInlineStart: `${Math.min(100, Math.max(0, marginPct * 100))}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink/50">
              <NumericText>{formatPercent(b.grossMarginLow)}</NumericText>
              <span className="font-semibold text-accent">
                {t("network.yourMargin")}: <NumericText>{formatPercent(b.yourMargin)}</NumericText>
              </span>
              <NumericText>{formatPercent(b.grossMarginHigh)}</NumericText>
            </div>
          </Card>

          {/* Cost structure comparison */}
          <Card className="mb-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">{t("network.costStructure")}</h2>
            <div className="h-60" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A12" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "#1B2A4A88" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#1B2A4A88" }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tickFormatter={(v) => new Intl.NumberFormat(locale).format(v) + "%"}
                  />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={{ borderRadius: 12, border: "1px solid #1B2A4A22", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="you" name={t("network.you")} fill="#E85D04" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="peers"
                    name={t("network.peers")}
                    fill="#1B2A4A"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Group buying */}
          <Card className="mb-4">
            <div className="mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink">{t("network.groupBuying")}</h2>
            </div>
            <div className="grid gap-3">
              {b.groupBuying.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-ink/[0.03] p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{t(g.titleKey)}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/50">
                      <Users className="h-3 w-3" />
                      {t("network.participants", { count: g.participants })}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => toast(t("common.comingSoon"))}>
                    {t("network.joinGroupBuy")}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Industry alerts */}
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink">{t("network.industryAlerts")}</h2>
            </div>
            <div className="flex flex-col gap-2">
              <Badge tone="warning" className="w-fit">
                {t("network.supplierRecs")}
              </Badge>
              <p className="text-sm leading-relaxed text-ink/70">{t("network.subtitle")}</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
