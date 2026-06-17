"use client";

import { useState } from "react";
import { Send, Sparkles, Trash2, ShieldAlert, Wrench, PlugZap } from "lucide-react";
import { Card, PageHeader, Button, Badge, TextInput } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useNow } from "@/lib/useNow";
import { runAdvisor, SAMPLE_QUESTION_KEYS } from "@/lib/cashops/advisor";
import { advisorContextFromState } from "@/lib/cashops/selectors";
import { collectionTargets, buildCollectionDraft } from "@/lib/cashops/collections";
import { negotiablePlans, buildNegotiationDraft } from "@/lib/cashops/payables";
import { uid } from "@/lib/uid";
import type { AdvisorResponse } from "@/lib/cashops/ai-contract";
import type { ActionType } from "@/lib/cashops/domain";

export default function AdvisorPage() {
  const { t } = useI18n();
  const now = useNow();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const conversation = useAppStore((s) => s.conversation);
  const addMessage = useAppStore((s) => s.addConversationMessage);
  const clearConversation = useAppStore((s) => s.clearConversation);

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    addMessage({ id: uid("msg"), role: "user", text: q, createdAt: new Date().toISOString() });
    const ctx = advisorContextFromState(useAppStore.getState(), now);
    const response = runAdvisor(q, ctx);
    addMessage({
      id: uid("msg"),
      role: "assistant",
      responseJson: JSON.stringify(response),
      createdAt: new Date().toISOString(),
    });
    setInput("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("advisor.title")} subtitle={t("advisor.subtitle")} />

      <Card className="border-s-4 border-accent text-sm text-ink/70">
        {t("advisor.structureNote")}
      </Card>

      {/* Samples */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_QUESTION_KEYS.map((k) => (
          <button
            key={k}
            onClick={() => ask(t(k))}
            className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:bg-ink/5"
          >
            {t(k)}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="flex flex-col gap-3">
        {conversation.map((m) =>
          m.role === "user" ? (
            <div
              key={m.id}
              className="self-end rounded-2xl bg-accent px-4 py-2.5 text-sm text-white"
            >
              {m.text}
            </div>
          ) : (
            <AssistantMessage
              key={m.id}
              response={JSON.parse(m.responseJson ?? "{}") as AdvisorResponse}
              onDraft={(type) => {
                const created = createDraftFromAdvisor(type, now);
                toast(created ? t("actions.toastDrafted") : t("actions.toastMetered"));
              }}
            />
          )
        )}
      </div>

      {/* Input */}
      <Card className="sticky bottom-20 lg:bottom-4">
        <div className="flex items-center gap-2">
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder={t("advisor.placeholder")}
          />
          <Button onClick={() => ask(input)}>
            <Send className="h-4 w-4" />
          </Button>
          {conversation.length > 0 && (
            <Button variant="ghost" onClick={clearConversation} aria-label={t("advisor.clearChat")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/** Build a draft from an advisor-suggested action type, using top targets/plans. */
function createDraftFromAdvisor(type: ActionType, now: Date): boolean {
  const state = useAppStore.getState();
  if (type === "collect_payment") {
    const targets = collectionTargets(state.receivables, now, 1);
    if (!targets.length) return false;
    const id = state.createDraftAction(
      buildCollectionDraft(targets[0].receivable, now, "friendly", "email")
    );
    return id !== null;
  }
  if (type === "delay_payment" || type === "supplier_negotiation") {
    const plans = negotiablePlans(state.payables, now);
    if (!plans.length) return false;
    const id = state.createDraftAction(buildNegotiationDraft(plans[0]));
    return id !== null;
  }
  return false;
}

function AssistantMessage({
  response,
  onDraft,
}: {
  response: AdvisorResponse;
  onDraft: (type: ActionType) => void;
}) {
  const { t, tAdvisor } = useI18n();

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
        <Sparkles className="h-4 w-4" /> {t("app.name")}
      </div>

      {/* Direct answer */}
      <p className="text-sm font-medium leading-relaxed text-ink">
        {tAdvisor(response.answer.key, response.answer.params)}
      </p>

      {/* Evidence */}
      {response.evidence.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-ink/50">{t("advisor.evidence")}</div>
          <ul className="space-y-0.5">
            {response.evidence.map((e, i) => (
              <li key={i} className="text-xs text-ink/60">
                • {tAdvisor(e.key, e.params)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk */}
      {response.risk && (
        <div className="flex items-start gap-2 rounded-xl bg-danger/8 p-2.5 text-xs text-danger">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{tAdvisor(response.risk.key, response.risk.params)}</span>
        </div>
      )}

      {/* Recommendation */}
      {response.recommendation && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-ink/50">
            {t("advisor.recommendation")}
          </div>
          <p className="text-sm text-ink/70">
            {tAdvisor(response.recommendation.key, response.recommendation.params)}
          </p>
        </div>
      )}

      {/* Missing data */}
      {response.missingData.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-ink/50">
            <PlugZap className="h-3.5 w-3.5" /> {t("advisor.missingData")}
          </div>
          <ul className="space-y-0.5">
            {response.missingData.map((md, i) => (
              <li key={i} className="text-xs text-ink/60">
                • {t(md.domainKey)} — {t(md.connectKey)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Draft actions */}
      {response.draftActions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-ink/8 pt-3">
          {response.draftActions.map((type) => (
            <Button key={type} variant="ghost" onClick={() => onDraft(type)}>
              {t("advisor.addDraft")}: {t(`action.type.${type}`)}
            </Button>
          ))}
        </div>
      )}

      {/* Tools used + disclaimer */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink/40">
        {response.usedTools.length > 0 && (
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" /> {t("advisor.usedTools")}:
          </span>
        )}
        {response.usedTools.map((tool) => (
          <Badge key={tool} tone="neutral">
            {tool}
          </Badge>
        ))}
      </div>
      {response.needsDisclaimer && (
        <p className="border-t border-ink/8 pt-2 text-[11px] leading-snug text-ink/40">
          {t("compliance.disclaimer")}
        </p>
      )}
    </Card>
  );
}
