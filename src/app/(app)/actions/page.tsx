"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, Inbox } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { PageHeader, Card, EmptyState } from "@/components/ui/primitives";
import { ActionCard } from "@/components/ActionCard";
import type { AiActionStatus } from "@/lib/types";

type Filter = "all" | AiActionStatus;

export default function ActionsPage() {
  const { t } = useI18n();
  const actions = useAppStore((s) => s.actions);
  const [filter, setFilter] = useState<Filter>("all");

  const filters: Filter[] = ["all", "draft", "approved", "executed", "dismissed"];

  const filtered = useMemo(
    () => (filter === "all" ? actions : actions.filter((a) => a.status === filter)),
    [actions, filter]
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("actions.title")} subtitle={t("actions.subtitle")} />

      <Card className="mb-4 flex items-start gap-3 border border-accent/15 bg-accent/5 shadow-none">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <p className="text-sm leading-snug text-ink/70">{t("actions.draftFirst")}</p>
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              filter === f ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
            }`}
          >
            {f === "all" ? t("common.all") : t(`action.${f}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <Inbox className="h-10 w-10 text-ink/20" />
          <EmptyState message={t("actions.empty")} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((a) => (
            <ActionCard key={a.id} action={a} />
          ))}
        </div>
      )}
    </div>
  );
}
