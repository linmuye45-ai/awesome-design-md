import type { ToolDefinition } from "./types";

/**
 * The registry of tools the AI can call. In production this is the schema sent
 * to the LLM for tool-calling; here it documents the same contract so the mock
 * and the real implementation stay aligned.
 */
export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: "getRevenueSummary",
    descriptionKey: "ai.tools.getRevenueSummary",
    parameters: ["dateRange"],
  },
  {
    name: "getExpenseSummary",
    descriptionKey: "ai.tools.getExpenseSummary",
    parameters: ["dateRange"],
  },
  {
    name: "getCashflowForecast",
    descriptionKey: "ai.tools.getCashflowForecast",
    parameters: ["days"],
  },
  { name: "getReceivables", descriptionKey: "ai.tools.getReceivables", parameters: ["status"] },
  { name: "getPayables", descriptionKey: "ai.tools.getPayables", parameters: ["status"] },
  { name: "getTopProducts", descriptionKey: "ai.tools.getTopProducts", parameters: ["metric"] },
  {
    name: "getEmployeeAttendance",
    descriptionKey: "ai.tools.getEmployeeAttendance",
    parameters: ["employeeId", "dateRange"],
  },
  {
    name: "getCustomerRiskSegments",
    descriptionKey: "ai.tools.getCustomerRiskSegments",
    parameters: [],
  },
  {
    name: "draftMessage",
    descriptionKey: "ai.tools.draftMessage",
    parameters: ["type", "recipient", "context"],
  },
  {
    name: "createTask",
    descriptionKey: "ai.tools.createTask",
    parameters: ["assignee", "title", "dueDate"],
  },
  {
    name: "logAiRecommendation",
    descriptionKey: "ai.tools.logAiRecommendation",
    parameters: ["recommendation"],
  },
];

export function toolNames(): string[] {
  return TOOL_REGISTRY.map((t) => t.name);
}
