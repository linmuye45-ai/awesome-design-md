/**
 * check-i18n
 * --------------------------------------------------------------------------
 * Verifies that every locale file under src/i18n/locales has EXACTLY the same
 * set of (dot-notation) keys as the base locale (en.json). This guards the
 * hard requirement that "all 12 locale files must have identical keys" so the
 * UI never falls back / shows raw keys when the user switches languages.
 *
 * Exit code 0 = all locales consistent. Exit code 1 = drift detected.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const LOCALES_DIR = resolve(process.cwd(), "src/i18n/locales");
const BASE_LOCALE = "en";

type Json = Record<string, unknown>;

function loadLocale(file: string): Json {
  const raw = readFileSync(join(LOCALES_DIR, file), "utf-8");
  return JSON.parse(raw) as Json;
}

/** Flatten an object into a sorted list of dot-notation leaf keys. */
function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj as Json)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      out.push(...flattenKeys(v, next));
    } else {
      out.push(next);
    }
  }
  return out;
}

function diff(a: string[], b: Set<string>): string[] {
  return a.filter((k) => !b.has(k)).sort();
}

/** Extract the set of `{param}` placeholders used in a translation string. */
function extractParams(value: unknown): Set<string> {
  const out = new Set<string>();
  if (typeof value !== "string") return out;
  const re = /\{(\w+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) out.add(m[1]);
  return out;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function main(): void {
  const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
  const baseFile = `${BASE_LOCALE}.json`;

  if (!files.includes(baseFile)) {
    console.error(`✗ Base locale "${baseFile}" not found in ${LOCALES_DIR}`);
    process.exit(1);
  }

  const baseData = loadLocale(baseFile);
  const baseKeys = flattenKeys(baseData).sort();
  const baseSet = new Set(baseKeys);
  // Pre-compute the ICU param set for every base key.
  const baseParams = new Map<string, Set<string>>();
  for (const k of baseKeys) baseParams.set(k, extractParams(resolve_(baseData, k)));

  console.log(`Base locale: ${BASE_LOCALE} (${baseKeys.length} keys)`);
  console.log(`Checking ${files.length} locale files...\n`);

  let failures = 0;
  let emptyValues = 0;
  let paramMismatches = 0;

  for (const file of files.sort()) {
    const locale = file.replace(/\.json$/, "");
    const data = loadLocale(file);
    const keys = flattenKeys(data);
    const keySet = new Set(keys);

    const missing = diff(baseKeys, keySet); // in base, not in this locale
    const extra = diff(keys, baseSet); // in this locale, not in base

    // Detect empty string values (a common cause of blank UI).
    const empties = keys.filter((k) => {
      const v = resolve_(data, k);
      return typeof v === "string" && v.trim() === "";
    });

    // ICU parameter parity: each shared key must use the SAME {params} as base.
    const paramErrors: string[] = [];
    for (const k of keys) {
      if (!baseSet.has(k)) continue;
      const expected = baseParams.get(k) ?? new Set<string>();
      const actual = extractParams(resolve_(data, k));
      if (!setsEqual(expected, actual)) {
        paramErrors.push(`${k} [base: {${[...expected].join(",")}} vs {${[...actual].join(",")}}]`);
      }
    }

    if (
      missing.length === 0 &&
      extra.length === 0 &&
      empties.length === 0 &&
      paramErrors.length === 0
    ) {
      console.log(`✓ ${locale.padEnd(8)} ${keys.length} keys — OK`);
      continue;
    }

    failures += missing.length + extra.length > 0 ? 1 : 0;
    emptyValues += empties.length;
    paramMismatches += paramErrors.length;
    console.log(`✗ ${locale.padEnd(8)} ${keys.length} keys`);
    if (missing.length) console.log(`    missing (${missing.length}): ${missing.join(", ")}`);
    if (extra.length) console.log(`    extra   (${extra.length}): ${extra.join(", ")}`);
    if (empties.length) console.log(`    empty   (${empties.length}): ${empties.join(", ")}`);
    if (paramErrors.length)
      console.log(`    params  (${paramErrors.length}): ${paramErrors.join("; ")}`);
  }

  console.log("");
  if (failures === 0 && emptyValues === 0 && paramMismatches === 0) {
    console.log(`✅ All ${files.length} locales are consistent with "${BASE_LOCALE}".`);
    process.exit(0);
  }
  console.error(
    `❌ i18n check failed: ${failures} locale(s) with key drift, ${emptyValues} empty value(s), ${paramMismatches} ICU param mismatch(es).`
  );
  process.exit(1);
}

/** Resolve a dot-notation key against a nested object. */
function resolve_(obj: Json, key: string): unknown {
  let cur: unknown = obj;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Json)) {
      cur = (cur as Json)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

main();
