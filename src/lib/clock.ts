/**
 * Centralized clock + demo-date strategy.
 *
 * - In normal mode, "now" is the real current time (`new Date()`).
 * - In demo mode, "now" is anchored to a fixed instant so the seeded mock data
 *   stays internally consistent; the UI surfaces a "demo data anchored to …"
 *   banner whenever this anchor is in effect.
 *
 * All mock data is generated relative to the anchor via `daysFromToday` /
 * `hoursFromNow`, so nothing is hardcoded to a literal calendar date.
 */

/** Fixed instant used only when demo mode is on. */
export const DEMO_ANCHOR = new Date("2026-06-04T10:00:00");

let demoMode = true;

export function setDemoMode(value: boolean): void {
  demoMode = value;
}

export function isDemoMode(): boolean {
  return demoMode;
}

/** The app's "today" — real now, or the demo anchor in demo mode. */
export function now(): Date {
  return demoMode ? new Date(DEMO_ANCHOR) : new Date();
}

/** Always the real wall-clock time, regardless of demo mode (for audit logs). */
export function realNow(): Date {
  return new Date();
}

export function nowIso(): string {
  return now().toISOString();
}

export function realNowIso(): string {
  return realNow().toISOString();
}

export function daysFromToday(n: number): string {
  const d = now();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export function hoursFromNow(n: number): string {
  const d = now();
  d.setHours(d.getHours() + n);
  return d.toISOString();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
