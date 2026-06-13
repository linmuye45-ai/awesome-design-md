# Contributing to ATLAS

## Principles

- **Draft-first.** The AI never sends, deletes or modifies anything on its own. Every
  outbound action is a draft the owner approves.
- **No hardcoded UI strings.** All user-visible text renders through `t()` /
  `tAdvisor()`. Mock business text that is shown to users is also keyed.
- **Locale-driven formatting.** Money, dates and numbers go through the `Intl` helpers in
  `src/i18n/format.ts`. Never hand-write currency symbols or fixed date strings.
- **UI language ≠ AI advisor language.** They are independent settings.
- **Permissions are enforced**, not decorative. Use `can()` / `RequirePermission`.

## Workflow

```bash
npm install
npm run dev
# before committing:
npm run format
npm run check:i18n && npm run lint && npm run typecheck && npm run build
```

## Adding a locale key

1. Add the key to **every** file in `src/i18n/locales/` with the identical path.
2. Keep ICU params (`{amount}`, `{name}`, …) identical across locales.
3. Run `npm run check:i18n` — it fails on missing keys, extra keys, empty values and ICU
   parameter mismatches.

## Code style

- TypeScript strict mode; no `any` unless justified.
- Pages call selectors / repositories — they do not contain heavy business logic.
- Mock data lives only in `src/lib/mock-data.ts` (structured fields, never prose).
