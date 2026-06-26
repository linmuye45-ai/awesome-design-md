export const LOCALES = [
  "zh-CN",
  "zh-TW",
  "en",
  "ja",
  "ko",
  "es-MX",
  "pt-BR",
  "en-IN",
  "id",
  "th",
  "vi",
  "ar",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  "es-MX": "Español (México)",
  "pt-BR": "Português (Brasil)",
  "en-IN": "English (India)",
  id: "Bahasa Indonesia",
  th: "ไทย",
  vi: "Tiếng Việt",
  ar: "العربية",
};

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
