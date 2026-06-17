"use client";

import { useState } from "react";
import { Check, X, Send, FileText } from "lucide-react";
import { Badge, Button, Card, Modal } from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { can } from "@/lib/permissions";
import type { BusinessAction } from "@/lib/cashops/domain";

const STATUS_TONE: Record<BusinessAction["status"], "neutral" | "accent" | "success" | "warning"> =
  {
    draft: "accent",
    approved: "warning",
    executed: "success",
    dismissed: "neutral",
  };

/**
 * Renders a single Action Center draft. The draft body is shown in the AI
 * ADVISOR language (tAdvisor) while the surrounding chrome uses the UI language
 * — honoring the independent-language requirement. Nothing executes without the
 * owner clicking through the confirm modal.
 */
export function DraftActionCard({ action }: { action: BusinessAction }) {
  const { t, tAdvisor } = useI18n();
  const role = useAppStore((s) => s.role);
  const approveAction = useAppStore((s) => s.approveAction);
  const executeAction = useAppStore((s) => s.executeAction);
  const dismissAction = useAppStore((s) => s.dismissAction);
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canApprove = can(role, "actions.approve");
  const canExecute = can(role, "actions.execute");

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{t(`action.type.${action.type}`)}</Badge>
            <Badge tone={STATUS_TONE[action.status]}>{t(`action.${action.status}`)}</Badge>
          </div>
          <h3 className="mt-2 text-base font-bold text-ink">
            {t(action.titleKey, action.titleParams)}
          </h3>
        </div>
        {action.impactAmount !== undefined && (
          <div className="text-end">
            <div className="text-[11px] text-ink/50">{t("action.impact")}</div>
            <div className="numeric text-lg font-bold text-success">
              <NumericTextAmount amount={action.impactAmount} />
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-ink/70">{t(action.rationaleKey, action.rationaleParams)}</p>

      {/* Draft body — advisor language */}
      <div className="rounded-xl bg-ink/3 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-ink/50">
          <FileText className="h-3.5 w-3.5" />
          {t("action.draftReady")}
          {action.channel && (
            <Badge tone="neutral">{t(`collections.channelLabel.${action.channel}`)}</Badge>
          )}
          {action.tone && <Badge tone="neutral">{t(`collections.toneLabel.${action.tone}`)}</Badge>}
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
          {tAdvisor(action.draftKey, action.draftParams)}
        </p>
      </div>

      {/* Evidence */}
      {action.evidenceKeys.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-ink/50">{t("action.evidence")}</div>
          <ul className="space-y-0.5">
            {action.evidenceKeys.map((e, i) => (
              <li key={i} className="text-xs text-ink/60">
                • {t(e.key, e.params)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-ink/8 pt-3">
        {action.status === "draft" && (
          <>
            <Button
              variant="primary"
              onClick={() => {
                approveAction(action.id);
                toast(t("actions.toastApproved"));
              }}
              disabled={!canApprove}
            >
              <Check className="h-4 w-4" /> {t("common.approve")}
            </Button>
            <Button variant="ghost" onClick={() => dismissAction(action.id)}>
              <X className="h-4 w-4" /> {t("common.dismiss")}
            </Button>
          </>
        )}
        {action.status === "approved" && (
          <Button variant="secondary" onClick={() => setConfirmOpen(true)} disabled={!canExecute}>
            <Send className="h-4 w-4" /> {t("common.execute")}
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("action.executeConfirmTitle")}
      >
        <p className="mb-4 text-sm text-ink/70">{t("action.executeConfirmBody")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="secondary"
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

function NumericTextAmount({ amount }: { amount: number }) {
  const { formatCurrency } = useI18n();
  return <NumericText>{formatCurrency(amount)}</NumericText>;
}
