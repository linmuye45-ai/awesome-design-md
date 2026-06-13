import type { Locale } from "./config";

import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import esMX from "./locales/es-MX.json";
import ptBR from "./locales/pt-BR.json";
import enIN from "./locales/en-IN.json";
import id from "./locales/id.json";
import th from "./locales/th.json";
import vi from "./locales/vi.json";
import ar from "./locales/ar.json";

export type Messages = typeof en;

export const MESSAGES: Record<Locale, Messages> = {
  "zh-CN": zhCN as Messages,
  "zh-TW": zhTW as Messages,
  en: en as Messages,
  ja: ja as Messages,
  ko: ko as Messages,
  "es-MX": esMX as Messages,
  "pt-BR": ptBR as Messages,
  "en-IN": enIN as Messages,
  id: id as Messages,
  th: th as Messages,
  vi: vi as Messages,
  ar: ar as Messages,
};
