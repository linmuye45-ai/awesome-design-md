import type { Shift, Employee } from "../types";

export function byDay(shifts: Shift[], day: string): Shift[] {
  return shifts.filter((s) => s.day === day);
}

export function byEmployee(shifts: Shift[], employeeId: string): Shift[] {
  return shifts.filter((s) => s.employeeId === employeeId);
}

/** Naive coverage model: a day is understaffed if fewer than `min` shifts. */
export function coverageForDay(shifts: Shift[], day: string, min = 2): "ok" | "understaffed" {
  return byDay(shifts, day).length >= min ? "ok" : "understaffed";
}

export function estimatedWeeklyCost(shifts: Shift[], employees: Employee[]): number {
  const rate = (id: string) => employees.find((e) => e.id === id)?.hourlyRate ?? 0;
  return shifts.reduce((sum, s) => {
    const start = Number(s.startTime.split(":")[0]);
    const end = Number(s.endTime.split(":")[0]);
    const hours = Math.max(0, end - start);
    return sum + hours * rate(s.employeeId);
  }, 0);
}
