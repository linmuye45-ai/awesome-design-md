# ATLAS — the AI business operating system for small businesses

ATLAS puts **real-time cashflow** and an **AI business advisor** at the center of the
experience. The home screen answers the five questions every owner asks every day and
tells them the single most important next action — with a **draft already prepared** for
their approval.

> ATLAS doesn't just record your business. It understands your cash risk, knows what you
> should do today, and has already drafted the action for you to approve.

This is a **production-grade prototype**: real Next.js routing, real client state, mock
data and a mock-but-tool-calling-ready AI layer that can be swapped for a real LLM and
backend without rewriting the UI.

## What makes ATLAS different

| Category        | They do                  | ATLAS does                                          |
| --------------- | ------------------------ | --------------------------------------------------- |
| POS             | record transactions      | judges _what to do today_                           |
| QuickBooks      | keep the books           | gives the owner the next business action            |
| Shopify / Toast | trade & operations tools | cross-industry business-fact layer + AI action loop |
| AI chatbot      | answer without your data | answers from your ledger, cash, customers & staff   |
| Legacy SaaS     | make you learn software  | you ask, confirm, and results flow back             |

## Architecture layers

1. **Business-fact layer** — cash, income, expenses, receivables, payables, employees,
   shifts, customers, suppliers, peer benchmarks.
2. **AI judgement layer** — detect risk, explain causes, prioritise, forecast cashflow,
   generate recommendations.
3. **Draft-action layer** — collection, payment delay, win-back, schedule, review reply,
   supplier negotiation, inventory, monthly review.
4. **Execution loop** — owner approves / executes / dismisses, results recorded, audit log.
5. **Future network layer** — payments, invoicing, tax, financing, procurement,
   anonymised benchmarking, supplier network.

## Tech stack

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Zustand + persist ·
Recharts · lucide-react · localStorage · custom i18n (12 locales, RTL) · ESLint ·
Prettier · tsx.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

## Quality gates

```bash
npm run format:check   # Prettier
npm run check:i18n     # 12 locales, identical keys, no empties, ICU param parity
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit (strict)
npm run build          # next build
```

## Pages (all real routes)

`/onboarding` · `/dashboard` · `/ask` · `/ledger` · `/capture` · `/cashflow` ·
`/actions` · `/team` · `/schedule` · `/customers` · `/reports` · `/network` · `/settings`

## Internationalisation

- 12 locales: `zh-CN`, `zh-TW`, `en`, `ja`, `ko`, `es-MX`, `pt-BR`, `en-IN`, `id`, `th`,
  `vi`, `ar`.
- **UI language** and **AI advisor language** are fully independent and persisted.
- Switching language never refreshes, never navigates, never loses form input, AI chat
  history, filters or modal state.
- Arabic flips to **RTL** instantly; numbers and money stay LTR-readable.
- All money / dates / numbers use `Intl` driven by the active locale and currency.
- No hardcoded UI strings — everything renders through `t()` / `tAdvisor()`.

## What's mock

Data, analytics and AI responses are mock. No real payments, banking, tax, financing,
reviews, messaging or employee location. Every integration point is behind a typed
repository / tool interface ready for a real backend or LLM. See the end of this file's
git history and the PR description for backend / AI integration guidance.

## License

MIT — see [LICENSE](./LICENSE).
