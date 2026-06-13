import type { Locale } from "@/i18n/config";

export type BusinessType =
  | "restaurant"
  | "retail"
  | "beauty"
  | "education"
  | "local_service"
  | "freelance"
  | "other";

export type Role = "owner" | "manager" | "accountant" | "employee" | "viewer";

export interface Business {
  id: string;
  /** Owner-entered free text — the one place a real, user-typed string is allowed. */
  name: string;
  type: BusinessType;
  countryCode: string;
  currency: string;
  timezone: string;
  uiLanguage: Locale;
  aiAdvisorLanguage: Locale;
  employeeCountRange: string;
  /** Cash safety line. Below this, cashflow is flagged as danger. */
  safetyCashBuffer: number;
  /** When true, dates are anchored to a fixed demo "today" and a banner is shown. */
  demoMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "income" | "expense";
export type PaymentMethod = "cash" | "card" | "bank" | "wallet" | "other";
export type TransactionSource = "manual" | "receipt" | "bank_import" | "pos_import" | "mock";

export interface Transaction {
  id: string;
  businessId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  /** i18n key for a localized description (preferred for mock/system rows). */
  descriptionKey?: string;
  descriptionParams?: Record<string, string | number>;
  /** Raw, user-typed description (only set when a human typed it). */
  descriptionRaw?: string;
  paymentMethod: PaymentMethod;
  occurredAt: string;
  source: TransactionSource;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export type LedgerStatus = "open" | "overdue" | "paid";

export interface Receivable {
  id: string;
  businessId: string;
  customerId: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: LedgerStatus;
  noteKey?: string;
  noteParams?: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

export interface Payable {
  id: string;
  businessId: string;
  vendorId: string;
  /** i18n key for the vendor's display name. */
  vendorNameKey: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: LedgerStatus;
  /** Marks the payroll payable so analytics can treat it specially. */
  isPayroll?: boolean;
  noteKey?: string;
  noteParams?: Record<string, string | number>;
  createdAt: string;
  updatedAt: string;
}

export type CustomerSegment = "high_value" | "new" | "at_risk" | "price_sensitive" | "dormant";

export interface Customer {
  id: string;
  businessId: string;
  /** i18n key for the customer's display name. */
  nameKey: string;
  phone?: string;
  email?: string;
  lastPurchaseAt?: string;
  totalSpend: number;
  visitCount: number;
  riskSegment: CustomerSegment;
}

export interface Employee {
  id: string;
  businessId: string;
  /** i18n key for the employee's display name. */
  nameKey: string;
  /** Application role used by the permission model. */
  role: Role;
  phone?: string;
  hourlyRate?: number;
  /** Geofence/location consent — only the employee can grant this. */
  consentForGeofencing: boolean;
  status: "active" | "inactive";
  clockedInToday?: boolean;
}

export interface Shift {
  id: string;
  businessId: string;
  employeeId: string;
  /** Day-of-week key: mon..sun. */
  day: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "missed";
}

export type InsightType =
  | "cashflow"
  | "revenue"
  | "expense"
  | "customer"
  | "team"
  | "supplier"
  | "risk";

export type Confidence = "low" | "medium" | "high";

export interface AiInsight {
  id: string;
  businessId: string;
  type: InsightType;
  titleKey: string;
  summaryKey: string;
  params?: Record<string, string | number>;
  evidenceKeys: string[];
  evidenceParams?: Record<string, string | number>;
  impactAmount?: number;
  confidence: Confidence;
  recommendedActionType?: AiActionType;
  createdAt: string;
}

export type AiActionType =
  | "collect_payment"
  | "delay_payment"
  | "customer_winback"
  | "review_reply"
  | "schedule_adjustment"
  | "supplier_negotiation"
  | "inventory_reminder"
  | "monthly_review";

export type AiActionStatus = "draft" | "approved" | "executed" | "dismissed";

export interface AiAction {
  id: string;
  businessId: string;
  type: AiActionType;
  titleKey: string;
  reasonKey: string;
  draftKey: string;
  params?: Record<string, string | number>;
  evidenceKeys?: string[];
  evidenceParams?: Record<string, string | number>;
  status: AiActionStatus;
  impactAmount?: number;
  confidence: Confidence;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  executedAt?: string;
  dismissedAt?: string;
  auditLogId?: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  actorId: string;
  actorRole: Role;
  /** Stable action code (e.g. "action.approve", "transaction.create"). */
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AiConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  /** For user messages: raw text. For assistant: a short fallback label. */
  content: string;
  uiLocaleAtCreation: Locale;
  advisorLocaleAtCreation: Locale;
  createdAt: string;
  /** Structured assistant response, re-rendered live in the current advisor language. */
  response?: AiResponse;
}

/** Structured AI response — re-localized on every render via its keys. */
export interface AiResponse {
  intent: AiIntent;
  /** i18n key (in advisor language) for the direct answer. */
  answerKey: string;
  answerParams?: Record<string, string | number>;
  evidence: { key: string; params?: Record<string, string | number> }[];
  riskKey?: string;
  riskParams?: Record<string, string | number>;
  nextStepKey?: string;
  actions: AiActionType[];
  usedTools: string[];
  missingData: string[];
  needsDisclaimer: boolean;
}

export type AiIntent =
  | "finance_query"
  | "cashflow_forecast"
  | "employee_query"
  | "customer_query"
  | "draft_message"
  | "create_task"
  | "report_generation"
  | "peer_benchmark"
  | "compliance_question"
  | "unknown";

export interface CashflowDay {
  date: string;
  projectedCash: number;
  inflow: number;
  outflow: number;
  status: "safe" | "watch" | "danger";
}

export interface PeerBenchmark {
  /** Sample size backing the aggregate (drives k-anonymity gating). */
  sampleSize: number;
  grossMarginLow: number;
  grossMarginHigh: number;
  yourMargin: number;
  costStructure: { category: string; you: number; peers: number }[];
  groupBuying: { id: string; titleKey: string; participants: number }[];
}
