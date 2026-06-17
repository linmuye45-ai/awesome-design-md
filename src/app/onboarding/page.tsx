"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Briefcase,
  Stethoscope,
  Boxes,
  ShoppingBag,
  UtensilsCrossed,
  ShoppingCart,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button, Card, Field, Select, TextInput } from "@/components/ui/primitives";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { realNowIso } from "@/lib/clock";
import { CONNECTOR_CAPABILITIES } from "@/lib/cashops/connectors";
import { DEMO_BUSINESS_ID } from "@/lib/cashops/demo-data";
import type { ConnectorKind, Industry, Mode, PaymentMethod } from "@/lib/cashops/domain";

const INDUSTRY_ICONS: Record<Industry, LucideIcon> = {
  contractor: HardHat,
  agency: Briefcase,
  clinic: Stethoscope,
  wholesale: Boxes,
  retail: ShoppingBag,
  restaurant: UtensilsCrossed,
  ecommerce: ShoppingCart,
};

const INDUSTRIES: Industry[] = [
  "contractor",
  "agency",
  "clinic",
  "wholesale",
  "retail",
  "restaurant",
  "ecommerce",
];

const PAYMENT_METHODS: PaymentMethod[] = ["ach", "card", "wire", "check", "cash", "wallet"];

export default function Onboarding() {
  const { t } = useI18n();
  const router = useRouter();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState<Industry>("contractor");
  const [name, setName] = useState("");
  const [sources, setSources] = useState<ConnectorKind[]>(["quickbooks"]);
  const [mode, setMode] = useState<Mode>("demo");
  const [safetyLine, setSafetyLine] = useState(25000);
  const [payrollDay, setPayrollDay] = useState(15);
  const [rentDay, setRentDay] = useState(1);
  const [taxRate, setTaxRate] = useState(0.12);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ach");
  const [uiLanguage, setUiLanguage] = useState<Locale>("en");
  const [aiLanguage, setAiLanguage] = useState<Locale>("en");

  const TOTAL = 4;

  function toggleSource(kind: ConnectorKind) {
    setSources((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));
  }

  function finish() {
    const stamp = realNowIso();
    completeOnboarding(
      {
        id: DEMO_BUSINESS_ID,
        name: name.trim() || "My Business",
        industry,
        countryCode: "US",
        currency: "USD",
        timezone: "America/Chicago",
        uiLanguage,
        aiAdvisorLanguage: aiLanguage,
        cashSafetyLine: safetyLine,
        payrollDay,
        rentDay,
        taxReserveRate: taxRate,
        defaultPaymentMethod: paymentMethod,
        plan: "pro",
        mode,
        createdAt: stamp,
        updatedAt: stamp,
        onboardedAt: stamp,
      },
      sources
    );
    router.replace("/dashboard");
  }

  const canNext = step === 0 ? true : step === 1 ? sources.length > 0 : true;

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-white">
              A
            </div>
            <span className="font-black text-ink">{t("app.name")}</span>
          </div>
          <LanguageSwitcher />
        </div>

        <Card className="flex flex-col gap-5">
          <div>
            <div className="text-xs font-semibold text-accent">
              {t("onboarding.step", { current: step + 1, total: TOTAL })}
            </div>
            <h1 className="mt-1 text-xl font-bold text-ink">{t("onboarding.title")}</h1>
            <p className="mt-1 text-sm text-ink/60">{t("onboarding.subtitle")}</p>
          </div>

          {/* Step 0: industry + name */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-2 text-sm font-medium text-ink/80">
                  {t("onboarding.stepIndustry")}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {INDUSTRIES.map((ind) => {
                    const Icon = INDUSTRY_ICONS[ind];
                    return (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition",
                          industry === ind
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-ink/15 text-ink/70 hover:bg-ink/5"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {t(`onboarding.industry.${ind}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label={t("onboarding.stepBusinessName")}>
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("onboarding.businessNamePlaceholder")}
                />
              </Field>
            </div>
          )}

          {/* Step 1: data source + mode */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-medium text-ink/80">
                  {t("onboarding.stepDataSource")}
                </div>
                <div className="mt-0.5 text-xs text-ink/50">{t("onboarding.dataSourceHint")}</div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CONNECTOR_CAPABILITIES.map((cap) => {
                    const selected = sources.includes(cap.kind);
                    return (
                      <button
                        key={cap.kind}
                        onClick={() => toggleSource(cap.kind)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-3 text-start transition",
                          selected ? "border-accent bg-accent/10" : "border-ink/15 hover:bg-ink/5"
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-ink">
                            {t(cap.nameKey)}
                          </span>
                          <span className="block text-xs text-ink/55">{t(cap.descriptionKey)}</span>
                        </span>
                        {selected && <Check className="h-4 w-4 shrink-0 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-ink/80">
                  {t("onboarding.chooseMode")}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ModeCard
                    active={mode === "demo"}
                    onClick={() => setMode("demo")}
                    title={t("mode.demoTitle")}
                    body={t("mode.demoBody")}
                  />
                  <ModeCard
                    active={mode === "production"}
                    onClick={() => setMode("production")}
                    title={t("mode.productionTitle")}
                    body={t("mode.productionBody")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: cash settings */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("onboarding.cashSafetyLine")}>
                <TextInput
                  type="number"
                  value={safetyLine}
                  onChange={(e) => setSafetyLine(Number(e.target.value))}
                />
                <span className="mt-1 block text-xs text-ink/45">
                  {t("onboarding.cashSafetyLineHint")}
                </span>
              </Field>
              <Field label={t("onboarding.defaultPaymentMethod")}>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("onboarding.payrollDay")}>
                <TextInput
                  type="number"
                  min={1}
                  max={28}
                  value={payrollDay}
                  onChange={(e) => setPayrollDay(Number(e.target.value))}
                />
              </Field>
              <Field label={t("onboarding.rentDay")}>
                <TextInput
                  type="number"
                  min={1}
                  max={28}
                  value={rentDay}
                  onChange={(e) => setRentDay(Number(e.target.value))}
                />
              </Field>
              <Field label={t("onboarding.taxReserveRate")}>
                <Select value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}>
                  {[0, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25].map((r) => (
                    <option key={r} value={r}>
                      {Math.round(r * 100)}%
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {/* Step 3: languages */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-ink/60">{t("settings.languageIndependentNote")}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("onboarding.uiLanguage")}>
                  <Select
                    value={uiLanguage}
                    onChange={(e) => setUiLanguage(e.target.value as Locale)}
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {LOCALE_LABELS[l]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t("onboarding.aiLanguage")}>
                  <Select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value as Locale)}
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {LOCALE_LABELS[l]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-ink/8 pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              {t("common.back")}
            </Button>
            {step < TOTAL - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                {t("common.next")}
              </Button>
            ) : (
              <Button onClick={finish}>{t("onboarding.finishCta")}</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-start transition",
        active ? "border-accent bg-accent/10" : "border-ink/15 hover:bg-ink/5"
      )}
    >
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="mt-0.5 block text-xs leading-snug text-ink/55">{body}</span>
    </button>
  );
}
