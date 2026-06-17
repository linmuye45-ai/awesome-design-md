"use client";

import { useMemo, useState } from "react";
import { Inbox, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui/primitives";
import { DraftActionCard } from "@/components/cashops/DraftActionCard";
import type { ActionStatus } from "@/lib/cashops/domain";

type Filter = "all" | ActionStatus;

const FILTERS: Filter[] = ["all", "draft", "approved", "executed", "dismissed"];

const FILTER_LABEL_KEY: Record<Filter, string> = {
  all: "actions.filterAll",
  draft: "actions.filterDraft",
  approved: "actions.filterApproved",
  executed: "actions.filterExecuted",
  dismissed: "actions.filterDismissed",
};

export default function ActionsPage() {
  const { t } = useI18n();
  const actions = useAppStore((s) => s.actions);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? actions : actions.filter((a) => a.status === filter)),
    [actions, filter]
  );

  const pendingCount = useMemo(() => actions.filter((a) => a.status === "draft").length, [actions]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title={t("actions.title")} subtitle={t("actions.subtitle")} />

      <Card className="flex items-start gap-3 border border-accent/15 bg-accent/5 shadow-none">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium leading-snug text-ink">{t("actions.humanInLoop")}</p>
          <p className="text-xs leading-snug text-ink/60">{t("actions.draftFirst")}</p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              filter === f ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t(FILTER_LABEL_KEY[f])}
          </button>
        ))}
        {pendingCount > 0 && (
          <Badge tone="accent" className="ms-auto">
            {t("actions.pendingCount", { count: pendingCount })}
          </Badge>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Inbox className="h-10 w-10 text-ink/20" />
          <EmptyState message={t("actions.empty")} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((a) => (
            <DraftActionCard key={a.id} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}
