"use client";

import { useState, useMemo } from "react";
import { Sparkles, Send, AlertTriangle, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, Button, Badge } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { SCHEDULE_DAYS } from "@/lib/mock-data";
import * as employeesRepo from "@/lib/repositories/employees";
import { draftForActionType } from "@/lib/ai/action-drafts";

type Coverage = "ok" | "understaffed" | "conflict";

// Demo coverage per day: computed coverage status for each weekday.
const DAY_COVERAGE: { staff: number; status: Coverage }[] = [
  { staff: 4, status: "ok" },
  { staff: 4, status: "ok" },
  { staff: 2, status: "understaffed" },
  { staff: 4, status: "ok" },
  { staff: 5, status: "ok" },
  { staff: 5, status: "conflict" },
  { staff: 3, status: "understaffed" },
];

export default function SchedulePage() {
  const { t, formatCurrency } = useI18n();
  const { toast } = useToast();
  const employees = useAppStore((s) => s.employees);
  const createDraftAction = useAppStore((s) => s.createDraftAction);
  const [generated, setGenerated] = useState(false);

  const weeklyCost = useMemo(() => employeesRepo.weeklyLaborCost(employees), [employees]);
  const conflictsFound = DAY_COVERAGE.filter((c) => c.status === "conflict").length;

  const coverageConfig: Record<
    Coverage,
    { tone: "success" | "warning" | "danger"; icon: typeof CheckCircle2 }
  > = {
    ok: { tone: "success", icon: CheckCircle2 },
    understaffed: { tone: "warning", icon: AlertTriangle },
    conflict: { tone: "danger", icon: XCircle },
  };

  const generate = () => {
    setGenerated(true);
    // AI scheduling produces an owner-confirmable draft in the Action Center.
    const d = draftForActionType("schedule_adjustment");
    createDraftAction({
      type: "schedule_adjustment",
      titleKey: d.titleKey,
      reasonKey: d.reasonKey,
      draftKey: d.draftKey,
      params: d.params,
      evidenceKeys: d.evidenceKeys,
      confidence: "medium",
    });
    toast(t("schedule.toastGenerated"));
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("schedule.title")} subtitle={t("schedule.subtitle")} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={generate}>
          <Sparkles className="h-4 w-4" />
          {t("schedule.generateCta")}
        </Button>
        <Button variant="ghost" onClick={() => toast(t("schedule.toastNotified"))}>
          <Send className="h-4 w-4 rtl-mirror" />
          {t("schedule.notifyCta")}
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center gap-2 text-ink/50">
            <Wallet className="h-4 w-4" />
            <p className="text-xs">{t("schedule.estimatedCost")}</p>
          </div>
          <p className="mt-1 text-lg font-bold text-ink">
            <NumericText>{formatCurrency(weeklyCost)}</NumericText>
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink/50">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-xs">{t("schedule.conflict")}</p>
          </div>
          <p className="mt-1 text-lg font-bold text-ink">
            {t("schedule.conflictsFound", { count: conflictsFound })}
          </p>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02]">
              <th className="p-3 text-start text-xs font-semibold text-ink/50">
                {t("common.name")}
              </th>
              {SCHEDULE_DAYS.map((d) => (
                <th key={d} className="p-3 text-center text-xs font-semibold text-ink/50">
                  {t(`schedule.days.${d}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((e, ei) => (
              <tr key={e.id} className="border-b border-ink/5 last:border-0">
                <td className="whitespace-nowrap p-3 font-medium text-ink">{t(e.nameKey)}</td>
                {SCHEDULE_DAYS.map((d, di) => {
                  // Demo shift assignment heuristic.
                  const on = (ei + di) % 7 !== 5 && !(di === 2 && ei > 1);
                  return (
                    <td key={d} className="p-2 text-center">
                      {on ? (
                        <span className="inline-block rounded-lg bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                          <NumericText>{generated ? "09–17" : "10–18"}</NumericText>
                        </span>
                      ) : (
                        <span className="text-ink/20">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink/10 bg-ink/[0.02]">
              <td className="p-3 text-xs font-semibold text-ink/50">{t("common.status")}</td>
              {DAY_COVERAGE.map((c, i) => {
                const cfg = coverageConfig[c.status];
                const Icon = cfg.icon;
                return (
                  <td key={i} className="p-2 text-center">
                    <Badge tone={cfg.tone} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {t(`schedule.${c.status === "ok" ? "ok" : c.status}`)}
                    </Badge>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </Card>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t("schedule.ok")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" /> {t("schedule.understaffed")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-danger" /> {t("schedule.conflict")}
        </span>
      </div>
    </div>
  );
}
