import { readTools } from "@/mcp/tools/read";
import { safeTools } from "@/mcp/tools/safe";
import { suggestTools } from "@/mcp/tools/suggest";
import { writeTools } from "@/mcp/tools/write";

export type JsonSchema = {
  type: "object";
  properties?: Record<string, { type: string; enum?: string[] }>;
  required?: string[];
};

export type McpTool = {
  name: string;
  description: string;
  parameters: JsonSchema;
  dangerous?: boolean;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

export const tools = new Map<string, McpTool>();

for (const tool of [...readTools, ...suggestTools, ...writeTools, ...safeTools]) {
  tools.set(tool.name, tool);
}

export function listToolDefinitions() {
  return Array.from(tools.values()).map(({ name, description, parameters, dangerous }) => ({
    name,
    description,
    parameters,
    dangerous: dangerous ?? false
  }));
}

export function validateToolArgs(tool: McpTool, args: Record<string, unknown>) {
  const required = tool.parameters.required ?? [];
  for (const key of required) {
    if (args[key] === undefined || args[key] === null || args[key] === "") {
      return { ok: false as const, error: `${key} is required` };
    }
  }

  for (const [key, schema] of Object.entries(tool.parameters.properties ?? {})) {
    const value = args[key];
    if (value === undefined || value === null) continue;

    if (schema.enum && !schema.enum.includes(String(value))) {
      return { ok: false as const, error: `${key} must be one of ${schema.enum.join(", ")}` };
    }
    if (schema.type === "number" && typeof value !== "number") {
      return { ok: false as const, error: `${key} must be a number` };
    }
    if (schema.type === "boolean" && typeof value !== "boolean") {
      return { ok: false as const, error: `${key} must be a boolean` };
    }
    if (schema.type === "string" && typeof value !== "string") {
      return { ok: false as const, error: `${key} must be a string` };
    }
  }

  return { ok: true as const };
}

export async function executeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  const validation = validateToolArgs(tool, args);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  return tool.handler(args);
}
