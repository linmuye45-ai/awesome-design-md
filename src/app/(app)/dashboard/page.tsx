"use client";

import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Mic,
  Send,
  PlusCircle,
  ScanLine,
  PhoneCall,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { PageHeader, Card, Button, Badge } from "@/components/ui/primitives";
import { StatCard } from "@/components/StatCard";
import { ActionCard } from "@/components/ActionCard";
import { can } from "@/lib/permissions";
import {
  todayTotals,
  yesterdayTotals,
  availableCash,
  overallRisk,
} from "@/lib/repositories/analytics";

export default function DashboardPage() {
  const { t, formatCurrency } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const business = useAppStore((s) => s.business);
  const role = useAppStore((s) => s.role);
  const transactions = useAppStore((s) => s.transactions);
  const receivables = useAppStore((s) => s.receivables);
  const payables = useAppStore((s) => s.payables);
  const actions = useAppStore((s) => s.actions);

  const safetyLine = business?.safetyCashBuffer ?? 5000;
  const today = todayTotals(transactions);
  const yest = yesterdayTotals(transactions);
  const cash = availableCash(transactions);
  const risk = overallRisk(receivables, payables, safetyLine);

  const fullView = can(role, "dashboard.full");
  const revenueUp = today.revenue >= yest.revenue;
  const topActions = actions.filter((a) => a.status === "draft").slice(0, 3);

  // Top-line AI judgment: tells the owner how today went + what's next.
  const judgmentKey =
    risk === "danger"
      ? "dashboard.judgmentDanger"
      : risk === "watch"
        ? "dashboard.judgmentWatch"
        : "dashboard.judgmentSafe";

  const riskConfig = {
    safe: {
      tone: "success" as const,
      icon: ShieldCheck,
      label: t("cashflow.status.safe"),
      msg: t("dashboard.riskSafe"),
      box: "bg-success/12",
      fg: "text-success",
    },
    watch: {
      tone: "warning" as const,
      icon: AlertTriangle,
      label: t("cashflow.status.watch"),
      msg: t("dashboard.riskWatch"),
      box: "bg-warning/12",
      fg: "text-warning",
    },
    danger: {
      tone: "danger" as const,
      icon: ShieldAlert,
      label: t("cashflow.status.danger"),
      msg: t("dashboard.riskDanger"),
      box: "bg-danger/12",
      fg: "text-danger",
    },
  }[risk];

  const RiskIcon = riskConfig.icon;

  const quickActions = [
    { icon: PlusCircle, label: t("dashboard.quickAddTransaction"), href: "/ledger" },
    { icon: ScanLine, label: t("dashboard.quickCapture"), href: "/capture" },
    { icon: PhoneCall, label: t("dashboard.quickCollect"), href: "/actions" },
    { icon: CalendarDays, label: t("dashboard.quickSchedule"), href: "/schedule" },
  ];

  const submitAsk = () => {
    const q = query.trim();
    router.push(q ? `/ask?q=${encodeURIComponent(q)}` : "/ask");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.greeting", { name: business?.name ?? "" })}
      />

      {/* AI judgment — the product's core promise: "how is my business today + what next" */}
      <Card className="mb-4 border border-accent/15 bg-white">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/12">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("dashboard.aiJudgment")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              {t(judgmentKey, {
                revenue: today.revenue,
                expenses: today.expenses,
                profit: today.grossProfit,
                safety: safetyLine,
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Ask box — the product's core promise */}
      <Card className="mb-6 bg-ink text-white shadow-cardHover">
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAsk()}
            placeholder={t("dashboard.askPlaceholder")}
            className="flex-1 bg-transparent py-2 text-sm text-white placeholder:text-white/50 outline-none"
          />
          <button
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            title={t("dashboard.voiceHint")}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={submitAsk}
            className="rounded-lg bg-accent p-2 text-white hover:bg-accent/90"
            aria-label={t("nav.ask")}
          >
            <Send className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </Card>

      {/* The 5 questions. Sensitive cash/profit figures are redacted for
          summary-only roles (employee / viewer). */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.todayRevenue")}
          value={formatCurrency(today.revenue)}
          icon={TrendingUp}
          tone="success"
          deltaLabel={t("dashboard.vsYesterday")}
          deltaPositive={revenueUp}
        />
        <StatCard
          label={t("dashboard.todayExpenses")}
          value={formatCurrency(today.expenses)}
          icon={TrendingDown}
        />
        <StatCard
          label={t("dashboard.estimatedGrossProfit")}
          value={fullView ? formatCurrency(today.grossProfit) : t("common.hidden")}
          icon={PiggyBank}
          tone={today.grossProfit >= 0 ? "accent" : "danger"}
          meaning={fullView ? t("dashboard.meaningProfit") : t("dashboard.summaryOnly")}
        />
        <StatCard
          label={t("dashboard.availableCash")}
          value={fullView ? formatCurrency(cash) : t("common.hidden")}
          icon={Wallet}
          meaning={fullView ? t("dashboard.meaningCash") : t("dashboard.summaryOnly")}
        />
      </div>

      {/* Cashflow risk banner */}
      <Card className="mt-3 flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${riskConfig.box}`}
        >
          <RiskIcon className={`h-5 w-5 ${riskConfig.fg}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">{t("dashboard.cashflowRisk")}</span>
            <Badge tone={riskConfig.tone}>{riskConfig.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-ink/55">{riskConfig.msg}</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/cashflow")}>
          {t("common.viewAll")}
        </Button>
      </Card>

      {/* Top 3 actions */}
      <div className="mt-7">
        <h2 className="mb-3 text-lg font-bold text-ink">{t("dashboard.topActions")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {topActions.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-7">
        <h2 className="mb-3 text-sm font-semibold text-ink/70">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.href}
                onClick={() => router.push(qa.href)}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center text-xs font-medium text-ink/70 shadow-card transition hover:shadow-cardHover"
              >
                <Icon className="h-5 w-5 text-accent" />
                {qa.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
