"use client";

/**
 * ATLAS CashOps — application store.
 *
 * Holds the active tenant (business), its connected data sources, the grounded
 * financial records (bank / AR / AP / recurring / one-offs), the Action Center
 * (draft → approved → executed | dismissed state machine), the audit log, the
 * AI conversation, the usage meter, and product-analytics events.
 *
 * Tenant isolation: every record carries `businessId`; mutations stamp it from
 * the active business. Demo data is loaded via mock connectors; production mode
 * would hydrate the same shapes from real connectors (see connectors.ts).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";
import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AuditEntry,
  BankPosition,
  Business,
  BusinessAction,
  ConnectorKind,
  DataSource,
  OneOffCashMovement,
  Payable,
  Receivable,
  RecurringExpense,
  Role,
} from "./cashops/domain";
import type { UsageMeter } from "./cashops/pricing";
import { createMockConnector, dataSourceFromSync } from "./cashops/connectors";
import { buildDemoDataset, demoBusiness, DEMO_BUSINESS_ID } from "./cashops/demo-data";
import { now as clockNow, realNowIso, setDemoMode } from "./clock";

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export interface AiConversationMessage {
  id: string;
  role: "user" | "assistant";
  /** For user messages: raw text. For assistant: serialized AdvisorResponse. */
  text?: string;
  responseJson?: string;
  createdAt: string;
}

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  uiLanguage: Locale;
  aiAdvisorLanguage: Locale;
  role: Role;

  business: Business | null;
  dataSources: DataSource[];
  bank: BankPosition | null;
  receivables: Receivable[];
  payables: Payable[];
  recurring: RecurringExpense[];
  oneOffs: OneOffCashMovement[];

  actions: BusinessAction[];
  auditLog: AuditEntry[];
  conversation: AiConversationMessage[];
  analytics: AnalyticsEvent[];
  usage: UsageMeter;

  // lifecycle
  setHydrated: () => void;
  setUiLanguage: (l: Locale) => void;
  setAiAdvisorLanguage: (l: Locale) => void;
  setRole: (r: Role) => void;
  completeOnboarding: (b: Business, connectors: ConnectorKind[]) => void;
  updateBusiness: (patch: Partial<Business>) => void;

  // data sources
  connectSource: (kind: ConnectorKind) => void;
  disconnectSource: (kind: ConnectorKind) => void;

  // records
  setReceivableStatus: (id: string, status: Receivable["status"]) => void;
  markContacted: (id: string, promiseToPayDate?: string) => void;
  setPayableStatus: (id: string, status: Payable["status"]) => void;

  // action state machine (returns id, or null if metered out)
  createDraftAction: (
    input: Omit<BusinessAction, "id" | "businessId" | "status" | "createdAt" | "updatedAt">
  ) => string | null;
  approveAction: (id: string) => void;
  executeAction: (id: string) => void;
  dismissAction: (id: string) => void;

  // ai conversation
  addConversationMessage: (m: AiConversationMessage) => void;
  clearConversation: () => void;

  // audit + analytics
  logAudit: (
    entry: Omit<AuditEntry, "id" | "businessId" | "createdAt" | "actorId" | "actorRole">
  ) => string;
  track: (name: AnalyticsEventName, properties?: AnalyticsEvent["properties"]) => void;

  // plan
  upgradePlan: (plan: Business["plan"]) => void;

  resetDemo: () => void;
}

function loadDemo(): {
  business: Business;
  dataSources: DataSource[];
  bank: BankPosition;
  receivables: Receivable[];
  payables: Payable[];
  recurring: RecurringExpense[];
} {
  const anchor = clockNow();
  const business = demoBusiness(anchor);
  const dataset = buildDemoDataset(anchor);
  // Simulate a synced QuickBooks connector feeding the demo tenant.
  const connector = createMockConnector("quickbooks", dataset);
  // Demo-mode synchronous fabrication (mirrors the async connector result).
  const syncResult = {
    bank: dataset.bank,
    receivables: dataset.receivables,
    payables: dataset.payables,
    recurring: dataset.recurring,
    counts: { bank: 1, ar: dataset.receivables.length, ap: dataset.payables.length },
    syncedAt: anchor.toISOString(),
  };
  void connector;
  const ds = dataSourceFromSync(business.id, "quickbooks", "demo", syncResult);
  return {
    business,
    dataSources: [ds],
    bank: dataset.bank,
    receivables: dataset.receivables,
    payables: dataset.payables,
    recurring: dataset.recurring,
  };
}

function freshUsage(): UsageMeter {
  return { actionsUsed: 0, periodStart: realNowIso() };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const demo = loadDemo();
      return {
        hydrated: false,
        onboarded: false,
        uiLanguage: DEFAULT_LOCALE,
        aiAdvisorLanguage: DEFAULT_LOCALE,
        role: "owner",

        business: demo.business,
        dataSources: demo.dataSources,
        bank: demo.bank,
        receivables: demo.receivables,
        payables: demo.payables,
        recurring: demo.recurring,
        oneOffs: [],

        actions: [],
        auditLog: [],
        conversation: [],
        analytics: [],
        usage: freshUsage(),

        setHydrated: () => {
          const b = get().business;
          setDemoMode(b?.mode !== "production");
          set({ hydrated: true });
        },
        setUiLanguage: (l) => set({ uiLanguage: l }),
        setAiAdvisorLanguage: (l) => set({ aiAdvisorLanguage: l }),
        setRole: (r) => {
          set({ role: r });
          get().logAudit({ action: "role.simulate", targetType: "role", targetId: r });
        },

        completeOnboarding: (b, connectors) => {
          setDemoMode(b.mode !== "production");
          const anchor = clockNow();
          // In demo mode we hydrate seeded records; in production the chosen
          // connectors would sync real data (here they start empty until sync).
          const isDemo = b.mode !== "production";
          const dataset = isDemo ? buildDemoDataset(anchor) : null;
          const sources: DataSource[] = connectors.map((kind) => {
            const syncResult = {
              bank: dataset?.bank,
              receivables: dataset?.receivables ?? [],
              payables: dataset?.payables ?? [],
              recurring: dataset?.recurring ?? [],
              counts: dataset
                ? { bank: 1, ar: dataset.receivables.length, ap: dataset.payables.length }
                : {},
              syncedAt: anchor.toISOString(),
            };
            return dataSourceFromSync(b.id, kind, isDemo ? "demo" : "connected", syncResult);
          });
          set({
            business: b,
            onboarded: true,
            uiLanguage: b.uiLanguage,
            aiAdvisorLanguage: b.aiAdvisorLanguage,
            dataSources: sources,
            bank: dataset?.bank ?? null,
            receivables: dataset?.receivables ?? [],
            payables: dataset?.payables ?? [],
            recurring: dataset?.recurring ?? [],
            oneOffs: [],
            actions: [],
            usage: freshUsage(),
          });
          get().logAudit({ action: "business.onboard", targetType: "business", targetId: b.id });
          get().track("onboarding_completed", { industry: b.industry, mode: b.mode });
          for (const kind of connectors) {
            get().track("data_source_connected", { kind });
          }
        },

        updateBusiness: (patch) =>
          set((s) => {
            if (!s.business) return s;
            const next = { ...s.business, ...patch, updatedAt: realNowIso() };
            if (patch.mode !== undefined) setDemoMode(patch.mode !== "production");
            return { business: next };
          }),

        connectSource: (kind) => {
          const b = get().business;
          if (!b) return;
          const anchor = clockNow();
          const isDemo = b.mode !== "production";
          const dataset = isDemo ? buildDemoDataset(anchor) : null;
          const syncResult = {
            bank: dataset?.bank,
            receivables: dataset?.receivables ?? [],
            payables: dataset?.payables ?? [],
            recurring: dataset?.recurring ?? [],
            counts: dataset
              ? { bank: 1, ar: dataset.receivables.length, ap: dataset.payables.length }
              : {},
            syncedAt: anchor.toISOString(),
          };
          const ds = dataSourceFromSync(b.id, kind, isDemo ? "demo" : "connected", syncResult);
          set((s) => ({
            dataSources: [...s.dataSources.filter((d) => d.kind !== kind), ds],
          }));
          get().logAudit({
            action: "datasource.connect",
            targetType: "datasource",
            targetId: kind,
          });
          get().track("data_source_connected", { kind });
        },

        disconnectSource: (kind) => {
          set((s) => ({ dataSources: s.dataSources.filter((d) => d.kind !== kind) }));
          get().logAudit({
            action: "datasource.disconnect",
            targetType: "datasource",
            targetId: kind,
          });
        },

        setReceivableStatus: (id, status) => {
          set((s) => ({
            receivables: s.receivables.map((r) => (r.id === id ? { ...r, status } : r)),
          }));
          get().logAudit({ action: "receivable.status", targetType: "receivable", targetId: id });
        },

        markContacted: (id, promiseToPayDate) => {
          set((s) => ({
            receivables: s.receivables.map((r) =>
              r.id === id ? { ...r, lastContactedAt: realNowIso(), promiseToPayDate } : r
            ),
          }));
          get().logAudit({
            action: "receivable.contacted",
            targetType: "receivable",
            targetId: id,
          });
        },

        setPayableStatus: (id, status) => {
          set((s) => ({
            payables: s.payables.map((p) => (p.id === id ? { ...p, status } : p)),
          }));
          get().logAudit({ action: "payable.status", targetType: "payable", targetId: id });
        },

        createDraftAction: (input) => {
          // Usage meter gate (Starter plan caps monthly AI actions).
          const { business, usage } = get();
          const plan = business?.plan ?? "starter";
          // Lazy import avoided to keep store sync; replicate meter logic.
          const LIMITS: Record<string, number | null> = { starter: 10, pro: null, managed: null };
          const limit = LIMITS[plan];
          if (limit !== null && usage.actionsUsed >= limit) {
            return null;
          }
          const stamp = realNowIso();
          const id = uid("act");
          const action: BusinessAction = {
            ...input,
            id,
            businessId: business?.id ?? DEMO_BUSINESS_ID,
            status: "draft",
            createdAt: stamp,
            updatedAt: stamp,
          };
          set((s) => ({
            actions: [action, ...s.actions],
            usage: { ...s.usage, actionsUsed: s.usage.actionsUsed + 1 },
          }));
          get().logAudit({ action: "action.draft", targetType: "action", targetId: id });
          get().track("action_drafted", { type: action.type });
          return id;
        },

        approveAction: (id) => {
          const auditId = get().logAudit({
            action: "action.approve",
            targetType: "action",
            targetId: id,
          });
          set((s) => ({
            actions: s.actions.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: "approved",
                    approvedAt: realNowIso(),
                    updatedAt: realNowIso(),
                    auditLogId: auditId,
                  }
                : a
            ),
          }));
          get().track("action_approved", { id });
        },

        executeAction: (id) => {
          const auditId = get().logAudit({
            action: "action.execute",
            targetType: "action",
            targetId: id,
            metadata: { mock: true },
          });
          set((s) => ({
            actions: s.actions.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: "executed",
                    executedAt: realNowIso(),
                    updatedAt: realNowIso(),
                    auditLogId: auditId,
                  }
                : a
            ),
          }));
          get().track("action_executed", { id });
        },

        dismissAction: (id) => {
          get().logAudit({ action: "action.dismiss", targetType: "action", targetId: id });
          set((s) => ({
            actions: s.actions.map((a) =>
              a.id === id
                ? { ...a, status: "dismissed", dismissedAt: realNowIso(), updatedAt: realNowIso() }
                : a
            ),
          }));
        },

        addConversationMessage: (m) => set((s) => ({ conversation: [...s.conversation, m] })),
        clearConversation: () => set({ conversation: [] }),

        logAudit: (entry) => {
          const id = uid("log");
          const { role, business } = get();
          const log: AuditEntry = {
            ...entry,
            id,
            businessId: business?.id ?? DEMO_BUSINESS_ID,
            actorId: "user_demo",
            actorRole: role,
            createdAt: realNowIso(),
          };
          set((s) => ({ auditLog: [log, ...s.auditLog].slice(0, 300) }));
          return id;
        },

        track: (name, properties) => {
          const { business } = get();
          const evt: AnalyticsEvent = {
            id: uid("evt"),
            businessId: business?.id ?? DEMO_BUSINESS_ID,
            name,
            properties,
            createdAt: realNowIso(),
          };
          set((s) => ({ analytics: [evt, ...s.analytics].slice(0, 300) }));
        },

        upgradePlan: (plan) => {
          set((s) => (s.business ? { business: { ...s.business, plan } } : s));
          get().logAudit({ action: "plan.upgrade", targetType: "plan", targetId: plan });
          get().track("upgrade_clicked", { plan });
        },

        resetDemo: () => {
          setDemoMode(true);
          const demo2 = loadDemo();
          set({
            onboarded: false,
            role: "owner",
            business: demo2.business,
            dataSources: demo2.dataSources,
            bank: demo2.bank,
            receivables: demo2.receivables,
            payables: demo2.payables,
            recurring: demo2.recurring,
            oneOffs: [],
            actions: [],
            auditLog: [],
            conversation: [],
            analytics: [],
            usage: freshUsage(),
          });
        },
      };
    },
    {
      name: "atlas-cashops-store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        uiLanguage: s.uiLanguage,
        aiAdvisorLanguage: s.aiAdvisorLanguage,
        role: s.role,
        business: s.business,
        dataSources: s.dataSources,
        bank: s.bank,
        receivables: s.receivables,
        payables: s.payables,
        recurring: s.recurring,
        oneOffs: s.oneOffs,
        actions: s.actions,
        auditLog: s.auditLog,
        conversation: s.conversation,
        analytics: s.analytics,
        usage: s.usage,
      }),
      migrate: (persisted, version) => {
        // Pre-CashOps schemas are incompatible — reseed.
        if (version < 3) {
          return undefined as unknown as AppState;
        }
        return persisted as AppState;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
