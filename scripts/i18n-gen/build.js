#!/usr/bin/env node
/**
 * Locale builder. Produces all 12 locale JSON files from a single English base
 * plus per-locale override modules. Any key not overridden falls back to the
 * English base value, so every locale is guaranteed to have IDENTICAL keys and
 * IDENTICAL {param} placeholders (check:i18n stays green).
 */
const fs = require("node:fs");
const path = require("node:path");

const base = require("./base.js");

const LOCALES = [
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
];

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Deep clone the base, then overlay overrides. Overrides may only REPLACE leaf
// string values for existing keys; the key shape always comes from base.
function applyOverrides(baseObj, overrideObj) {
  const out = Array.isArray(baseObj) ? [...baseObj] : { ...baseObj };
  for (const k of Object.keys(baseObj)) {
    const bv = baseObj[k];
    const ov = overrideObj ? overrideObj[k] : undefined;
    if (isPlainObject(bv)) {
      out[k] = applyOverrides(bv, isPlainObject(ov) ? ov : undefined);
    } else if (typeof ov === "string") {
      out[k] = ov;
    } else {
      out[k] = bv;
    }
  }
  return out;
}

const OUT_DIR = path.resolve(__dirname, "../../src/i18n/locales");

for (const locale of LOCALES) {
  let overrides = {};
  if (locale !== "en") {
    const file = path.join(__dirname, "overrides", `${locale}.js`);
    if (fs.existsSync(file)) overrides = require(file);
  }
  const merged = applyOverrides(base, overrides);
  const json = JSON.stringify(merged, null, 2) + "\n";
  fs.writeFileSync(path.join(OUT_DIR, `${locale}.json`), json, "utf-8");
  console.log(`wrote ${locale}.json`);
}
console.log("done.");
