/**
 * Typed connector / adapter layer.
 *
 * Every production integration (QuickBooks, Xero, Square, Stripe, Shopify, CSV,
 * manual) is represented by the SAME `Connector` interface. Today each one is a
 * MOCK that reads from the deterministic demo seed; swapping in a real API later
 * means implementing this interface against the vendor SDK — no call site in the
 * app changes. This is the boundary that keeps demo data fully separated from
 * the production connector abstraction.
 *
 * Hard rule: connectors are READ-ONLY into CashOps. They never send messages or
 * move money. Outbound actions always flow through the Action Center as drafts.
 */

import type {
  BankPosition,
  ConnectorKind,
  ConnectorStatus,
  DataDomain,
  DataSource,
  Payable,
  Receivable,
  RecurringExpense,
} from "./domain";

/** A normalized pull from an external system into CashOps domain records. */
export interface ConnectorSyncResult {
  bank?: BankPosition;
  receivables: Receivable[];
  payables: Payable[];
  recurring: RecurringExpense[];
  /** Per-domain record counts, surfaced on the data-source health page. */
  counts: Partial<Record<DataDomain, number>>;
  syncedAt: string;
}

/** Static capability description for a connector kind. */
export interface ConnectorCapability {
  kind: ConnectorKind;
  /** i18n key for the connector display name. */
  nameKey: string;
  /** i18n key for a one-line description. */
  descriptionKey: string;
  /** Data domains this connector can populate. */
  domains: DataDomain[];
  /** Whether this connector is gated behind a paid plan. */
  premium: boolean;
}

/**
 * The uniform adapter every integration implements. A real adapter would hold
 * OAuth tokens / API clients; the mock holds the demo dataset for one business.
 */
export interface Connector {
  readonly kind: ConnectorKind;
  readonly capability: ConnectorCapability;
  /** Pull the latest snapshot for a business. */
  sync(businessId: string, now: Date): Promise<ConnectorSyncResult>;
}

// ---------------------------------------------------------------------------
// Capability catalogue (drives onboarding + data-source health pages)
// ---------------------------------------------------------------------------

export const CONNECTOR_CAPABILITIES: ConnectorCapability[] = [
  {
    kind: "quickbooks",
    nameKey: "connector.quickbooks.name",
    descriptionKey: "connector.quickbooks.desc",
    domains: ["bank", "ar", "ap"],
    premium: true,
  },
  {
    kind: "xero",
    nameKey: "connector.xero.name",
    descriptionKey: "connector.xero.desc",
    domains: ["bank", "ar", "ap"],
    premium: true,
  },
  {
    kind: "square",
    nameKey: "connector.square.name",
    descriptionKey: "connector.square.desc",
    domains: ["bank", "sales"],
    premium: true,
  },
  {
    kind: "stripe",
    nameKey: "connector.stripe.name",
    descriptionKey: "connector.stripe.desc",
    domains: ["bank", "ar", "sales"],
    premium: true,
  },
  {
    kind: "shopify",
    nameKey: "connector.shopify.name",
    descriptionKey: "connector.shopify.desc",
    domains: ["sales", "ar"],
    premium: true,
  },
  {
    kind: "csv",
    nameKey: "connector.csv.name",
    descriptionKey: "connector.csv.desc",
    domains: ["bank", "ar", "ap"],
    premium: false,
  },
  {
    kind: "manual",
    nameKey: "connector.manual.name",
    descriptionKey: "connector.manual.desc",
    domains: ["bank", "ar", "ap"],
    premium: false,
  },
];

export function capabilityFor(kind: ConnectorKind): ConnectorCapability {
  const cap = CONNECTOR_CAPABILITIES.find((c) => c.kind === kind);
  if (!cap) throw new Error(`Unknown connector kind: ${kind}`);
  return cap;
}

// ---------------------------------------------------------------------------
// Mock connector — reads from an injected demo dataset
// ---------------------------------------------------------------------------

/** The slice of demo data a mock connector serves for one business. */
export interface MockDataset {
  bank: BankPosition;
  receivables: Receivable[];
  payables: Payable[];
  recurring: RecurringExpense[];
}

/**
 * Build a mock connector of the given kind, backed by a demo dataset. Only the
 * domains the connector "supports" are returned, so a Stripe mock won't surface
 * payables and a Square mock won't surface AR — mirroring real coverage gaps
 * and making the data-source health page meaningful.
 */
export function createMockConnector(kind: ConnectorKind, dataset: MockDataset): Connector {
  const capability = capabilityFor(kind);
  const domains = new Set<DataDomain>(capability.domains);

  return {
    kind,
    capability,
    async sync(_businessId: string, now: Date): Promise<ConnectorSyncResult> {
      const receivables = domains.has("ar") ? dataset.receivables : [];
      const payables = domains.has("ap") ? dataset.payables : [];
      const recurring = domains.has("ap") || domains.has("bank") ? dataset.recurring : [];
      const bank = domains.has("bank") ? dataset.bank : undefined;

      const counts: Partial<Record<DataDomain, number>> = {};
      if (bank) counts.bank = 1;
      if (domains.has("ar")) counts.ar = receivables.length;
      if (domains.has("ap")) counts.ap = payables.length;

      return {
        bank,
        receivables,
        payables,
        recurring,
        counts,
        syncedAt: now.toISOString(),
      };
    },
  };
}

/**
 * Produce a DataSource health record from a connector + its last sync. The
 * data-source health page renders these.
 */
export function dataSourceFromSync(
  businessId: string,
  kind: ConnectorKind,
  status: ConnectorStatus,
  result: ConnectorSyncResult
): DataSource {
  const capability = capabilityFor(kind);
  const recordCount = Object.values(result.counts).reduce((s, n) => s + (n ?? 0), 0);
  return {
    id: `ds_${businessId}_${kind}`,
    businessId,
    kind,
    status,
    domains: capability.domains,
    lastSyncedAt: result.syncedAt,
    recordCount,
  };
}
