import type { AiIntent, AiResponse } from "../types";

export type { AiIntent, AiResponse };

/** A tool the AI may invoke. Mirrors a real tool-calling schema. */
export interface ToolDefinition {
  name: string;
  descriptionKey: string;
  /** Names of the parameters the tool accepts (documentation only in the mock). */
  parameters: string[];
}
