"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { ShieldCheck, AlertTriangle, ShieldAlert, Plus } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, Badge, Button } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { cashflowForecast } from "@/lib/repositories/analytics";
import * as payablesRepo from "@/lib/repositories/payables";
import * as receivablesRepo from "@/lib/repositories/receivables";
import { draftForActionType } from "@/lib/ai/action-drafts";
import type { AiActionType } from "@/lib/types";

export default function CashflowPage() {
  const { t, formatCurrency, formatDate, locale } = useI18n();
  const { toast } = useToast();
  const receivables = useAppStore((s) => s.receivables);
  const payables = useAppStore((s) => s.payables);
  const business = useAppStore((s) => s.business);
  const createDraftAction = useAppStore((s) => s.createDraftAction);

  const [range, setRange] = useState<7 | 30>(7);

  const safetyBuffer = business?.safetyCashBuffer ?? 5000;

  const { series, safetyLine, riskDate } = useMemo(
    () => cashflowForecast(receivables, payables, range, { safetyLine: safetyBuffer }),
    [receivables, payables, range, safetyBuffer]
  );

  const chartData = series.map((d) => ({
    date: formatDate(d.date, { month: "short", day: "numeric" }),
    cash: d.projectedCash,
  }));

  const overall = series.some((d) => d.status === "danger")
    ? "danger"
    : series.some((d) => d.status === "watch")
      ? "watch"
      : "safe";

  const statusConfig = {
    safe: { tone: "success" as const, icon: ShieldCheck },
    watch: { tone: "warning" as const, icon: AlertTriangle },
    danger: { tone: "danger" as const, icon: ShieldAlert },
  }[overall];
  const StatusIcon = statusConfig.icon;

  const receivableTotal = receivablesRepo.totalOutstanding(receivables);
  const payableTotal = payablesRepo.totalOutstanding(payables);
  const payroll = payablesRepo.payroll(payables).reduce((s, p) => s + p.amount, 0);

  const createAction = (type: AiActionType) => {
    const d = draftForActionType(type);
    createDraftAction({
      type,
      titleKey: d.titleKey,
      reasonKey: d.reasonKey,
      draftKey: d.draftKey,
      params: d.params,
      evidenceKeys: d.evidenceKeys,
      impactAmount: d.impactAmount,
      confidence: "medium",
    });
    toast(t("actions.toastDrafted"));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("cashflow.title")} subtitle={t("cashflow.subtitle")} />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {[7, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 7 | 30)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                range === r ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
              }`}
            >
              {r === 7 ? t("cashflow.next7") : t("cashflow.next30")}
            </button>
          ))}
        </div>
        <Badge tone={statusConfig.tone}>
          <StatusIcon className="me-1 h-3.5 w-3.5" />
          {t(`cashflow.status.${overall}`)}
        </Badge>
      </div>

      <Card className="mb-4">
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="cash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E85D04" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E85D04" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2A4A12" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#1B2A4A88" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#1B2A4A88" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) =>
                  new Intl.NumberFormat(locale, { notation: "compact" }).format(v)
                }
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), t("cashflow.projectedCash")]}
                contentStyle={{ borderRadius: 12, border: "1px solid #1B2A4A22", fontSize: 12 }}
              />
              <ReferenceLine
                y={safetyLine}
                stroke="#C62828"
                strokeDasharray="4 4"
                label={{
                  value: t("cashflow.safetyLine"),
                  fontSize: 10,
                  fill: "#C62828",
                  position: "insideTopLeft",
                }}
              />
              <Area
                type="monotone"
                dataKey="cash"
                stroke="#E85D04"
                strokeWidth={2}
                fill="url(#cash)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-ink/50">{t("cashflow.impactReceivables")}</p>
          <p className="mt-1 text-lg font-bold text-success">
            +<NumericText>{formatCurrency(receivableTotal)}</NumericText>
          </p>
        </Card>
        <Card>
          <p className="text-xs text-ink/50">{t("cashflow.impactPayables")}</p>
          <p className="mt-1 text-lg font-bold text-ink">
            −<NumericText>{formatCurrency(payableTotal)}</NumericText>
          </p>
        </Card>
        <Card>
          <p className="text-xs text-ink/50">{t("cashflow.impactPayroll")}</p>
          <p className="mt-1 text-lg font-bold text-ink">
            −<NumericText>{formatCurrency(payroll)}</NumericText>
          </p>
        </Card>
      </div>

      {riskDate && (
        <Card className="mt-4 border border-danger/20 bg-danger/5 shadow-none">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-danger">
                {t("cashflow.riskDate")}: {formatDate(riskDate)}
              </p>
              <p className="mt-1 text-xs text-ink/60">{t("dashboard.riskDanger")}</p>
              <p className="mt-2 text-xs font-medium text-ink/70">
                {t("cashflow.suggestedAction")}: {t("action.type.collect_payment")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => createAction("collect_payment")}>
                  <Plus className="h-3.5 w-3.5" />
                  {t("cashflow.actionCollect")}
                </Button>
                <Button variant="ghost" onClick={() => createAction("delay_payment")}>
                  <Plus className="h-3.5 w-3.5" />
                  {t("cashflow.actionDelay")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
