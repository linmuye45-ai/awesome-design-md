import type { Employee } from "../types";

export function active(employees: Employee[]): Employee[] {
  return employees.filter((e) => e.status === "active");
}

export function clockedIn(employees: Employee[]): Employee[] {
  return employees.filter((e) => e.clockedInToday);
}

export function clockedInCount(employees: Employee[]): number {
  return clockedIn(employees).length;
}

export function weeklyLaborCost(employees: Employee[], hoursPerWeek = 40): number {
  return active(employees).reduce((s, e) => s + (e.hourlyRate ?? 0) * hoursPerWeek, 0);
}
