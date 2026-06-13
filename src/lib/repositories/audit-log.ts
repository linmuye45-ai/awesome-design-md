import type { AuditLog } from "../types";

export function recent(log: AuditLog[], limit = 20): AuditLog[] {
  return [...log]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function forTarget(log: AuditLog[], targetType: string, targetId?: string): AuditLog[] {
  return log.filter(
    (l) => l.targetType === targetType && (targetId ? l.targetId === targetId : true)
  );
}
