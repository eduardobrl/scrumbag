import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActiveReleaseSummary } from "@/lib/releases";
import { executeTool, listToolDefinitions } from "@/mcp/tools";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type ToolCallRequest = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export class OpenAIClient {
  private client: OpenAI | null;

  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async streamChatWithTools(messages: ChatMessage[]) {
    if (!this.client) {
      return localAssistantResponse(messages);
    }

    const completion = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages: messages.map((message) => ({
        role: message.role === "tool" ? "user" : message.role,
        content: message.content
      })) as ChatCompletionMessageParam[],
      tools: listToolDefinitions().map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }))
    });

    const choice = completion.choices[0];
    return {
      content: choice.message.content ?? "",
      toolCalls:
        choice.message.tool_calls
          ?.filter((call) => call.type === "function")
          .map((call) => ({
            id: call.id,
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments || "{}") as Record<string, unknown>
          })) ?? []
    };
  }
}

async function localAssistantResponse(messages: ChatMessage[]) {
  const latest = messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
  const lower = latest.toLowerCase();
  const activeRelease = await getActiveReleaseSummary();

  if (/(close|reopen|cancel).*(sprint|story|feature)/.test(lower)) {
    const toolCall = await localDangerousToolCall(lower, activeRelease?.id);
    return {
      content: "This looks like a sensitive planning change. Please confirm before I execute it.",
      toolCalls: [toolCall]
    };
  }

  if (!activeRelease) {
    return {
      content: "No active release is configured yet. Create or mark a release as in progress before asking for release health analysis.",
      toolCalls: []
    };
  }

  if (lower.includes("capacity") || lower.includes("track") || lower.includes("risk") || lower.includes("release")) {
    const summary = await executeTool("explain_release_status", { releaseId: activeRelease.id });
    return { content: formatLocalResult(summary), toolCalls: [] };
  }

  if (lower.includes("redistribution")) {
    const suggestion = await executeTool("suggest_story_redistribution", { releaseId: activeRelease.id });
    return { content: formatLocalResult(suggestion), toolCalls: [] };
  }

  if (lower.includes("leak")) {
    const report = await executeTool("get_leakage_report", { releaseId: activeRelease.id });
    return { content: formatLocalResult(report), toolCalls: [] };
  }

  return {
    content: `I can inspect the active release "${activeRelease.name}" through local MCP tools. Ask about release fit, risky sprints, leaked stories, redistribution, or stories without estimates.`,
    toolCalls: []
  };
}

async function localDangerousToolCall(lower: string, releaseId?: string): Promise<ToolCallRequest> {
  if (lower.includes("feature")) {
    const feature = releaseId
      ? await prisma.feature.findFirst({ where: { releaseId, lifecycleStatus: "ACTIVE" }, orderBy: { createdAt: "asc" } })
      : null;
    return {
      id: "local-dangerous-tool-call",
      name: "cancel_feature",
      arguments: { featureId: feature?.id ?? "replace-with-feature-id" }
    };
  }

  if (lower.includes("story")) {
    const story = releaseId
      ? await prisma.story.findFirst({
          where: { feature: { releaseId }, status: { not: StoryStatus.CANCELLED } },
          orderBy: { createdAt: "asc" }
        })
      : null;
    return {
      id: "local-dangerous-tool-call",
      name: "cancel_story",
      arguments: { storyId: story?.id ?? "replace-with-story-id" }
    };
  }

  const sprint = releaseId
    ? await prisma.sprint.findFirst({
        where: { releaseId, status: SprintStatus.IN_PROGRESS },
        orderBy: { startDate: "asc" }
      })
    : null;
  return {
    id: "local-dangerous-tool-call",
    name: lower.includes("reopen") ? "reopen_sprint" : "close_sprint",
    arguments: { sprintId: sprint?.id ?? "replace-with-sprint-id" }
  };
}

function formatLocalResult(value: unknown): string {
  if (typeof value === "object" && value && "summary" in value) {
    return String((value as { summary: unknown }).summary);
  }
  return JSON.stringify(value, null, 2);
}

export async function streamChatWithTools(messages: ChatMessage[]) {
  return new OpenAIClient().streamChatWithTools(messages);
}
