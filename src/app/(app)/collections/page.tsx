"use client";

import { useState } from "react";
import { HandCoins, Clock, Phone } from "lucide-react";
import { Card, PageHeader, Badge, Button, Select } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useNow } from "@/lib/useNow";
import { can, canSeeSensitiveFinancials } from "@/lib/permissions";
import {
  agingSummary,
  buildCollectionDraft,
  collectionTargets,
  DRAFT_CHANNELS,
  DRAFT_TONES,
} from "@/lib/cashops/collections";
import type { CollectionTarget, DraftChannel, DraftTone } from "@/lib/cashops/domain";

export default function CollectionsPage() {
  const { t, formatCurrency } = useI18n();
  const now = useNow();
  const { toast } = useToast();
  const role = useAppStore((s) => s.role);
  const receivables = useAppStore((s) => s.receivables);
  const createDraftAction = useAppStore((s) => s.createDraftAction);
  const markContacted = useAppStore((s) => s.markContacted);

  const canDraft = can(role, "collections.draft");
  const seeSensitive = canSeeSensitiveFinancials(role);
  const aging = agingSummary(receivables, now);
  const targets = collectionTargets(receivables, now, 5);

  const money = (n: number) => (seeSensitive ? formatCurrency(n) : "•••");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("collections.title")} subtitle={t("collections.subtitle")} />

      {/* Aging */}
      <Card>
        <h2 className="mb-3 text-sm font-bold text-ink">{t("collections.aging")}</h2>
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

      {/* Priority targets */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">{t("collections.priorityTargets")}</h2>
        {targets.length === 0 ? (
          <Card className="text-sm text-ink/55">{t("collections.noTargets")}</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {targets.map((tg) => (
              <TargetCard
                key={tg.receivable.id}
                target={tg}
                canDraft={canDraft}
                seeSensitive={seeSensitive}
                onDraft={(tone, channel) => {
                  const input = buildCollectionDraft(tg.receivable, now, tone, channel);
                  const id = createDraftAction(input);
                  toast(id ? t("collections.toastDrafted") : t("actions.toastMetered"));
                }}
                onContacted={() => {
                  markContacted(tg.receivable.id);
                  toast(t("collections.toastContacted"));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TargetCard({
  target,
  canDraft,
  seeSensitive,
  onDraft,
  onContacted,
}: {
  target: CollectionTarget;
  canDraft: boolean;
  seeSensitive: boolean;
  onDraft: (tone: DraftTone, channel: DraftChannel) => void;
  onContacted: () => void;
}) {
  const { t, formatCurrency, formatDate } = useI18n();
  const [tone, setTone] = useState<DraftTone>("friendly");
  const [channel, setChannel] = useState<DraftChannel>("email");
  const r = target.receivable;
  const money = (n: number) => (seeSensitive ? formatCurrency(n) : "•••");

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-ink">{r.customerName}</span>
            <Badge tone="neutral">{t(`collections.bucket.${target.bucket}`)}</Badge>
          </div>
          <div className="mt-0.5 text-xs text-ink/50">
            {t("collections.invoice", { invoice: r.invoiceNumber })}
          </div>
        </div>
        <div className="text-end">
          <div className="text-[11px] text-ink/50">{t("collections.score")}</div>
          <div className="numeric text-lg font-bold text-accent">{target.score}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Mini label={t("common.amount")} value={money(r.amount - r.amountPaid)} icon={HandCoins} />
        <Mini
          label={t("collections.expectedRecovery")}
          value={money(target.expectedRecoveryAmount)}
          icon={HandCoins}
        />
        <Mini
          label={t("common.status")}
          value={t("collections.daysOverdue", { days: target.daysOverdue })}
          icon={Clock}
        />
      </div>

      {/* Reasons */}
      <ul className="flex flex-wrap gap-1.5">
        {target.reasonKeys.map((rk, i) => (
          <li key={i}>
            <Badge tone="neutral">{t(rk.key, rk.params)}</Badge>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
        <span>
          {t("collections.lastContacted")}:{" "}
          {r.lastContactedAt ? formatDate(r.lastContactedAt) : t("collections.neverContacted")}
        </span>
      </div>

      {/* Draft controls */}
      <div className="flex flex-wrap items-end gap-2 border-t border-ink/8 pt-3">
        <label className="text-xs text-ink/60">
          <span className="mb-1 block">{t("collections.tone")}</span>
          <Select
            value={tone}
            onChange={(e) => setTone(e.target.value as DraftTone)}
            className="py-1.5"
          >
            {DRAFT_TONES.map((to) => (
              <option key={to} value={to}>
                {t(`collections.toneLabel.${to}`)}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs text-ink/60">
          <span className="mb-1 block">{t("collections.channel")}</span>
          <Select
            value={channel}
            onChange={(e) => setChannel(e.target.value as DraftChannel)}
            className="py-1.5"
          >
            {DRAFT_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {t(`collections.channelLabel.${ch}`)}
              </option>
            ))}
          </Select>
        </label>
        <Button onClick={() => onDraft(tone, channel)} disabled={!canDraft}>
          {t("collections.draftMessage")}
        </Button>
        <Button variant="ghost" onClick={onContacted}>
          <Phone className="h-4 w-4" /> {t("collections.markContacted")}
        </Button>
      </div>
    </Card>
  );
}

function Mini({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof HandCoins;
}) {
  return (
    <div className="rounded-xl bg-ink/3 p-2">
      <Icon className="mx-auto h-3.5 w-3.5 text-ink/30" />
      <div className="mt-0.5 text-[10px] text-ink/45">{label}</div>
      <div className="numeric text-xs font-semibold text-ink">
        <NumericText>{value}</NumericText>
      </div>
    </div>
  );
}
