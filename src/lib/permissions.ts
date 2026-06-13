import type { Role } from "./types";

/**
 * Front-end permission model. These are real checks used to gate navigation,
 * guard pages and redact sensitive data — not decorative labels. In production
 * the same permission codes would be enforced again on the server.
 */
export type Permission =
  | "ledger.view"
  | "ledger.edit"
  | "cashflow.view"
  | "reports.view"
  | "actions.view"
  | "actions.execute"
  | "team.view"
  | "team.viewPrivate"
  | "schedule.view"
  | "schedule.viewOwn"
  | "customers.view"
  | "network.view"
  | "settings.view"
  | "data.export"
  | "dashboard.full"
  | "dashboard.summary";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "ledger.view",
    "ledger.edit",
    "cashflow.view",
    "reports.view",
    "actions.view",
    "actions.execute",
    "team.view",
    "team.viewPrivate",
    "schedule.view",
    "customers.view",
    "network.view",
    "settings.view",
    "data.export",
    "dashboard.full",
  ],
  manager: [
    "ledger.view",
    "ledger.edit",
    "actions.view",
    "actions.execute",
    "team.view",
    "schedule.view",
    "customers.view",
    "network.view",
    "settings.view",
    "dashboard.full",
  ],
  accountant: [
    "ledger.view",
    "ledger.edit",
    "cashflow.view",
    "reports.view",
    "actions.view",
    "settings.view",
    "dashboard.full",
  ],
  employee: ["schedule.viewOwn", "settings.view", "dashboard.summary"],
  viewer: ["reports.view", "settings.view", "dashboard.summary"],
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

/** Map a route path to the permission(s) that grant access. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard.summary",
  "/ask": "dashboard.summary",
  "/ledger": "ledger.view",
  "/capture": "ledger.edit",
  "/cashflow": "cashflow.view",
  "/actions": "actions.view",
  "/team": "team.view",
  "/schedule": "schedule.view",
  "/customers": "customers.view",
  "/reports": "reports.view",
  "/network": "network.view",
  "/settings": "settings.view",
};

export function canAccessRoute(role: Role, path: string): boolean {
  // Special case: employees can see their own schedule even without team.view.
  if (path === "/schedule") {
    return can(role, "schedule.view") || can(role, "schedule.viewOwn");
  }
  if (path === "/dashboard" || path === "/ask") {
    return can(role, "dashboard.summary") || can(role, "dashboard.full");
  }
  const required = ROUTE_PERMISSIONS[path];
  if (!required) return true;
  return can(role, required);
}
