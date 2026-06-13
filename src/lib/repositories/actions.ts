import type { AiAction, AiActionStatus } from "../types";

export function byStatus(actions: AiAction[], status: AiActionStatus | "all"): AiAction[] {
  return actions.filter((a) => (status === "all" ? true : a.status === status));
}

export function drafts(actions: AiAction[]): AiAction[] {
  return actions.filter((a) => a.status === "draft");
}

export function draftCount(actions: AiAction[]): number {
  return drafts(actions).length;
}

export function sortByUpdatedDesc(actions: AiAction[]): AiAction[] {
  return [...actions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
