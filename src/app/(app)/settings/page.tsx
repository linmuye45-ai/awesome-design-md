"use client";

import type { ReactNode } from "react";
import { Globe, Bot, Coins, ShieldCheck, Info, FlaskConical, RotateCcw } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import {
  PageHeader,
  Card,
  Field,
  Select,
  TextInput,
  Badge,
  Button,
} from "@/components/ui/primitives";
import { can } from "@/lib/permissions";
import type { Mode, Role } from "@/lib/cashops/domain";

const ROLES: Role[] = ["owner", "admin", "accountant", "manager", "viewer"];

export default function SettingsPage() {
  const { t, locale, setLocale, formatCurrency, formatNumber, formatPercent, formatDate } =
    useI18n();
  const { toast } = useToast();

  const business = useAppStore((s) => s.business);
  const updateBusiness = useAppStore((s) => s.updateBusiness);
  const aiAdvisorLanguage = useAppStore((s) => s.aiAdvisorLanguage);
  const setAiAdvisorLanguage = useAppStore((s) => s.setAiAdvisorLanguage);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const resetDemo = useAppStore((s) => s.resetDemo);

  const currency = business?.currency ?? "USD";
  const mode: Mode = business?.mode ?? "demo";
  const canManageTeam = can(role, "settings.manageTeam");

  const saveGuardrail = (patch: Parameters<typeof updateBusiness>[0]) => {
    updateBusiness(patch);
    toast(t("settings.toastSaved"));
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {/* Localization */}
      <Card>
        <SectionHeader
          icon={<Globe className="h-4 w-4 text-accent" />}
          title={t("settings.localization")}
        />

        <Card className="mb-4 flex items-start gap-3 border border-accent/15 bg-accent/5 p-3 shadow-none">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-xs leading-snug text-ink/70">
            {t("settings.languageIndependentNote")}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.interfaceLanguage")}>
            <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t("settings.aiAdvisorLanguage")}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 shrink-0 text-accent" />
              <Select
                value={aiAdvisorLanguage}
                onChange={(e) => setAiAdvisorLanguage(e.target.value as Locale)}
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
        </div>

        {/* Format preview */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-ink/3 p-3 sm:grid-cols-4">
          <PreviewCell
            label={t("settings.previewCurrency")}
            value={formatCurrency(1234567.5, currency)}
          />
          <PreviewCell label={t("settings.previewNumber")} value={formatNumber(1234567.89)} />
          <PreviewCell label={t("settings.previewPercent")} value={formatPercent(0.1834, 1)} />
          <PreviewCell label={t("settings.previewDate")} value={formatDate(new Date())} />
        </div>
      </Card>

      {/* Cash guardrails */}
      <Card>
        <SectionHeader
          icon={<Coins className="h-4 w-4 text-accent" />}
          title={t("settings.cashGuardrails")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.cashSafetyLine")}>
            <TextInput
              type="number"
              min={0}
              step={500}
              defaultValue={business?.cashSafetyLine ?? 0}
              onBlur={(e) => saveGuardrail({ cashSafetyLine: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("settings.taxReserveRate")}>
            <TextInput
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={Math.round((business?.taxReserveRate ?? 0) * 100)}
              onBlur={(e) =>
                saveGuardrail({
                  taxReserveRate: Math.min(1, Math.max(0, Number(e.target.value) / 100)),
                })
              }
            />
          </Field>
          <Field label={t("settings.payrollDay")}>
            <TextInput
              type="number"
              min={1}
              max={28}
              defaultValue={business?.payrollDay ?? 1}
              onBlur={(e) => saveGuardrail({ payrollDay: clampDay(Number(e.target.value)) })}
            />
          </Field>
          <Field label={t("settings.rentDay")}>
            <TextInput
              type="number"
              min={1}
              max={28}
              defaultValue={business?.rentDay ?? 1}
              onBlur={(e) => saveGuardrail({ rentDay: clampDay(Number(e.target.value)) })}
            />
          </Field>
        </div>
      </Card>

      {/* Mode */}
      <Card>
        <SectionHeader
          icon={<FlaskConical className="h-4 w-4 text-accent" />}
          title={t("settings.mode")}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeOption
            active={mode === "demo"}
            title={t("mode.demoTitle")}
            body={t("mode.demoBody")}
            badge={t("demo.badge")}
            onSelect={() => saveGuardrail({ mode: "demo" })}
          />
          <ModeOption
            active={mode === "production"}
            title={t("mode.productionTitle")}
            body={t("mode.productionBody")}
            badge={t("demo.production")}
            onSelect={() => saveGuardrail({ mode: "production" })}
          />
        </div>
      </Card>

      {/* Role simulator */}
      <Card>
        <SectionHeader
          icon={<ShieldCheck className="h-4 w-4 text-accent" />}
          title={t("settings.roleSimulator")}
        />
        <p className="mb-3 text-xs leading-snug text-ink/60">{t("settings.roleSimulatorHint")}</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                role === r ? "bg-ink text-white" : "bg-white text-ink/60 hover:bg-ink/5"
              }`}
            >
              {t(`roles.${r}`)}
            </button>
          ))}
          {!canManageTeam && (
            <Badge tone="neutral" className="self-center">
              {t("common.restricted")}
            </Badge>
          )}
        </div>
      </Card>

      {/* Reset demo */}
      <Card className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t("settings.resetDemo")}</h2>
          <p className="mt-0.5 text-xs text-ink/55">{t("mode.demoBody")}</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            resetDemo();
            toast(t("settings.toastReset"));
          }}
        >
          <RotateCcw className="h-4 w-4" /> {t("settings.resetDemo")}
        </Button>
      </Card>

      <p className="px-1 pb-2 text-[11px] leading-snug text-ink/40">{t("compliance.disclaimer")}</p>
    </div>
  );
}

function clampDay(n: number): number {
  if (Number.isNaN(n)) return 1;
  return Math.min(28, Math.max(1, Math.round(n)));
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
    </div>
  );
}

function PreviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-ink/45">{label}</span>
      <span className="numeric text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

function ModeOption({
  active,
  title,
  body,
  badge,
  onSelect,
}: {
  active: boolean;
  title: string;
  body: string;
  badge: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col gap-1.5 rounded-2xl border p-4 text-start transition ${
        active ? "border-accent bg-accent/5" : "border-ink/12 bg-white hover:bg-ink/3"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink">{title}</span>
        {active && <Badge tone="accent">{badge}</Badge>}
      </div>
      <p className="text-xs leading-snug text-ink/60">{body}</p>
    </button>
  );
}
