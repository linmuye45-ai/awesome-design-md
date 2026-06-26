"use client";

import { useState } from "react";
import { ShieldCheck, Download, Trash2, Lock, FileClock } from "lucide-react";
import { Card, PageHeader, Button, Badge, EmptyState, Modal } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { can, canSeeSensitiveFinancials } from "@/lib/permissions";

export default function AuditPage() {
  const { t, formatDate, formatTime } = useI18n();
  const { toast } = useToast();

  const auditLog = useAppStore((s) => s.auditLog);
  const role = useAppStore((s) => s.role);
  const business = useAppStore((s) => s.business);
  const resetDemo = useAppStore((s) => s.resetDemo);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const canExport = can(role, "data.export");
  const canDelete = can(role, "data.delete");
  const seeSensitive = canSeeSensitiveFinancials(role);

  const exportData = () => {
    const state = useAppStore.getState();
    const payload = {
      business: state.business,
      dataSources: state.dataSources,
      bank: state.bank,
      receivables: state.receivables,
      payables: state.payables,
      recurring: state.recurring,
      actions: state.actions,
      auditLog: state.auditLog,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-cashops-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(t("audit.toastExported"));
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />

      {/* Privacy / trust note */}
      <Card className="flex items-start gap-3 border border-accent/15 bg-accent/5 shadow-none">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div>
          <h2 className="text-sm font-semibold text-ink">{t("audit.privacy")}</h2>
          <p className="mt-0.5 text-xs leading-snug text-ink/65">{t("audit.privacyBody")}</p>
          {!seeSensitive && (
            <Badge tone="warning" className="mt-2">
              {t("audit.redactionNote")}
            </Badge>
          )}
        </div>
      </Card>

      {/* Data controls */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("audit.dataControls")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportData} disabled={!canExport}>
            <Download className="h-4 w-4" /> {t("audit.exportData")}
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)} disabled={!canDelete}>
            <Trash2 className="h-4 w-4" /> {t("audit.deleteData")}
          </Button>
        </div>
      </Card>

      {/* Audit log */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <FileClock className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("audit.auditLog")}</h2>
        </div>

        {auditLog.length === 0 ? (
          <EmptyState message={t("audit.auditEmpty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink/40">
                  <th className="px-2 py-2 text-start font-semibold">{t("audit.time")}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t("audit.actor")}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t("audit.actionCol")}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t("audit.target")}</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-t border-ink/8">
                    <td className="whitespace-nowrap px-2 py-2 text-ink/55">
                      {formatDate(entry.createdAt, { month: "short", day: "numeric" })}{" "}
                      {formatTime(entry.createdAt)}
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone="neutral">{t(`roles.${entry.actorRole}`)}</Badge>
                    </td>
                    <td className="px-2 py-2 font-medium text-ink">{entry.action}</td>
                    <td className="px-2 py-2 text-ink/55">
                      {entry.targetType}
                      {entry.targetId ? ` · ${entry.targetId}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="px-1 pb-2 text-[11px] leading-snug text-ink/40">
        <span className="font-semibold text-ink/55">{t("audit.disclaimerTitle")}: </span>
        {t("compliance.disclaimer")}
      </p>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t("audit.deleteData")}>
        <p className="mb-4 text-sm text-ink/70">{t("audit.deleteConfirm")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetDemo();
              setDeleteOpen(false);
              toast(t("audit.toastDeleted"));
            }}
          >
            <Trash2 className="h-4 w-4" /> {t("common.delete")}
          </Button>
        </div>
      </Modal>

      {business?.mode === "demo" && <span className="sr-only">{business.name}</span>}
    </div>
  );
}
