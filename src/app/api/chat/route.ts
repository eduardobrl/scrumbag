import { NextResponse } from "next/server";
import { streamChatWithTools, type ChatMessage, type ToolCallRequest } from "@/lib/ai";
import { executeTool, tools } from "@/mcp/tools";

const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content:
    "You are Squad Planner's local assistant. Ground answers in MCP tool data. Suggest changes cautiously. Sensitive operations require explicit confirmation before execution."
};

export async function POST(request: Request) {
  const payload = await request.json();
  const messages = Array.isArray(payload.messages) ? (payload.messages as ChatMessage[]) : [];

  if (payload.confirmedToolCall) {
    const call = payload.confirmedToolCall as ToolCallRequest;
    const result = await executeTool(call.name, { ...call.arguments, confirmed: true });
    return NextResponse.json({
      content: `Confirmed tool executed: ${call.name}. Result: ${JSON.stringify(result)}`,
      toolResults: [{ name: call.name, result }]
    });
  }

  const response = await streamChatWithTools([SYSTEM_PROMPT, ...messages]);
  const dangerousCalls = response.toolCalls.filter((call) => tools.get(call.name)?.dangerous);

  if (dangerousCalls.length > 0) {
    return NextResponse.json({
      content: response.content,
      requiresConfirmation: true,
      toolCalls: dangerousCalls
    });
  }

  if (response.toolCalls.length > 0) {
    const toolResults = [];
    for (const call of response.toolCalls) {
      toolResults.push({ name: call.name, result: await executeTool(call.name, call.arguments) });
    }
    return NextResponse.json({ content: JSON.stringify(toolResults, null, 2), toolResults });
  }

  return new Response(response.content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
