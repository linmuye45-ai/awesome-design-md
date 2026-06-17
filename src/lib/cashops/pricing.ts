/**
 * Pricing, plan entitlements, usage metering and paywall gating.
 *
 * Three plans:
 *  - Starter $79/mo : 1 business, CSV/manual only, 10 AI actions / month.
 *  - Pro     $199/mo: all integrations, unlimited actions, 13-week forecast,
 *                     team roles.
 *  - Managed $499+  : accountant workflow, monthly review, advanced controls.
 *
 * `planHasFeature(...)` and `meterAllows(...)` are the single source of truth
 * for what the UI locks. Locked features render a paywall instead of the
 * feature, and an `upgrade_clicked` analytics event fires from the page.
 */

import type { ConnectorKind, Plan } from "./domain";

export type Feature =
  | "integrations" // QuickBooks/Xero/Square/Stripe/Shopify connectors
  | "unlimited_actions"
  | "thirteen_week_forecast"
  | "scenarios"
  | "team_roles"
  | "accountant_workflow"
  | "monthly_review"
  | "advanced_controls"
  | "multi_business";

export interface PlanDef {
  id: Plan;
  /** Monthly price in USD (lower bound for ranges). */
  priceMonthly: number;
  /** Upper bound for plans priced as a range (Managed). */
  priceMonthlyMax?: number;
  nameKey: string;
  taglineKey: string;
  /** i18n keys for the feature bullet list. */
  featureKeys: string[];
  /** Monthly AI-action allowance; null = unlimited. */
  monthlyActionLimit: number | null;
  /** Connector kinds this plan may use. */
  allowedConnectors: ConnectorKind[];
  features: Feature[];
}

const ALL_CONNECTORS: ConnectorKind[] = [
  "quickbooks",
  "xero",
  "square",
  "stripe",
  "shopify",
  "csv",
  "manual",
];

export const PLANS: Record<Plan, PlanDef> = {
  starter: {
    id: "starter",
    priceMonthly: 79,
    nameKey: "pricing.starter.name",
    taglineKey: "pricing.starter.tagline",
    featureKeys: [
      "pricing.starter.f1",
      "pricing.starter.f2",
      "pricing.starter.f3",
      "pricing.starter.f4",
    ],
    monthlyActionLimit: 10,
    allowedConnectors: ["csv", "manual"],
    features: [],
  },
  pro: {
    id: "pro",
    priceMonthly: 199,
    nameKey: "pricing.pro.name",
    taglineKey: "pricing.pro.tagline",
    featureKeys: ["pricing.pro.f1", "pricing.pro.f2", "pricing.pro.f3", "pricing.pro.f4"],
    monthlyActionLimit: null,
    allowedConnectors: ALL_CONNECTORS,
    features: [
      "integrations",
      "unlimited_actions",
      "thirteen_week_forecast",
      "scenarios",
      "team_roles",
    ],
  },
  managed: {
    id: "managed",
    priceMonthly: 499,
    priceMonthlyMax: 999,
    nameKey: "pricing.managed.name",
    taglineKey: "pricing.managed.tagline",
    featureKeys: [
      "pricing.managed.f1",
      "pricing.managed.f2",
      "pricing.managed.f3",
      "pricing.managed.f4",
    ],
    monthlyActionLimit: null,
    allowedConnectors: ALL_CONNECTORS,
    features: [
      "integrations",
      "unlimited_actions",
      "thirteen_week_forecast",
      "scenarios",
      "team_roles",
      "accountant_workflow",
      "monthly_review",
      "advanced_controls",
      "multi_business",
    ],
  },
};

export const PLAN_ORDER: Plan[] = ["starter", "pro", "managed"];

export function planDef(plan: Plan): PlanDef {
  return PLANS[plan];
}

/** Whether a plan entitles a feature. */
export function planHasFeature(plan: Plan, feature: Feature): boolean {
  return PLANS[plan].features.includes(feature);
}

/** Whether a plan may use a given connector kind. */
export function planAllowsConnector(plan: Plan, kind: ConnectorKind): boolean {
  return PLANS[plan].allowedConnectors.includes(kind);
}

export interface UsageMeter {
  /** AI actions drafted this billing period. */
  actionsUsed: number;
  periodStart: string;
}

/** Whether another AI action may be drafted under the plan's monthly limit. */
export function meterAllows(plan: Plan, meter: UsageMeter): boolean {
  const limit = PLANS[plan].monthlyActionLimit;
  if (limit === null) return true;
  return meter.actionsUsed < limit;
}

export function meterRemaining(plan: Plan, meter: UsageMeter): number | null {
  const limit = PLANS[plan].monthlyActionLimit;
  if (limit === null) return null;
  return Math.max(0, limit - meter.actionsUsed);
}

/** The smallest plan that unlocks a feature (for upgrade prompts). */
export function requiredPlanFor(feature: Feature): Plan {
  for (const p of PLAN_ORDER) {
    if (planHasFeature(p, feature)) return p;
  }
  return "managed";
}
