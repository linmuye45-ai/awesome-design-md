"use client";

import { PlugZap, Plug, Check, Lock, Info } from "lucide-react";
import { Card, PageHeader, Button, Badge } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { can } from "@/lib/permissions";
import { CONNECTOR_CAPABILITIES } from "@/lib/cashops/connectors";
import { planAllowsConnector } from "@/lib/cashops/pricing";
import type { ConnectorStatus, DataSource } from "@/lib/cashops/domain";

const STATUS_TONE: Record<
  ConnectorStatus,
  "success" | "warning" | "danger" | "neutral" | "accent"
> = {
  connected: "success",
  syncing: "warning",
  error: "danger",
  disconnected: "neutral",
  demo: "accent",
};

export default function DataSourcesPage() {
  const { t, formatDate } = useI18n();
  const { toast } = useToast();

  const role = useAppStore((s) => s.role);
  const plan = useAppStore((s) => s.business?.plan ?? "starter");
  const dataSources = useAppStore((s) => s.dataSources);
  const connectSource = useAppStore((s) => s.connectSource);
  const disconnectSource = useAppStore((s) => s.disconnectSource);

  const canManage = can(role, "datasources.manage");
  const byKind = new Map<string, DataSource>(dataSources.map((d) => [d.kind, d]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={t("dataSources.title")} subtitle={t("dataSources.subtitle")} />

      <Card className="flex items-start gap-3 border border-accent/15 bg-accent/5 shadow-none">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <p className="text-xs leading-snug text-ink/70">{t("dataSources.mockNote")}</p>
      </Card>

      <div className="flex flex-col gap-3">
        {CONNECTOR_CAPABILITIES.map((cap) => {
          const source = byKind.get(cap.kind);
          const connected = !!source && source.status !== "disconnected";
          const allowed = planAllowsConnector(plan, cap.kind);

          return (
            <Card key={cap.kind} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-ink/5 p-2.5">
                    <PlugZap className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-ink">{t(cap.nameKey)}</span>
                      {source && (
                        <Badge tone={STATUS_TONE[source.status]}>
                          {t(`dataSources.statusLabel.${source.status}`)}
                        </Badge>
                      )}
                      {cap.premium && !allowed && (
                        <Badge tone="warning">
                          <Lock className="me-1 h-3 w-3" /> {t("common.locked")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink/55">{t(cap.descriptionKey)}</p>
                  </div>
                </div>

                {connected ? (
                  <Button
                    variant="ghost"
                    onClick={() => disconnectSource(cap.kind)}
                    disabled={!canManage}
                  >
                    {t("dataSources.disconnect")}
                  </Button>
                ) : allowed ? (
                  <Button
                    onClick={() => {
                      connectSource(cap.kind);
                      toast(t("dataSources.connected"));
                    }}
                    disabled={!canManage}
                  >
                    <Plug className="h-4 w-4" /> {t("dataSources.connect")}
                  </Button>
                ) : (
                  <Badge tone="neutral" className="self-center">
                    {t("dataSources.premiumLocked")}
                  </Badge>
                )}
              </div>

              {/* Feeds + health */}
              <div className="flex flex-wrap items-center gap-2 border-t border-ink/8 pt-3">
                <span className="text-[11px] font-semibold text-ink/45">
                  {t("dataSources.domains")}:
                </span>
                {cap.domains.map((d) => (
                  <Badge key={d} tone="neutral">
                    {t(`dataSources.domain.${d}`)}
                  </Badge>
                ))}
                {source && (
                  <span className="ms-auto flex items-center gap-2 text-[11px] text-ink/50">
                    {source.recordCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-success" />
                        {t("dataSources.records", { count: source.recordCount })}
                      </span>
                    )}
                    <span>
                      {source.lastSyncedAt
                        ? t("dataSources.lastSynced", {
                            date: formatDate(source.lastSyncedAt, {
                              month: "short",
                              day: "numeric",
                            }),
                          })
                        : t("dataSources.neverSynced")}
                    </span>
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
