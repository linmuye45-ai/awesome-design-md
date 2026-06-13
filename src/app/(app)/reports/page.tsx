"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Users,
  UserCheck,
  Target,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { LOCALE_LABELS } from "@/i18n/config";
import { PageHeader, Card, Button, Badge } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { now } from "@/lib/clock";
import { monthlyReportMetrics } from "@/lib/repositories/reports";
import { draftForActionType } from "@/lib/ai/action-drafts";
import type { AiActionType } from "@/lib/types";

export default function ReportsPage() {
  // Report content follows the AI advisor language (tAdvisor), independent of UI language.
  const { t, tAdvisor, formatCurrency, formatPercent, formatDate } = useI18n();
  const { toast } = useToast();
  const transactions = useAppStore((s) => s.transactions);
  const receivables = useAppStore((s) => s.receivables);
  const payables = useAppStore((s) => s.payables);
  const aiAdvisorLanguage = useAppStore((s) => s.aiAdvisorLanguage);
  const createDraftAction = useAppStore((s) => s.createDraftAction);

  const [generated, setGenerated] = useState(false);

  const metrics = useMemo(
    () => monthlyReportMetrics(transactions, receivables, payables),
    [transactions, receivables, payables]
  );

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

  if (!generated) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} />
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <FileText className="h-12 w-12 text-ink/20" />
          <p className="max-w-sm text-sm text-ink/60">{t("reports.subtitle")}</p>
          <Button onClick={() => setGenerated(true)}>
            <Sparkles className="h-4 w-4" />
            {t("reports.generateCta")}
          </Button>
        </Card>
      </div>
    );
  }

  const recommended: AiActionType[] = ["collect_payment", "customer_winback", "delay_payment"];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <PageHeader
          title={t("reports.title")}
          subtitle={formatDate(now(), { year: "numeric", month: "long" })}
        />
        <Button variant="ghost" onClick={() => toast(t("reports.toastExport"))}>
          <Download className="h-4 w-4" />
          {t("reports.exportPdf")}
        </Button>
      </div>

      <Badge tone="accent" className="mb-4">
        {t("reports.advisorLanguageNote", { language: LOCALE_LABELS[aiAdvisorLanguage] })}
      </Badge>

      {/* 1. Headline */}
      <Card className="mb-4 border border-accent/15 bg-accent/5 shadow-none">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent/70">
          {tAdvisor("reports.headline")}
        </p>
        <p className="mt-1.5 text-lg font-bold leading-snug text-ink">
          {tAdvisor("reports.mostImportant")} · {tAdvisor("action.type.collect_payment")}
        </p>
      </Card>

      {/* 2. Key metrics */}
      <Section icon={TrendingUp} title={tAdvisor("reports.keyMetrics")}>
        <div className="grid grid-cols-3 gap-3">
          <Metric
            label={tAdvisor("dashboard.todayRevenue")}
            value={formatCurrency(metrics.income)}
          />
          <Metric
            label={tAdvisor("dashboard.todayExpenses")}
            value={formatCurrency(metrics.expense)}
          />
          <Metric
            label={tAdvisor("dashboard.estimatedGrossProfit")}
            value={formatCurrency(metrics.grossProfit)}
          />
        </div>
        <p className="mt-3 text-xs text-ink/50">
          {tAdvisor("network.yourMargin")}:{" "}
          <NumericText>{formatPercent(metrics.margin)}</NumericText>
        </p>
      </Section>

      {/* 3. Three good things */}
      <Section icon={CheckCircle2} title={tAdvisor("reports.goodNews")}>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-ink/70">
          <li>{tAdvisor("dashboard.topActions")}</li>
          <li>
            {tAdvisor("network.yourMargin")}{" "}
            <NumericText>{formatPercent(metrics.margin)}</NumericText>
          </li>
          <li>{tAdvisor("team.clockedIn")}</li>
        </ul>
      </Section>

      {/* 4. Two alerts */}
      <Section icon={AlertTriangle} title={tAdvisor("reports.alerts")}>
        <ul className="list-inside list-disc space-y-1.5 text-sm text-ink/70">
          <li>{tAdvisor("dashboard.riskWatch")}</li>
          <li>{tAdvisor("customers.segment.at_risk")}</li>
        </ul>
      </Section>

      {/* 5. Why profit changed */}
      <Section icon={Wallet} title={tAdvisor("reports.profitChange")}>
        <p className="text-sm leading-relaxed text-ink/70">
          {tAdvisor("dashboard.estimatedGrossProfit")}{" "}
          <NumericText>{formatCurrency(metrics.today.grossProfit)}</NumericText> ·{" "}
          {tAdvisor("cashflow.impactPayables")}
        </p>
      </Section>

      {/* 6. Cashflow risk */}
      <Section icon={AlertTriangle} title={tAdvisor("reports.cashflowRisk")}>
        <p className="text-sm leading-relaxed text-ink/70">
          {tAdvisor("dashboard.riskWatch")} · {tAdvisor("cashflow.lowestCash")}:{" "}
          <NumericText>{formatCurrency(metrics.lowestCash)}</NumericText>
        </p>
      </Section>

      {/* 7. Team summary */}
      <Section icon={UserCheck} title={tAdvisor("reports.teamSummary")}>
        <p className="text-sm leading-relaxed text-ink/70">{tAdvisor("team.subtitle")}</p>
      </Section>

      {/* 8. Customer summary */}
      <Section icon={Users} title={tAdvisor("reports.customerSummary")}>
        <p className="text-sm leading-relaxed text-ink/70">{tAdvisor("customers.subtitle")}</p>
      </Section>

      {/* 9. The one thing for next month */}
      <Section icon={Target} title={tAdvisor("reports.mostImportant")}>
        <p className="text-sm font-medium leading-relaxed text-ink">
          {tAdvisor("action.type.collect_payment")} — {tAdvisor("actions.draftFirst")}
        </p>
      </Section>

      {/* 10. Recommended actions — each can be added to the Action Center */}
      <Section icon={Sparkles} title={tAdvisor("reports.recommendedActions")}>
        <div className="flex flex-col gap-2">
          {recommended.map((a) => (
            <div
              key={a}
              className="flex items-center justify-between gap-3 rounded-xl bg-ink/[0.03] px-3 py-2"
            >
              <span className="text-sm text-ink/70">{tAdvisor(`action.type.${a}`)}</span>
              <Button variant="ghost" onClick={() => createAction(a)}>
                <Plus className="h-3.5 w-3.5" />
                {t("customers.winbackConfirm")}
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <p className="mt-6 text-center text-xs text-ink/40">{tAdvisor("compliance.disclaimer")}</p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof TrendingUp;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink/[0.03] p-3">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">
        <NumericText>{value}</NumericText>
      </p>
    </div>
  );
}
