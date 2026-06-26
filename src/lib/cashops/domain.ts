/**
 * ATLAS CashOps — core domain model.
 *
 * CashOps is a focused product: connect accounting / payments / commerce data,
 * forecast the next 13 weeks of cash, and turn "what should I do today" into
 * auditable, approvable, sendable drafts (collections, payables negotiation,
 * etc). Every entity that is shown to the user is referenced via i18n keys —
 * the ONLY free-text fields are user-supplied names (business name, customer /
 * vendor display names imported from a connector).
 *
 * Hard rules encoded by these types:
 *  - All monetary forecasting is DETERMINISTIC (see forecast.ts). The LLM never
 *    computes amounts; it only explains numbers the engine produced.
 *  - Every outbound action is a DRAFT first; nothing sends/pays automatically.
 *  - Data is tenant-isolated by `businessId` on every record.
 */

import type { Locale } from "@/i18n/config";

// ---------------------------------------------------------------------------
// Tenant / business
// ---------------------------------------------------------------------------

export type Industry =
  | "contractor"
  | "agency"
  | "clinic"
  | "wholesale"
  | "retail"
  | "restaurant"
  | "ecommerce";

export type Mode = "demo" | "production";

export type Plan = "starter" | "pro" | "managed";

export type Role = "owner" | "admin" | "accountant" | "manager" | "viewer";

/** A tenant. One owner can (in production) own several businesses. */
export interface Business {
  id: string;
  /** Free text — owner-typed business name. */
  name: string;
  industry: Industry;
  countryCode: string;
  currency: string;
  timezone: string;
  uiLanguage: Locale;
  aiAdvisorLanguage: Locale;

  // CashOps configuration
  cashSafetyLine: number;
  /** Day of month payroll runs (1-28). */
  payrollDay: number;
  /** Day of month rent is due (1-28). */
  rentDay: number;
  /** Fraction of revenue to reserve for tax, 0..1. */
  taxReserveRate: number;
  defaultPaymentMethod: PaymentMethod;

  plan: Plan;
  trialEndsAt?: string;
  mode: Mode;

  createdAt: string;
  updatedAt: string;
  onboardedAt?: string;
}

// ---------------------------------------------------------------------------
// Data sources / connectors
// ---------------------------------------------------------------------------

export type ConnectorKind =
  | "quickbooks"
  | "xero"
  | "square"
  | "stripe"
  | "shopify"
  | "csv"
  | "manual";

export type ConnectorStatus = "connected" | "syncing" | "error" | "disconnected" | "demo";

/** What kind of records a connector can supply. */
export type DataDomain = "bank" | "ar" | "ap" | "sales" | "payroll";

export interface DataSource {
  id: string;
  businessId: string;
  kind: ConnectorKind;
  status: ConnectorStatus;
  /** Domains this source feeds. */
  domains: DataDomain[];
  lastSyncedAt?: string;
  /** Number of records pulled at last sync (for the health page). */
  recordCount?: number;
  /** i18n key for an error explanation when status === "error". */
  errorKey?: string;
}

// ---------------------------------------------------------------------------
// Money primitives
// ---------------------------------------------------------------------------

export type PaymentMethod = "ach" | "card" | "wire" | "check" | "cash" | "wallet";

export type AgingBucket = "current" | "1_30" | "31_60" | "61_90" | "90_plus";

// ---------------------------------------------------------------------------
// Receivables (AR) + collections
// ---------------------------------------------------------------------------

export type ReceivableStatus = "open" | "overdue" | "partial" | "paid" | "written_off";

export interface Receivable {
  id: string;
  businessId: string;
  customerId: string;
  /** Free text — customer display name from the connector. */
  customerName: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  status: ReceivableStatus;
  /** Source connector that produced this record. */
  sourceKind: ConnectorKind;

  // Collection tracking
  lastContactedAt?: string;
  promiseToPayDate?: string;
  /** Engine-estimated likelihood of recovery, 0..1. */
  expectedRecoveryRate: number;
  /** Historical average days the customer pays late (drives prioritization). */
  avgDaysLate: number;
}

export type DraftTone = "friendly" | "firm" | "final_notice";
export type DraftChannel = "email" | "sms" | "whatsapp";

/** A prioritized collection target with engine-computed score + reasons. */
export interface CollectionTarget {
  receivable: Receivable;
  /** 0..100 priority score from deterministic scoring. */
  score: number;
  bucket: AgingBucket;
  daysOverdue: number;
  /** i18n keys explaining why this was prioritized (with params). */
  reasonKeys: { key: string; params?: Record<string, string | number> }[];
  expectedRecoveryAmount: number;
}

// ---------------------------------------------------------------------------
// Payables (AP) + vendor negotiation
// ---------------------------------------------------------------------------

export type PayableStatus = "scheduled" | "due" | "overdue" | "paid" | "negotiating";

/** Engine classification of how a bill should be handled. */
export type PayableTreatment = "must_pay" | "can_delay" | "can_negotiate";

export interface Payable {
  id: string;
  businessId: string;
  vendorId: string;
  /** Free text — vendor display name from the connector. */
  vendorName: string;
  billNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: PayableStatus;
  sourceKind: ConnectorKind;
  isPayroll?: boolean;
  isRent?: boolean;
  isTax?: boolean;
  /** Whether the vendor has historically accepted payment-term changes. */
  flexible: boolean;
}

export interface PayablePlan {
  payable: Payable;
  treatment: PayableTreatment;
  daysUntilDue: number;
  /** Suggested number of days to delay (0 if must pay). */
  suggestedDelayDays: number;
  reasonKeys: { key: string; params?: Record<string, string | number> }[];
}

// ---------------------------------------------------------------------------
// Recurring / one-off cash movements (forecast inputs)
// ---------------------------------------------------------------------------

export type RecurringKind = "payroll" | "rent" | "tax" | "subscription" | "loan" | "other";

export interface RecurringExpense {
  id: string;
  businessId: string;
  kind: RecurringKind;
  labelKey: string;
  amount: number;
  currency: string;
  /** Day of month it recurs (1-28). */
  dayOfMonth: number;
}

export interface OneOffCashMovement {
  id: string;
  businessId: string;
  labelKey: string;
  /** Positive = inflow, negative = outflow. */
  amount: number;
  currency: string;
  date: string;
}

/** Snapshot of bank balance used as the forecast starting point. */
export interface BankPosition {
  businessId: string;
  balance: number;
  currency: string;
  asOf: string;
  sourceKind: ConnectorKind;
}

// ---------------------------------------------------------------------------
// 13-week forecast (deterministic engine output)
// ---------------------------------------------------------------------------

export type ScenarioId =
  | "base"
  | "late_collections"
  | "delayed_payables"
  | "payroll_heavy"
  | "sales_downturn";

export type RiskLevel = "safe" | "watch" | "at_risk" | "critical";
export type ConfidenceLevel = "low" | "medium" | "high";

/** One week in the 13-week projection. */
export interface ForecastWeek {
  weekIndex: number;
  weekStart: string;
  openingCash: number;
  inflow: number;
  outflow: number;
  closingCash: number;
  belowSafetyLine: boolean;
  /** Evidence line items that produced inflow/outflow for this week. */
  evidence: ForecastEvidence[];
}

export interface ForecastEvidence {
  /** i18n key describing the line item. */
  key: string;
  params?: Record<string, string | number>;
  amount: number;
  /** "inflow" | "outflow". */
  direction: "inflow" | "outflow";
}

/** A driver is a top contributor to cash movement over the horizon. */
export interface ForecastDriver {
  key: string;
  params?: Record<string, string | number>;
  amount: number;
  direction: "inflow" | "outflow";
}

export interface ForecastResult {
  scenario: ScenarioId;
  currency: string;
  startingCash: number;
  safetyLine: number;
  weeks: ForecastWeek[];
  lowestCash: number;
  lowestCashWeekStart: string;
  /** First week the balance drops below the safety line, if any. */
  breachWeekStart: string | null;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  /** Top 5 drivers of cash movement. */
  topDrivers: ForecastDriver[];
}

// ---------------------------------------------------------------------------
// Action Center (business action layer)
// ---------------------------------------------------------------------------

export type ActionType =
  | "collect_payment"
  | "delay_payment"
  | "customer_winback"
  | "schedule_adjustment"
  | "purchase_deferral"
  | "supplier_negotiation"
  | "monthly_review";

export type ActionStatus = "draft" | "approved" | "executed" | "dismissed";

/** An auditable, owner-confirmable business action. */
export interface BusinessAction {
  id: string;
  businessId: string;
  type: ActionType;
  titleKey: string;
  titleParams?: Record<string, string | number>;
  rationaleKey: string;
  rationaleParams?: Record<string, string | number>;
  /** The localized message body template (advisor language at render time). */
  draftKey: string;
  draftParams?: Record<string, string | number>;
  channel?: DraftChannel;
  tone?: DraftTone;
  /** Evidence keys grounding this action. */
  evidenceKeys: { key: string; params?: Record<string, string | number> }[];
  /** Linked records, for tenant-isolated drill-down. */
  targetReceivableId?: string;
  targetPayableId?: string;
  impactAmount?: number;
  confidence: ConfidenceLevel;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  executedAt?: string;
  dismissedAt?: string;
  auditLogId?: string;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditEntry {
  id: string;
  businessId: string;
  actorId: string;
  actorRole: Role;
  /** Stable action code, e.g. "action.approve". */
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Product analytics events
// ---------------------------------------------------------------------------

export type AnalyticsEventName =
  | "onboarding_completed"
  | "data_source_connected"
  | "forecast_viewed"
  | "action_drafted"
  | "action_approved"
  | "action_executed"
  | "upgrade_clicked";

export interface AnalyticsEvent {
  id: string;
  businessId: string;
  name: AnalyticsEventName;
  properties?: Record<string, string | number | boolean>;
  createdAt: string;
}
