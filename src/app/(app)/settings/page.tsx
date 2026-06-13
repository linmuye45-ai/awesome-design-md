"use client";

import {
  Globe,
  Bot,
  MapPin,
  Coins,
  Hash,
  ShieldCheck,
  KeyRound,
  Download,
  Scale,
  Info,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { COUNTRIES, CURRENCIES } from "@/lib/data";
import {
  PageHeader,
  Card,
  Field,
  Select,
  TextInput,
  Badge,
  Button,
} from "@/components/ui/primitives";
import { NumericText } from "@/components/NumericText";
import { permissionsForRole } from "@/lib/permissions";
import { formatPreview } from "@/lib/repositories/settings";
import { setDemoMode } from "@/lib/clock";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["owner", "manager", "accountant", "employee", "viewer"];

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { toast } = useToast();

  const business = useAppStore((s) => s.business);
  const updateBusiness = useAppStore((s) => s.updateBusiness);
  const uiLanguage = useAppStore((s) => s.uiLanguage);
  const aiAdvisorLanguage = useAppStore((s) => s.aiAdvisorLanguage);
  const setAiAdvisorLanguage = useAppStore((s) => s.setAiAdvisorLanguage);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const employees = useAppStore((s) => s.employees);
  const toggleGeofenceConsent = useAppStore((s) => s.toggleGeofenceConsent);
  const resetDemo = useAppStore((s) => s.resetDemo);

  const transactions = useAppStore((s) => s.transactions);
  const receivables = useAppStore((s) => s.receivables);
  const payables = useAppStore((s) => s.payables);
  const customers = useAppStore((s) => s.customers);

  const currency = business?.currency ?? "USD";
  const demoMode = business?.demoMode ?? true;
  const preview = formatPreview(locale, currency);

  const exportData = () => {
    const payload = {
      business,
      transactions,
      receivables,
      payables,
      customers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(t("settings.toastExport"));
  };

  const onToggleDemo = (value: boolean) => {
    setDemoMode(value);
    updateBusiness({ demoMode: value });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {/* Localization */}
      <Card className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("settings.localization")}</h2>
        </div>

        <Card className="mb-4 flex items-start gap-3 border border-accent/15 bg-accent/5 p-3 shadow-none">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-xs leading-snug text-ink/70">
            {t("settings.languageIndependentNote")}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.interfaceLanguage")}>
            <div className="relative">
              <Globe className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <Select
                className="ps-9"
                value={uiLanguage}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field label={t("settings.aiAdvisorLanguage")}>
            <div className="relative">
              <Bot className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <Select
                className="ps-9"
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

          <Field label={t("settings.country")}>
            <div className="relative">
              <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <Select
                className="ps-9"
                value={business?.countryCode ?? "CN"}
                onChange={(e) => {
                  const c = COUNTRIES.find((x) => x.code === e.target.value);
                  if (c) updateBusiness({ countryCode: c.code, currency: c.currency });
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {t(`country.${c.code}`)}
                  </option>
                ))}
              </Select>
            </div>
          </Field>

          <Field label={t("settings.currency")}>
            <div className="relative">
              <Coins className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <Select
                className="ps-9"
                value={currency}
                onChange={(e) => updateBusiness({ currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
        </div>

        {/* Live format preview */}
        <div className="mt-4 rounded-xl bg-ink/[0.03] p-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50">
            <Hash className="h-3.5 w-3.5" />
            {t("settings.formatPreview")}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-ink/45">{t("settings.previewCurrency")}</p>
              <p className="mt-0.5 font-semibold text-ink">
                <NumericText>{preview.currency}</NumericText>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink/45">{t("settings.previewNumber")}</p>
              <p className="mt-0.5 font-semibold text-ink">
                <NumericText>{preview.number}</NumericText>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink/45">{t("settings.previewPercent")}</p>
              <p className="mt-0.5 font-semibold text-ink">
                <NumericText>{preview.percent}</NumericText>
              </p>
            </div>
            <div>
              <p className="text-xs text-ink/45">{t("settings.previewDate")}</p>
              <p className="mt-0.5 font-semibold text-ink">
                <NumericText>{preview.date}</NumericText>
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-ink/40">
            <NumericText>{locale}</NumericText>
          </p>
        </div>
      </Card>

      {/* Cash safety line + demo mode */}
      <Card className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("settings.demoMode")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.safetyBuffer")}>
            <TextInput
              type="number"
              value={business?.safetyCashBuffer ?? 5000}
              onChange={(e) =>
                updateBusiness({ safetyCashBuffer: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </Field>
          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-2.5">
              <span className="text-sm font-medium text-ink/70">{t("settings.demoMode")}</span>
              <button
                onClick={() => onToggleDemo(!demoMode)}
                role="switch"
                aria-checked={demoMode}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  demoMode ? "bg-success" : "bg-ink/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    demoMode ? "start-[22px]" : "start-0.5"
                  }`}
                />
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-ink/40">{t("settings.demoModeHint")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            resetDemo();
            toast(t("settings.toastReset"));
          }}
        >
          <RotateCcw className="h-4 w-4 rtl-mirror" />
          {t("settings.resetDemo")}
        </Button>
      </Card>

      {/* Employee privacy */}
      <Card className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("settings.privacy")}</h2>
        </div>
        <p className="mb-3 text-xs leading-snug text-ink/55">{t("team.privacyNotice")}</p>
        <div className="grid gap-2">
          {employees.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-2.5"
            >
              <span className="text-sm text-ink">{t(e.nameKey)}</span>
              <button
                onClick={() => toggleGeofenceConsent(e.id)}
                role="switch"
                aria-checked={e.consentForGeofencing}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  e.consentForGeofencing ? "bg-success" : "bg-ink/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    e.consentForGeofencing ? "start-[22px]" : "start-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink/40">{t("team.consentOwnerNote")}</p>
      </Card>

      {/* Permissions / role simulator */}
      <Card className="mb-4">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("settings.roleSimulator")}</h2>
        </div>
        <p className="mb-3 text-xs leading-snug text-ink/55">{t("settings.roleSimulatorHint")}</p>
        <Field label={t("common.role")}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {permissionsForRole(role).map((p) => (
            <Badge key={p} tone="neutral">
              {p}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Data export */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">{t("settings.dataExport")}</h2>
        </div>
        <Button variant="secondary" onClick={exportData}>
          <Download className="h-4 w-4" />
          {t("settings.exportCta")}
        </Button>
      </Card>

      {/* Compliance */}
      <Card className="border border-ink/10 bg-ink/[0.02] shadow-none">
        <div className="mb-2 flex items-center gap-2">
          <Scale className="h-4 w-4 text-ink/50" />
          <h2 className="text-sm font-semibold text-ink/70">{t("settings.compliance")}</h2>
        </div>
        <p className="text-xs leading-relaxed text-ink/55">{t("compliance.disclaimer")}</p>
      </Card>
    </div>
  );
}
