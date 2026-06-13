"use client";

import { useState } from "react";
import { Check, X, ChevronDown, FileText, Play } from "lucide-react";
import { Card, Button, Badge, Modal } from "./ui/primitives";
import { NumericText } from "./NumericText";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "./ui/Toast";
import { useAppStore } from "@/lib/store";
import { can } from "@/lib/permissions";
import type { AiAction } from "@/lib/types";

/**
 * A single owner-confirmable action. The action's natural-language content
 * (title / reason / draft / evidence) is produced by the AI and is therefore
 * rendered in the ADVISOR language via `tAdvisor`. UI chrome uses `t`.
 *
 * State machine: draft -> approved -> executed, or draft -> dismissed.
 * Approve never sends; Execute opens a confirm modal and writes an audit log.
 */
export function ActionCard({ action }: { action: AiAction }) {
  const { t, tAdvisor, formatCurrency } = useI18n();
  const { toast } = useToast();
  const role = useAppStore((s) => s.role);
  const approveAction = useAppStore((s) => s.approveAction);
  const executeAction = useAppStore((s) => s.executeAction);
  const dismissAction = useAppStore((s) => s.dismissAction);

  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canExecute = can(role, "actions.execute");

  const confidenceTone =
    action.confidence === "high"
      ? "success"
      : action.confidence === "medium"
        ? "warning"
        : "neutral";

  const statusTone =
    action.status === "executed"
      ? "success"
      : action.status === "approved"
        ? "accent"
        : action.status === "dismissed"
          ? "neutral"
          : "warning";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{t(`action.type.${action.type}`)}</Badge>
          <Badge tone={confidenceTone}>
            {t("action.confidence")}: {t(`common.${action.confidence}`)}
          </Badge>
        </div>
        {action.impactAmount !== undefined && (
          <NumericText className="text-sm font-bold text-ink">
            {formatCurrency(action.impactAmount)}
          </NumericText>
        )}
      </div>

      <h3 className="text-sm font-semibold leading-snug text-ink">
        {tAdvisor(action.titleKey, action.params)}
      </h3>

      <div>
        <p className="text-xs font-medium text-ink/45">{t("action.reason")}</p>
        <p className="text-sm leading-snug text-ink/70">
          {tAdvisor(action.reasonKey, action.params)}
        </p>
      </div>

      {action.evidenceKeys && action.evidenceKeys.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink/45">{t("action.evidence")}</p>
          <ul className="mt-1 space-y-1">
            {action.evidenceKeys.map((k) => (
              <li key={k} className="text-xs leading-snug text-ink/60">
                • {tAdvisor(k, action.evidenceParams ?? action.params)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-accent"
      >
        <FileText className="h-3.5 w-3.5" />
        {t("common.draft")}
        <ChevronDown
          className={`h-3.5 w-3.5 transition rtl-mirror ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="rounded-xl bg-ink/5 p-3 text-sm leading-relaxed text-ink/80">
          {tAdvisor(action.draftKey, action.params)}
        </div>
      )}

      {action.status === "draft" && (
        <div className="flex items-center gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              approveAction(action.id);
              toast(t("actions.toastApproved"));
            }}
          >
            <Check className="h-4 w-4" />
            {t("common.approve")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              dismissAction(action.id);
              toast(t("actions.toastDismissed"));
            }}
          >
            <X className="h-4 w-4" />
            {t("common.dismiss")}
          </Button>
        </div>
      )}

      {action.status === "approved" && canExecute && (
        <div className="flex items-center gap-2">
          <Badge tone="accent">{t("action.approved")}</Badge>
          <Button className="ms-auto" onClick={() => setConfirmOpen(true)}>
            <Play className="h-4 w-4" />
            {t("common.execute")}
          </Button>
        </div>
      )}

      {(action.status === "executed" || action.status === "dismissed") && (
        <Badge tone={statusTone}>{t(`action.${action.status}`)}</Badge>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("action.executeConfirmTitle")}
      >
        <p className="mb-4 text-sm leading-relaxed text-ink/70">{t("action.executeConfirmBody")}</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => {
              executeAction(action.id);
              setConfirmOpen(false);
              toast(t("actions.toastExecuted"));
            }}
          >
            {t("common.execute")}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
