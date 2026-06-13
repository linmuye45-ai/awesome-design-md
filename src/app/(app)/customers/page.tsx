"use client";

import { useState, useMemo } from "react";
import { Sparkles, Phone } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, Badge, Button, Modal, EmptyState } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { draftForActionType } from "@/lib/ai/action-drafts";
import type { Customer, CustomerSegment } from "@/lib/types";

const SEGMENTS: CustomerSegment[] = ["high_value", "new", "at_risk", "price_sensitive", "dormant"];

const SEGMENT_TONE: Record<
  CustomerSegment,
  "success" | "accent" | "danger" | "warning" | "neutral"
> = {
  high_value: "success",
  new: "accent",
  at_risk: "danger",
  price_sensitive: "warning",
  dormant: "neutral",
};

export default function CustomersPage() {
  const { t, formatCurrency, formatNumber, formatDate, tAdvisor } = useI18n();
  const { toast } = useToast();
  const customers = useAppStore((s) => s.customers);
  const createDraftAction = useAppStore((s) => s.createDraftAction);

  const [filter, setFilter] = useState<"all" | CustomerSegment>("all");
  const [winback, setWinback] = useState<Customer | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? customers : customers.filter((c) => c.riskSegment === filter)),
    [customers, filter]
  );

  const confirmWinback = (customer: Customer) => {
    const d = draftForActionType("customer_winback");
    createDraftAction({
      type: "customer_winback",
      titleKey: d.titleKey,
      reasonKey: d.reasonKey,
      draftKey: d.draftKey,
      params: { ...d.params, name: t(customer.nameKey) },
      evidenceKeys: d.evidenceKeys,
      impactAmount: d.impactAmount,
      confidence: "medium",
    });
    toast(t("actions.toastDrafted"));
    setWinback(null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("customers.title")} subtitle={t("customers.subtitle")} />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
            filter === "all" ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
          }`}
        >
          {t("common.all")}
        </button>
        {SEGMENTS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              filter === s ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t(`customers.segment.${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={t("empty.generic")} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{t(c.nameKey)}</h3>
                  {c.phone && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/50">
                      <Phone className="h-3 w-3" />
                      <NumericText>{c.phone}</NumericText>
                    </p>
                  )}
                </div>
                <Badge tone={SEGMENT_TONE[c.riskSegment]}>
                  {t(`customers.segment.${c.riskSegment}`)}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-ink/45">{t("customers.totalSpend")}</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    <NumericText>{formatCurrency(c.totalSpend)}</NumericText>
                  </p>
                </div>
                <div>
                  <p className="text-ink/45">{t("customers.visits")}</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    <NumericText>{formatNumber(c.visitCount)}</NumericText>
                  </p>
                </div>
                <div>
                  <p className="text-ink/45">{t("customers.lastVisit")}</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    {c.lastPurchaseAt ? (
                      <NumericText>
                        {formatDate(c.lastPurchaseAt, { month: "short", day: "numeric" })}
                      </NumericText>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>

              {(c.riskSegment === "at_risk" || c.riskSegment === "dormant") && (
                <Button variant="ghost" className="w-full" onClick={() => setWinback(c)}>
                  <Sparkles className="h-4 w-4" />
                  {t("customers.winbackCta")}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!winback} onClose={() => setWinback(null)} title={t("customers.winbackTitle")}>
        {winback && (
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium text-ink/45">{t("action.draftReady")}</p>
            <div className="rounded-xl bg-ink/5 p-4 text-sm leading-relaxed text-ink/80">
              {tAdvisor("mock.action.winback.draft", { visits: 52, days: 45 })}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => confirmWinback(winback)}>
                {t("customers.winbackConfirm")}
              </Button>
              <Button variant="ghost" onClick={() => setWinback(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
