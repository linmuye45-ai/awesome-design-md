"use client";

import React, { createContext, useContext, useCallback, useEffect, useMemo } from "react";
import { LOCALES, DEFAULT_LOCALE, isRTL, type Locale } from "./config";
import { MESSAGES } from "./messages";
import {
  formatCurrency as fmtCurrency,
  formatNumber as fmtNumber,
  formatDate as fmtDate,
  formatPercent as fmtPercent,
  formatTime as fmtTime,
} from "./format";
import { useAppStore } from "@/lib/store";

type TParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  getLocale: () => Locale;
  t: (key: string, params?: TParams) => string;
  /** Translate using the AI advisor language instead of the UI language. */
  tAdvisor: (key: string, params?: TParams) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number, fractionDigits?: number) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string) => string;
  isRTL: boolean;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(messages: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as object)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(
  template: string,
  params: TParams | undefined,
  resolveParam: (name: string, value: string | number) => string
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? resolveParam(name, params[name]) : `{${name}}`
  );
}

// Param names whose numeric values should be auto-formatted as currency.
const CURRENCY_PARAMS = new Set([
  "amount",
  "revenue",
  "expenses",
  "profit",
  "safety",
  "lowest",
  "impact",
  "total_amount",
]);

export function setDocumentDirection(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
}

export function setDocumentLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const uiLanguage = useAppStore((s) => s.uiLanguage);
  const aiAdvisorLanguage = useAppStore((s) => s.aiAdvisorLanguage);
  const setUiLanguage = useAppStore((s) => s.setUiLanguage);
  const hydrated = useAppStore((s) => s.hydrated);

  const locale: Locale = LOCALES.includes(uiLanguage) ? uiLanguage : DEFAULT_LOCALE;

  // Drive <html dir/lang> from the current locale, live.
  useEffect(() => {
    setDocumentDirection(locale);
    setDocumentLang(locale);
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setUiLanguage(next);
      setDocumentDirection(next);
      setDocumentLang(next);
    },
    [setUiLanguage]
  );

  const business = useAppStore((s) => s.business);
  const currency = business?.currency ?? "USD";

  const value = useMemo<I18nContextValue>(() => {
    const messages = MESSAGES[locale] as unknown as Record<string, unknown>;
    const advisorMessages = MESSAGES[aiAdvisorLanguage] as unknown as Record<string, unknown>;
    const fallback = MESSAGES[DEFAULT_LOCALE] as unknown as Record<string, unknown>;

    // Build a param resolver bound to a message source + formatting locale.
    // - String params starting with "@" are treated as nested i18n keys and
    //   translated in the same language as the surrounding string.
    // - Numeric params named like money are auto-formatted as currency.
    // - Other numeric params are formatted with the locale number formatter.
    const makeResolver =
      (src: Record<string, unknown>, fmtLocale: Locale) =>
      (name: string, value: string | number): string => {
        if (typeof value === "string" && value.startsWith("@")) {
          const nested = value.slice(1);
          return resolveKey(src, nested) ?? resolveKey(fallback, nested) ?? nested;
        }
        if (typeof value === "number") {
          if (CURRENCY_PARAMS.has(name)) return fmtCurrency(value, currency, fmtLocale);
          return fmtNumber(value, fmtLocale);
        }
        return String(value);
      };

    const t = (key: string, params?: TParams): string => {
      const resolved = resolveKey(messages, key) ?? resolveKey(fallback, key);
      if (resolved === undefined) return key;
      return interpolate(resolved, params, makeResolver(messages, locale));
    };

    const tAdvisor = (key: string, params?: TParams): string => {
      const resolved = resolveKey(advisorMessages, key) ?? resolveKey(fallback, key);
      if (resolved === undefined) return key;
      return interpolate(resolved, params, makeResolver(advisorMessages, aiAdvisorLanguage));
    };

    return {
      locale,
      setLocale,
      getLocale: () => locale,
      t,
      tAdvisor,
      formatCurrency: (amount: number, cur?: string) =>
        fmtCurrency(amount, cur ?? currency, locale),
      formatNumber: (v: number) => fmtNumber(v, locale),
      formatPercent: (v: number, fd?: number) => fmtPercent(v, locale, fd),
      formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
        fmtDate(date, locale, options),
      formatTime: (date: Date | string) => fmtTime(date, locale),
      isRTL: isRTL(locale),
      dir: isRTL(locale) ? "rtl" : "ltr",
    };
  }, [locale, aiAdvisorLanguage, currency, setLocale]);

  // Avoid hydration mismatch: render children only once the persisted store
  // has been read on the client. Keep markup identical pre/post hydration.
  if (!hydrated) {
    return (
      <I18nContext.Provider value={value}>
        <div className="min-h-screen" suppressHydrationWarning />
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
