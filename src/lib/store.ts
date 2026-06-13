"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";
import type {
  Business,
  Transaction,
  Receivable,
  Payable,
  Customer,
  Employee,
  Shift,
  AiAction,
  AiActionType,
  AiInsight,
  AuditLog,
  AiConversationMessage,
  Role,
} from "./types";
import { defaultBusiness, seed, BUSINESS_ID } from "./mock-data";
import { realNowIso, setDemoMode } from "./clock";

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

interface AppState {
  hydrated: boolean;
  onboarded: boolean;
  uiLanguage: Locale;
  aiAdvisorLanguage: Locale;
  role: Role;
  business: Business | null;

  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  customers: Customer[];
  employees: Employee[];
  shifts: Shift[];
  actions: AiAction[];
  insights: AiInsight[];
  auditLog: AuditLog[];
  conversation: AiConversationMessage[];

  // lifecycle
  setHydrated: () => void;
  setUiLanguage: (l: Locale) => void;
  setAiAdvisorLanguage: (l: Locale) => void;
  setRole: (r: Role) => void;
  completeOnboarding: (b: Business) => void;
  updateBusiness: (patch: Partial<Business>) => void;

  // ledger
  addTransaction: (t: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  setReceivableStatus: (id: string, status: Receivable["status"]) => void;
  setPayableStatus: (id: string, status: Payable["status"]) => void;

  // actions state machine
  createDraftAction: (
    input: Omit<AiAction, "id" | "businessId" | "status" | "createdAt" | "updatedAt">
  ) => string;
  approveAction: (id: string) => void;
  executeAction: (id: string) => void;
  dismissAction: (id: string) => void;

  // team
  toggleGeofenceConsent: (employeeId: string) => void;

  // ai conversation
  addConversationMessage: (m: AiConversationMessage) => void;
  clearConversation: () => void;

  // audit
  logAudit: (
    entry: Omit<AuditLog, "id" | "businessId" | "createdAt" | "actorId" | "actorRole">
  ) => string;

  resetDemo: () => void;
}

function freshSeed() {
  // Deep clone seed arrays so resets / mutations never share references.
  return JSON.parse(JSON.stringify(seed)) as typeof seed;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboarded: false,
      uiLanguage: DEFAULT_LOCALE,
      aiAdvisorLanguage: DEFAULT_LOCALE,
      role: "owner",
      business: defaultBusiness,
      ...freshSeed(),
      auditLog: [],
      conversation: [],

      setHydrated: () => {
        const b = get().business;
        setDemoMode(b?.demoMode ?? true);
        set({ hydrated: true });
      },
      setUiLanguage: (l) => set({ uiLanguage: l }),
      setAiAdvisorLanguage: (l) => set({ aiAdvisorLanguage: l }),
      setRole: (r) => {
        set({ role: r });
        get().logAudit({ action: "role.simulate", targetType: "role", targetId: r });
      },

      completeOnboarding: (b) => {
        setDemoMode(b.demoMode);
        set({
          business: b,
          onboarded: true,
          uiLanguage: b.uiLanguage,
          aiAdvisorLanguage: b.aiAdvisorLanguage,
        });
        get().logAudit({ action: "business.onboard", targetType: "business", targetId: b.id });
      },

      updateBusiness: (patch) =>
        set((s) => {
          if (!s.business) return s;
          const next = { ...s.business, ...patch, updatedAt: realNowIso() };
          if (patch.demoMode !== undefined) setDemoMode(patch.demoMode);
          return { business: next };
        }),

      addTransaction: (input) => {
        const stamp = realNowIso();
        const tx: Transaction = { ...input, id: uid("t"), createdAt: stamp, updatedAt: stamp };
        set((s) => ({ transactions: [tx, ...s.transactions] }));
        get().logAudit({
          action: "transaction.create",
          targetType: "transaction",
          targetId: tx.id,
        });
      },

      setReceivableStatus: (id, status) => {
        set((s) => ({
          receivables: s.receivables.map((r) =>
            r.id === id ? { ...r, status, updatedAt: realNowIso() } : r
          ),
        }));
        get().logAudit({ action: "receivable.status", targetType: "receivable", targetId: id });
      },

      setPayableStatus: (id, status) => {
        set((s) => ({
          payables: s.payables.map((p) =>
            p.id === id ? { ...p, status, updatedAt: realNowIso() } : p
          ),
        }));
        get().logAudit({ action: "payable.status", targetType: "payable", targetId: id });
      },

      createDraftAction: (input) => {
        const stamp = realNowIso();
        const id = uid("a");
        const action: AiAction = {
          ...input,
          id,
          businessId: BUSINESS_ID,
          status: "draft",
          createdAt: stamp,
          updatedAt: stamp,
        };
        set((s) => ({ actions: [action, ...s.actions] }));
        get().logAudit({ action: "action.draft", targetType: "action", targetId: id });
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

      toggleGeofenceConsent: (employeeId) => {
        set((s) => ({
          employees: s.employees.map((e) =>
            e.id === employeeId ? { ...e, consentForGeofencing: !e.consentForGeofencing } : e
          ),
        }));
        get().logAudit({
          action: "employee.geofenceConsent",
          targetType: "employee",
          targetId: employeeId,
        });
      },

      addConversationMessage: (m) => set((s) => ({ conversation: [...s.conversation, m] })),
      clearConversation: () => set({ conversation: [] }),

      logAudit: (entry) => {
        const id = uid("log");
        const role = get().role;
        const log: AuditLog = {
          ...entry,
          id,
          businessId: BUSINESS_ID,
          actorId: "user_demo",
          actorRole: role,
          createdAt: realNowIso(),
        };
        set((s) => ({ auditLog: [log, ...s.auditLog].slice(0, 200) }));
        return id;
      },

      resetDemo: () => {
        setDemoMode(true);
        set({
          onboarded: false,
          role: "owner",
          business: defaultBusiness,
          ...freshSeed(),
          auditLog: [],
          conversation: [],
        });
      },
    }),
    {
      name: "atlas-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        onboarded: s.onboarded,
        uiLanguage: s.uiLanguage,
        aiAdvisorLanguage: s.aiAdvisorLanguage,
        role: s.role,
        business: s.business,
        transactions: s.transactions,
        receivables: s.receivables,
        payables: s.payables,
        customers: s.customers,
        employees: s.employees,
        shifts: s.shifts,
        actions: s.actions,
        insights: s.insights,
        auditLog: s.auditLog,
        conversation: s.conversation,
      }),
      migrate: (persisted, version) => {
        // v1 -> v2 changed the data model substantially; reseed to avoid mixing
        // old hardcoded-string rows with the new key-based schema.
        if (version < 2) {
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

export type { AiActionType };
