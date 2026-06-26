"use client";

import { Check, Sparkles, Zap, Crown, Gauge } from "lucide-react";
import { Card, PageHeader, Button, Badge } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { can } from "@/lib/permissions";
import { PLANS, PLAN_ORDER, meterRemaining, planDef } from "@/lib/cashops/pricing";
import type { Plan } from "@/lib/cashops/domain";

const PLAN_ICON = {
  starter: Sparkles,
  pro: Zap,
  managed: Crown,
} as const;

export default function PricingPage() {
  const { t, formatNumber } = useI18n();
  const { toast } = useToast();

  const role = useAppStore((s) => s.role);
  const business = useAppStore((s) => s.business);
  const usage = useAppStore((s) => s.usage);
  const upgradePlan = useAppStore((s) => s.upgradePlan);

  const currentPlan: Plan = business?.plan ?? "starter";
  const canManage = can(role, "pricing.manage");
  const def = planDef(currentPlan);
  const remaining = meterRemaining(currentPlan, usage);
  const limit = def.monthlyActionLimit;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <PageHeader title={t("pricing.title")} subtitle={t("pricing.subtitle")} />

      {/* Usage meter */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("pricing.usageTitle")}</h2>
        </div>
        {limit === null ? (
          <p className="text-sm font-medium text-success">{t("pricing.actionsUnlimited")}</p>
        ) : (
          <>
            <p className="text-sm text-ink/70">
              {t("pricing.actionsUsed", { used: usage.actionsUsed, limit })}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink/8">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, (usage.actionsUsed / limit) * 100)}%` }}
              />
            </div>
            {remaining !== null && remaining <= 2 && (
              <Badge tone="warning" className="self-start">
                {formatNumber(remaining)} {t("pricing.perMonth")}
              </Badge>
            )}
          </>
        )}
      </Card>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const Icon = PLAN_ICON[planId];
          const isCurrent = planId === currentPlan;
          const featured = planId === "pro";

          return (
            <Card
              key={planId}
              className={`flex flex-col gap-4 ${
                featured ? "ring-2 ring-accent" : ""
              } ${isCurrent ? "border border-accent/30" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-accent" />
                  <span className="text-lg font-bold text-ink">{t(plan.nameKey)}</span>
                </div>
                {isCurrent && <Badge tone="accent">{t("pricing.currentPlan")}</Badge>}
              </div>

              <div className="flex items-end gap-1">
                <span className="numeric text-3xl font-extrabold text-ink">
                  <NumericText>
                    {plan.priceMonthlyMax
                      ? t("pricing.priceRange", {
                          min: `$${plan.priceMonthly}`,
                          max: `$${plan.priceMonthlyMax}`,
                        })
                      : `$${plan.priceMonthly}`}
                  </NumericText>
                </span>
                <span className="pb-1 text-sm text-ink/45">{t("pricing.perMonth")}</span>
              </div>

              <p className="text-sm text-ink/60">{t(plan.taglineKey)}</p>

              <ul className="flex flex-col gap-2">
                {plan.featureKeys.map((fk) => (
                  <li key={fk} className="flex items-start gap-2 text-sm text-ink/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {t(fk)}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-2">
                {isCurrent ? (
                  <Button variant="ghost" className="w-full" disabled>
                    {t("pricing.currentPlan")}
                  </Button>
                ) : (
                  <Button
                    variant={featured ? "primary" : "secondary"}
                    className="w-full"
                    disabled={!canManage}
                    onClick={() => {
                      upgradePlan(planId);
                      toast(t("pricing.toastUpgraded", { plan: t(plan.nameKey) }));
                    }}
                  >
                    {t("pricing.upgradeCta", { plan: t(plan.nameKey) })}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {business?.trialEndsAt && (
        <Badge tone="accent" className="self-center">
          {t("pricing.trialBadge")}
        </Badge>
      )}
    </div>
  );
}
