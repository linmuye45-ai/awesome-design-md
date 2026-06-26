"use client";

import { ReceiptText } from "lucide-react";
import { Card, PageHeader, Badge, Button } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useNow } from "@/lib/useNow";
import { can, canSeeSensitiveFinancials } from "@/lib/permissions";
import {
  apAgingSummary,
  buildNegotiationDraft,
  deferrableCash,
  payablePlans,
  upcomingAp,
} from "@/lib/cashops/payables";
import type { PayablePlan, PayableTreatment } from "@/lib/cashops/domain";

const TREATMENT_TONE: Record<PayableTreatment, "danger" | "warning" | "accent"> = {
  must_pay: "danger",
  can_delay: "warning",
  can_negotiate: "accent",
};

export default function PayablesPage() {
  const { t, formatCurrency } = useI18n();
  const now = useNow();
  const { toast } = useToast();
  const role = useAppStore((s) => s.role);
  const payables = useAppStore((s) => s.payables);
  const createDraftAction = useAppStore((s) => s.createDraftAction);

  const canDraft = can(role, "payables.draft");
  const seeSensitive = canSeeSensitiveFinancials(role);
  const aging = apAgingSummary(payables, now);
  const plans = payablePlans(payables, now);
  const upcoming = upcomingAp(payables, now, 14);
  const deferrable = deferrableCash(payables, now, 21);

  const money = (n: number) => (seeSensitive ? formatCurrency(n) : "•••");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("payables.title")} subtitle={t("payables.subtitle")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink/50">{t("payables.upcoming")}</span>
          <span className="numeric text-xl font-bold text-ink">
            <NumericText>{money(upcoming)}</NumericText>
          </span>
        </Card>
        <Card className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink/50">{t("payables.deferrable")}</span>
          <span className="numeric text-xl font-bold text-success">
            <NumericText>{money(deferrable)}</NumericText>
          </span>
        </Card>
      </div>

      {/* Aging */}
      <Card>
        <h2 className="mb-3 text-sm font-bold text-ink">{t("payables.aging")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {aging.map((a) => (
            <div key={a.bucket} className="rounded-xl bg-ink/3 p-3 text-center">
              <div className="text-[11px] font-medium text-ink/50">
                {t(`collections.bucket.${a.bucket}`)}
              </div>
              <div className="numeric mt-1 text-base font-bold text-ink">
                <NumericText>{money(a.amount)}</NumericText>
              </div>
              <div className="text-[11px] text-ink/40">{a.count}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">{t("payables.upcoming")}</h2>
        {plans.length === 0 ? (
          <Card className="text-sm text-ink/55">{t("payables.noPayables")}</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((pl) => (
              <PlanCard
                key={pl.payable.id}
                plan={pl}
                canDraft={canDraft}
                money={money}
                onDraft={() => {
                  const id = createDraftAction(buildNegotiationDraft(pl));
                  toast(id ? t("payables.toastDrafted") : t("actions.toastMetered"));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  canDraft,
  money,
  onDraft,
}: {
  plan: PayablePlan;
  canDraft: boolean;
  money: (n: number) => string;
  onDraft: () => void;
}) {
  const { t } = useI18n();
  const p = plan.payable;
  const negotiable = plan.treatment !== "must_pay";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-ink">{p.vendorName}</span>
            <Badge tone={TREATMENT_TONE[plan.treatment]}>
              {t(`payables.treatmentLabel.${plan.treatment}`)}
            </Badge>
          </div>
          <div className="mt-0.5 text-xs text-ink/50">
            {t("payables.bill", { bill: p.billNumber })}
          </div>
        </div>
        <div className="text-end">
          <div className="numeric text-lg font-bold text-ink">
            <NumericText>{money(p.amount)}</NumericText>
          </div>
          <div className="text-[11px] text-ink/45">
            {plan.daysUntilDue < 0
              ? t("payables.overdueBy", { days: -plan.daysUntilDue })
              : t("payables.dueIn", { days: plan.daysUntilDue })}
          </div>
        </div>
      </div>

      <ul className="flex flex-wrap gap-1.5">
        {plan.reasonKeys.map((rk, i) => (
          <li key={i}>
            <Badge tone="neutral">{t(rk.key, rk.params)}</Badge>
          </li>
        ))}
      </ul>

      {negotiable && (
        <div className="flex items-center justify-between border-t border-ink/8 pt-3">
          <span className="text-xs text-ink/55">
            {t("payables.suggestDelay", { days: plan.suggestedDelayDays })}
          </span>
          <Button onClick={onDraft} disabled={!canDraft}>
            <ReceiptText className="h-4 w-4" /> {t("payables.draftNegotiation")}
          </Button>
        </div>
      )}
    </Card>
  );
}
