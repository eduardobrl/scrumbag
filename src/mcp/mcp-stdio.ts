import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { listToolDefinitions, executeTool } from "@/mcp/tools";

const server = new Server(
  { name: "squad-planner", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: listToolDefinitions().map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: {
      type: "object" as const,
      properties: t.parameters.properties ?? {},
      required: t.parameters.required,
    },
    annotations: t.dangerous
      ? { destructiveHint: true, readOnlyHint: false }
      : undefined,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    const result = await executeTool(name, (args ?? {}) as Record<string, unknown>);
    return {
      content: [
        {
          type: "text" as const,
          text:
            typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: error instanceof Error ? error.message : "Unknown error",
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
