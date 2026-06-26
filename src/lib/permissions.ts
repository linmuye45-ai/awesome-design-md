import type { Role } from "./cashops/domain";

/**
 * CashOps permission model. Real checks used to gate navigation, guard pages
 * and redact sensitive data — enforced again server-side in production.
 *
 * Roles:
 *  - owner       : full control, billing, approve/execute, manage team.
 *  - admin       : everything operational except billing/team management.
 *  - accountant  : financial data, forecast, audit, export — no execution.
 *  - manager     : collections/payables drafting + approval, no settings/export.
 *  - viewer      : read-only summary, redacted financial detail.
 */
export type Permission =
  | "dashboard.full"
  | "dashboard.summary"
  | "forecast.view"
  | "collections.view"
  | "collections.draft"
  | "payables.view"
  | "payables.draft"
  | "advisor.use"
  | "actions.view"
  | "actions.approve"
  | "actions.execute"
  | "audit.view"
  | "datasources.view"
  | "datasources.manage"
  | "pricing.view"
  | "pricing.manage"
  | "settings.view"
  | "settings.manageTeam"
  | "data.export"
  | "data.delete"
  | "financials.viewSensitive";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "dashboard.full",
    "forecast.view",
    "collections.view",
    "collections.draft",
    "payables.view",
    "payables.draft",
    "advisor.use",
    "actions.view",
    "actions.approve",
    "actions.execute",
    "audit.view",
    "datasources.view",
    "datasources.manage",
    "pricing.view",
    "pricing.manage",
    "settings.view",
    "settings.manageTeam",
    "data.export",
    "data.delete",
    "financials.viewSensitive",
  ],
  admin: [
    "dashboard.full",
    "forecast.view",
    "collections.view",
    "collections.draft",
    "payables.view",
    "payables.draft",
    "advisor.use",
    "actions.view",
    "actions.approve",
    "actions.execute",
    "audit.view",
    "datasources.view",
    "datasources.manage",
    "pricing.view",
    "settings.view",
    "data.export",
    "financials.viewSensitive",
  ],
  accountant: [
    "dashboard.full",
    "forecast.view",
    "collections.view",
    "payables.view",
    "advisor.use",
    "actions.view",
    "audit.view",
    "datasources.view",
    "settings.view",
    "data.export",
    "financials.viewSensitive",
  ],
  manager: [
    "dashboard.full",
    "forecast.view",
    "collections.view",
    "collections.draft",
    "payables.view",
    "payables.draft",
    "advisor.use",
    "actions.view",
    "actions.approve",
    "datasources.view",
    "settings.view",
  ],
  viewer: ["dashboard.summary", "forecast.view", "actions.view", "settings.view"],
};

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: Role, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/**
 * Role-based redaction: viewers (and any role lacking financials.viewSensitive)
 * should not see exact customer/vendor amounts. Pages call this to decide
 * whether to mask a sensitive figure.
 */
export function canSeeSensitiveFinancials(role: Role): boolean {
  return can(role, "financials.viewSensitive");
}

/** Map a route path to the permission that grants access. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard.summary",
  "/forecast": "forecast.view",
  "/collections": "collections.view",
  "/payables": "payables.view",
  "/advisor": "advisor.use",
  "/actions": "actions.view",
  "/audit": "audit.view",
  "/data-sources": "datasources.view",
  "/pricing": "pricing.view",
  "/settings": "settings.view",
};

export function canAccessRoute(role: Role, path: string): boolean {
  if (path === "/dashboard") {
    return can(role, "dashboard.summary") || can(role, "dashboard.full");
  }
  const required = ROUTE_PERMISSIONS[path];
  if (!required) return true;
  return can(role, required);
}

/**
 * Tenant isolation guard: any record carrying a businessId must match the
 * active business before it is shown/mutated. Use in repositories/selectors.
 */
export function belongsToTenant<T extends { businessId: string }>(
  record: T,
  activeBusinessId: string | undefined
): boolean {
  return !!activeBusinessId && record.businessId === activeBusinessId;
}

export function scopeToTenant<T extends { businessId: string }>(
  records: T[],
  activeBusinessId: string | undefined
): T[] {
  return records.filter((r) => belongsToTenant(r, activeBusinessId));
}
