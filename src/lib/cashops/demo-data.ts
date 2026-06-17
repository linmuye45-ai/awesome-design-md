/**
 * CashOps DEMO seed data.
 *
 * This is the ONLY place hard-coded sample records live. It is consumed by the
 * mock connectors (connectors.ts) to simulate a synced production system. In
 * production mode this module is not used — real connectors return real records
 * through the identical `ConnectorSyncResult` shape.
 *
 * All dates are derived from the injected demo "now" so the dataset stays
 * internally consistent regardless of when the demo is opened. Customer/vendor
 * display names are intentionally free text (as they would arrive from a real
 * connector); every other label is an i18n key.
 */

import type {
  BankPosition,
  Business,
  Industry,
  Payable,
  Receivable,
  RecurringExpense,
} from "./domain";
import type { MockDataset } from "./connectors";

export const DEMO_BUSINESS_ID = "biz_demo";

function isoDaysFrom(now: Date, days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** The demo business — a small contractor, the archetypal CashOps customer. */
export function demoBusiness(now: Date): Business {
  return {
    id: DEMO_BUSINESS_ID,
    name: "Northgate Contracting",
    industry: "contractor",
    countryCode: "US",
    currency: "USD",
    timezone: "America/Chicago",
    uiLanguage: "en",
    aiAdvisorLanguage: "en",
    cashSafetyLine: 25000,
    payrollDay: 15,
    rentDay: 1,
    taxReserveRate: 0.12,
    defaultPaymentMethod: "ach",
    plan: "pro",
    mode: "demo",
    createdAt: isoDaysFrom(now, -240),
    updatedAt: now.toISOString(),
    onboardedAt: isoDaysFrom(now, -240),
  };
}

/** Per-industry baseline weekly operating revenue / cost (USD). */
export const INDUSTRY_BASELINES: Record<Industry, { revenue: number; cost: number }> = {
  contractor: { revenue: 42000, cost: 26000 },
  agency: { revenue: 38000, cost: 22000 },
  clinic: { revenue: 30000, cost: 18000 },
  wholesale: { revenue: 60000, cost: 46000 },
  retail: { revenue: 28000, cost: 19000 },
  restaurant: { revenue: 24000, cost: 16000 },
  ecommerce: { revenue: 35000, cost: 24000 },
};

function demoBank(now: Date): BankPosition {
  return {
    businessId: DEMO_BUSINESS_ID,
    balance: 72400,
    currency: "USD",
    asOf: now.toISOString(),
    sourceKind: "quickbooks",
  };
}

/**
 * Receivables spread across aging buckets, including a few slow payers and a
 * large overdue invoice — the kind of dataset the collections engine should
 * prioritize meaningfully.
 */
function demoReceivables(now: Date): Receivable[] {
  const mk = (
    id: string,
    customerId: string,
    customerName: string,
    invoiceNumber: string,
    amount: number,
    dueOffset: number,
    avgDaysLate: number,
    expectedRecoveryRate: number,
    amountPaid = 0
  ): Receivable => {
    const dueDate = isoDaysFrom(now, dueOffset);
    const status: Receivable["status"] =
      amountPaid >= amount
        ? "paid"
        : amountPaid > 0
          ? "partial"
          : dueOffset < 0
            ? "overdue"
            : "open";
    return {
      id,
      businessId: DEMO_BUSINESS_ID,
      customerId,
      customerName,
      invoiceNumber,
      amount,
      amountPaid,
      currency: "USD",
      issuedAt: isoDaysFrom(now, dueOffset - 30),
      dueDate,
      status,
      sourceKind: "quickbooks",
      avgDaysLate,
      expectedRecoveryRate,
    };
  };

  return [
    mk("ar_1", "cust_meridian", "Meridian Property Group", "INV-2041", 38500, -52, 22, 0.85),
    mk("ar_2", "cust_brightway", "Brightway Developments", "INV-2055", 12750, -34, 14, 0.9),
    mk("ar_3", "cust_cedar", "Cedar & Co. Builders", "INV-2061", 6200, -18, 9, 0.92),
    mk("ar_4", "cust_harbor", "Harbor Point LLC", "INV-2068", 21900, -7, 30, 0.7),
    mk("ar_5", "cust_summit", "Summit Interiors", "INV-2072", 4800, 9, 4, 0.95),
    mk("ar_6", "cust_meridian", "Meridian Property Group", "INV-2075", 16400, 21, 22, 0.85),
    mk("ar_7", "cust_oakline", "Oakline Renovations", "INV-2079", 9300, 35, 6, 0.93),
    mk("ar_8", "cust_brightway", "Brightway Developments", "INV-2081", 5400, -95, 14, 0.55),
  ];
}

/**
 * Payables spanning must-pay (payroll/rent/tax), flexible vendors, and an
 * overdue bill — so the payables engine can classify must_pay / can_delay /
 * can_negotiate.
 */
function demoPayables(now: Date): Payable[] {
  const mk = (
    id: string,
    vendorId: string,
    vendorName: string,
    billNumber: string,
    amount: number,
    dueOffset: number,
    flexible: boolean,
    flags?: { isPayroll?: boolean; isRent?: boolean; isTax?: boolean }
  ): Payable => {
    const status: Payable["status"] =
      dueOffset < 0 ? "overdue" : dueOffset <= 7 ? "due" : "scheduled";
    return {
      id,
      businessId: DEMO_BUSINESS_ID,
      vendorId,
      vendorName,
      billNumber,
      amount,
      currency: "USD",
      dueDate: isoDaysFrom(now, dueOffset),
      status,
      sourceKind: "quickbooks",
      flexible,
      ...flags,
    };
  };

  return [
    mk("ap_1", "vend_steelline", "Steelline Supply", "BILL-7781", 18600, 4, true),
    mk("ap_2", "vend_payroll", "Payroll", "PR-0615", 31000, 8, false, { isPayroll: true }),
    mk("ap_3", "vend_landlord", "Gateway Realty", "RENT-06", 9500, 12, false, { isRent: true }),
    mk("ap_4", "vend_lumber", "Northwood Lumber", "BILL-7790", 7400, -3, true),
    mk("ap_5", "vend_fuel", "FleetFuel Card", "BILL-7795", 2800, 18, true),
    mk("ap_6", "vend_tax", "Quarterly Tax Reserve", "TAX-Q2", 14200, 26, false, { isTax: true }),
    mk("ap_7", "vend_tools", "ProTool Rentals", "BILL-7802", 3300, 33, true),
  ];
}

function demoRecurring(now: Date): RecurringExpense[] {
  void now;
  return [
    {
      id: "rec_payroll",
      businessId: DEMO_BUSINESS_ID,
      kind: "payroll",
      labelKey: "forecast.ev.payroll",
      amount: 31000,
      currency: "USD",
      dayOfMonth: 15,
    },
    {
      id: "rec_rent",
      businessId: DEMO_BUSINESS_ID,
      kind: "rent",
      labelKey: "forecast.ev.rent",
      amount: 9500,
      currency: "USD",
      dayOfMonth: 1,
    },
    {
      id: "rec_software",
      businessId: DEMO_BUSINESS_ID,
      kind: "subscription",
      labelKey: "forecast.ev.subscription",
      amount: 1200,
      currency: "USD",
      dayOfMonth: 5,
    },
    {
      id: "rec_loan",
      businessId: DEMO_BUSINESS_ID,
      kind: "loan",
      labelKey: "forecast.ev.loan",
      amount: 4300,
      currency: "USD",
      dayOfMonth: 20,
    },
  ];
}

/** Assemble the full demo dataset for the mock connectors. */
export function buildDemoDataset(now: Date): MockDataset {
  return {
    bank: demoBank(now),
    receivables: demoReceivables(now),
    payables: demoPayables(now),
    recurring: demoRecurring(now),
  };
}
