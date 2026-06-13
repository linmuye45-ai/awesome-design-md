"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  ShoppingBag,
  Scissors,
  GraduationCap,
  Wrench,
  Briefcase,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button, Card, Field, TextInput, Select } from "@/components/ui/primitives";
import { COUNTRIES, CURRENCIES, EMPLOYEE_RANGES, BUSINESS_TYPES } from "@/lib/data";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { BUSINESS_ID } from "@/lib/mock-data";
import { realNowIso } from "@/lib/clock";
import type { Business, BusinessType } from "@/lib/types";
import { cn } from "@/lib/cn";

const TYPE_ICONS: Record<BusinessType, LucideIcon> = {
  restaurant: Utensils,
  retail: ShoppingBag,
  beauty: Scissors,
  education: GraduationCap,
  local_service: Wrench,
  freelance: Briefcase,
  other: MoreHorizontal,
};

const TYPES: BusinessType[] = [...BUSINESS_TYPES];

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setAiAdvisorLanguage = useAppStore((s) => s.setAiAdvisorLanguage);

  const [step, setStep] = useState(0);
  const [type, setType] = useState<BusinessType>("restaurant");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("CN");
  const [currency, setCurrency] = useState("CNY");
  const [aiLang, setAiLang] = useState<Locale>(locale);
  const [employeeRange, setEmployeeRange] = useState<string>("6-15");
  const [useDemo, setUseDemo] = useState(true);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    const stamp = realNowIso();
    const business: Business = {
      id: BUSINESS_ID,
      name: name.trim() || t("app.name"),
      type,
      countryCode,
      currency,
      timezone: "Asia/Shanghai",
      uiLanguage: locale,
      aiAdvisorLanguage: aiLang,
      employeeCountRange: employeeRange,
      safetyCashBuffer: 5000,
      demoMode: useDemo,
      createdAt: stamp,
      updatedAt: stamp,
    };
    setAiAdvisorLanguage(aiLang);
    completeOnboarding(business);
    router.replace("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-white">
            A
          </div>
          <span className="text-lg font-black text-ink">{t("app.name")}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-ink/50">
            <span>{t("onboarding.step", { current: step + 1, total: TOTAL_STEPS })}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {step === 0 && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-ink">{t("onboarding.title")}</h1>
            <p className="mb-6 text-sm text-ink/60">{t("onboarding.subtitle")}</p>
            <h2 className="mb-3 text-base font-semibold text-ink">
              {t("onboarding.stepBusinessType")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TYPES.map((ty) => {
                const Icon = TYPE_ICONS[ty];
                return (
                  <button
                    key={ty}
                    onClick={() => setType(ty)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-sm font-medium transition",
                      type === ty
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-ink/10 bg-white text-ink/70 hover:border-ink/20"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    {t(`onboarding.type.${ty}`)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-ink">{t("onboarding.stepBusinessName")}</h2>
            <Field label={t("common.name")}>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onboarding.businessNamePlaceholder")}
                autoFocus
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">{t("onboarding.stepCountry")}</h2>
            <Field label={t("settings.country")}>
              <Select
                value={countryCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setCountryCode(code);
                  const c = COUNTRIES.find((x) => x.code === code);
                  if (c) setCurrency(c.currency);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {t(`country.${c.code}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("onboarding.stepCurrency")}>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">{t("onboarding.stepUiLanguage")}</h2>
            <Field label={t("settings.interfaceLanguage")}>
              <Select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">{t("onboarding.stepAiLanguage")}</h2>
            <Field label={t("settings.aiAdvisorLanguage")}>
              <Select value={aiLang} onChange={(e) => setAiLang(e.target.value as Locale)}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </Select>
            </Field>
            <Card className="bg-ink/5 shadow-none">
              <p className="text-xs leading-relaxed text-ink/60">
                {t("settings.languageIndependentNote")}
              </p>
            </Card>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">{t("onboarding.stepEmployees")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {EMPLOYEE_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setEmployeeRange(r)}
                  className={cn(
                    "rounded-2xl border p-4 text-sm font-medium transition",
                    employeeRange === r
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-ink/10 bg-white text-ink/70 hover:border-ink/20"
                  )}
                >
                  {t(`onboarding.employeeRange.${r}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">{t("onboarding.useDemoData")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setUseDemo(true)}
                className={cn(
                  "rounded-2xl border p-4 text-sm font-medium transition",
                  useDemo
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-ink/10 bg-white text-ink/70 hover:border-ink/20"
                )}
              >
                {t("common.yes")}
              </button>
              <button
                onClick={() => setUseDemo(false)}
                className={cn(
                  "rounded-2xl border p-4 text-sm font-medium transition",
                  !useDemo
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-ink/10 bg-white text-ink/70 hover:border-ink/20"
                )}
              >
                {t("common.no")}
              </button>
            </div>
            <Card className="bg-ink/5 shadow-none">
              <p className="text-xs leading-relaxed text-ink/60">
                {t("onboarding.useDemoDataHint")}
              </p>
            </Card>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("common.back")}
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={next} disabled={step === 1 && !name.trim()}>
              {t("common.next")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          ) : (
            <Button onClick={finish}>{t("onboarding.finishCta")}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
