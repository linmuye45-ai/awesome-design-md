"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mic,
  Send,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Wrench,
  HelpCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Card, Badge, Button } from "@/components/ui/primitives";
import { LOCALE_LABELS } from "@/i18n/config";
import { generateMockResponse } from "@/lib/ai/mock-ai";
import { realNowIso } from "@/lib/clock";
import { draftForActionType } from "@/lib/ai/action-drafts";
import type { AiResponse, AiActionType, AiConversationMessage } from "@/lib/types";

function AskInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const uiLanguage = useAppStore((s) => s.uiLanguage);
  const aiAdvisorLanguage = useAppStore((s) => s.aiAdvisorLanguage);
  const transactions = useAppStore((s) => s.transactions);
  const receivables = useAppStore((s) => s.receivables);
  const payables = useAppStore((s) => s.payables);
  const customers = useAppStore((s) => s.customers);
  const employees = useAppStore((s) => s.employees);
  const conversation = useAppStore((s) => s.conversation);
  const addConversationMessage = useAppStore((s) => s.addConversationMessage);
  const clearConversation = useAppStore((s) => s.clearConversation);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const aiLabel = LOCALE_LABELS[aiAdvisorLanguage];

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const ctx = { transactions, receivables, payables, customers, employees };

    const userMsg: AiConversationMessage = {
      id: `m_${Date.now()}_u`,
      role: "user",
      content: q,
      uiLocaleAtCreation: uiLanguage,
      advisorLocaleAtCreation: aiAdvisorLanguage,
      createdAt: realNowIso(),
    };
    addConversationMessage(userMsg);

    // Structured, key-based response — re-localized live via tAdvisor.
    const response = generateMockResponse(q, ctx);
    const assistantMsg: AiConversationMessage = {
      id: `m_${Date.now()}_a`,
      role: "assistant",
      content: response.answerKey,
      uiLocaleAtCreation: uiLanguage,
      advisorLocaleAtCreation: aiAdvisorLanguage,
      createdAt: realNowIso(),
      response,
    };
    addConversationMessage(assistantMsg);

    if (inputRef.current) inputRef.current.value = "";
  };

  // Seed from ?q= (from dashboard ask box).
  useEffect(() => {
    if (seededRef.current) return;
    const q = searchParams.get("q");
    if (q) {
      seededRef.current = true;
      ask(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const samples = ["revenue", "profitDrop", "payroll", "churn", "draft", "staffing"] as const;

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col">
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={t("ask.title")} subtitle={t("ask.subtitle")} />
        <div className="mt-1 flex shrink-0 items-center gap-2">
          <Badge tone="accent">
            {t("ask.advisorLanguage")}: {aiLabel}
          </Badge>
          {conversation.length > 0 && (
            <button
              onClick={() => clearConversation()}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink/50 hover:bg-ink/5 hover:text-ink"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("ask.clearChat")}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {conversation.length === 0 && (
          <Card>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Lightbulb className="h-4 w-4 text-accent" />
              {t("ask.suggested")}
            </p>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(t(`ask.samples.${s}`))}
                  className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:border-accent hover:text-accent"
                >
                  {t(`ask.samples.${s}`)}
                </button>
              ))}
            </div>
          </Card>
        )}

        {conversation.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-ee-sm bg-accent px-4 py-2.5 text-sm text-white">
                {msg.content}
              </div>
            </div>
          ) : msg.response ? (
            <AnswerCard key={msg.id} response={msg.response} />
          ) : null
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <Card className="sticky bottom-0 shadow-cardHover">
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg p-2 text-ink/40 hover:bg-ink/5"
            title={t("ask.voicePlaceholder")}
          >
            <Mic className="h-4 w-4" />
          </button>
          <input
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask((e.target as HTMLInputElement).value);
            }}
            placeholder={t("ask.placeholder")}
            className="flex-1 bg-transparent py-2 text-sm text-ink placeholder:text-ink/40 outline-none"
          />
          <button
            onClick={() => ask(inputRef.current?.value ?? "")}
            className="rounded-lg bg-accent p-2 text-white hover:bg-accent/90"
            aria-label={t("common.send")}
          >
            <Send className="h-4 w-4 rtl-mirror" />
          </button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Renders a structured AiResponse. Everything is re-translated via `tAdvisor`
 * on each paint, so switching the advisor language updates this card instantly
 * with no re-generation. Action buttons create Action Center drafts.
 */
function AnswerCard({ response }: { response: AiResponse }) {
  const { t, tAdvisor } = useI18n();
  const { toast } = useToast();
  const createDraftAction = useAppStore((s) => s.createDraftAction);

  const createAction = (type: AiActionType) => {
    const d = draftForActionType(type);
    createDraftAction({
      type,
      titleKey: d.titleKey,
      reasonKey: d.reasonKey,
      draftKey: d.draftKey,
      params: d.params,
      evidenceKeys: d.evidenceKeys,
      confidence: "medium",
    });
    toast(t("actions.toastDrafted"));
  };

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-xs font-medium text-ink/45">{tAdvisor("ask.answer")}</p>
        <p className="text-sm leading-relaxed text-ink">
          {tAdvisor(response.answerKey, response.answerParams)}
        </p>
      </div>

      {response.evidence.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink/45">
            <BarChart3 className="h-3.5 w-3.5" />
            {tAdvisor("ask.evidence")}
          </p>
          <ul className="space-y-1">
            {response.evidence.map((e, i) => (
              <li key={i} className="rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs text-ink/70">
                {tAdvisor(e.key, e.params)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response.riskKey && (
        <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-2.5 py-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{tAdvisor(response.riskKey, response.riskParams)}</span>
        </div>
      )}

      {response.nextStepKey && (
        <div className="flex items-center gap-1.5 text-xs text-ink/60">
          <ArrowRight className="h-3.5 w-3.5 text-accent rtl-mirror" />
          {tAdvisor("ask.nextSteps")}:{" "}
          <span className="font-medium text-ink">{tAdvisor(response.nextStepKey)}</span>
        </div>
      )}

      {response.usedTools.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-medium text-ink/40">
            <Wrench className="h-3 w-3" />
            {tAdvisor("ask.usedTools")}:
          </span>
          {response.usedTools.map((tool) => (
            <Badge key={tool} tone="neutral" className="text-[10px]">
              {tAdvisor(`ai.tools.${tool}`)}
            </Badge>
          ))}
        </div>
      )}

      {response.missingData.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-ink/40">
          <HelpCircle className="h-3 w-3" />
          {tAdvisor("ask.missingData")}: {response.missingData.join(", ")}
        </div>
      )}

      {response.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {response.actions.map((a) => (
            <Button key={a} variant="ghost" onClick={() => createAction(a)}>
              <Plus className="h-3.5 w-3.5" />
              {t(`action.type.${a}`)}
            </Button>
          ))}
        </div>
      )}

      {response.needsDisclaimer && (
        <p className="border-t border-ink/10 pt-2 text-[10px] leading-relaxed text-ink/40">
          {tAdvisor("compliance.disclaimer")}
        </p>
      )}
    </Card>
  );
}

export default function AskPage() {
  return (
    <Suspense fallback={null}>
      <AskInner />
    </Suspense>
  );
}
