import type { Locale } from "@/i18n/config";
import { formatCurrency, formatNumber, formatPercent, formatDate } from "@/i18n/format";

/** Live preview of how numbers/dates render for a given locale + currency. */
export function formatPreview(locale: Locale, currency: string) {
  const sample = 1234567.89;
  return {
    currency: formatCurrency(sample, currency, locale),
    number: formatNumber(sample, locale),
    percent: formatPercent(0.146, locale, 1),
    date: formatDate(new Date(), locale),
  };
}
