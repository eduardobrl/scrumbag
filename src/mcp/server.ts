import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { getOrCreateSettings } from "@/lib/settings";
import { executeTool, listToolDefinitions, tools, validateToolArgs } from "@/mcp/tools";

const LOCALHOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return LOCALHOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function sendJson(response: ServerResponse, status: number, payload: unknown, origin?: string) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  if (isLocalhostOrigin(origin) && origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(JSON.stringify(payload));
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createMcpServer(): Server {
  return createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (!isLocalhostOrigin(origin)) {
      sendJson(response, 403, { error: "Only localhost origins are allowed" });
      return;
    }

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, { status: "ok", version: "1.0" }, origin);
        return;
      }

      if (request.method === "GET" && url.pathname === "/tools") {
        sendJson(response, 200, listToolDefinitions(), origin);
        return;
      }

      const match = url.pathname.match(/^\/tools\/([^/]+)$/);
      if (request.method === "POST" && match) {
        const name = decodeURIComponent(match[1]);
        const tool = tools.get(name);
        if (!tool) {
          sendJson(response, 404, { error: "Tool not found" }, origin);
          return;
        }

        const args = await readBody(request);
        const validation = validateToolArgs(tool, args);
        if (!validation.ok) {
          sendJson(response, 400, { error: validation.error }, origin);
          return;
        }

        if (tool.dangerous && args.confirmed !== true) {
          sendJson(response, 403, { error: "Confirmation required", requiresConfirmation: true }, origin);
          return;
        }

        sendJson(response, 200, { result: await executeTool(name, args) }, origin);
        return;
      }

      sendJson(response, 404, { error: "Not found" }, origin);
    } catch (error) {
      sendJson(response, 500, { error: error instanceof Error ? error.message : "Unknown error" }, origin);
    }
  });
}

export async function startMcpServer() {
  const settings = await getOrCreateSettings();
  if (!settings.mcpEnabled) {
    console.log("MCP server disabled in settings.");
    return null;
  }

  const host = LOCALHOSTS.has(settings.mcpHost) ? settings.mcpHost : "localhost";
  const server = createMcpServer();
  server.listen(settings.mcpPort, host, () => {
    console.log(`MCP server listening on http://${host}:${settings.mcpPort}`);
  });
  return server;
}

if (process.argv[1]?.endsWith("server.ts")) {
  startMcpServer();
}
