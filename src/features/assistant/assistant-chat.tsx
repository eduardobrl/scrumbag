"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/features/assistant/confirm-dialog";
import { QuickPrompts } from "@/features/assistant/quick-prompts";
import type { ChatMessage, ToolCallRequest } from "@/lib/ai";

type UiMessage = ChatMessage & { toolCalls?: ToolCallRequest[] };

export function AssistantChat() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingToolCall, setPendingToolCall] = useState<ToolCallRequest | null>(null);

  async function sendMessage(content: string) {
    if (!content.trim()) return;
    const nextMessages: UiMessage[] = [...messages, { role: "user", content: content.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) })
      });
      await handleResponse(response);
    } finally {
      setLoading(false);
    }
  }

  async function handleResponse(response: Response) {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      if (payload.requiresConfirmation && payload.toolCalls?.[0]) {
        setPendingToolCall(payload.toolCalls[0]);
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.content ?? "Tool response received.", toolCalls: payload.toolCalls }
      ]);
      return;
    }

    const text = await response.text();
    setMessages((current) => [...current, { role: "assistant", content: text }]);
  }

  async function confirmToolCall() {
    if (!pendingToolCall) return;
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, confirmedToolCall: pendingToolCall })
      });
      setPendingToolCall(null);
      await handleResponse(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-ink">Quick prompts</h2>
        <div className="mt-4">
          <QuickPrompts onPrompt={sendMessage} />
        </div>
      </Card>

      <Card className="min-h-[520px]">
        <h2 className="text-base font-semibold text-ink">Chat</h2>
        <div className="mt-4 flex h-[380px] flex-col gap-3 overflow-y-auto rounded-md border border-line bg-slate-50 p-3">
          {messages.length === 0 ? (
            <div className="text-sm text-slate-600">Ask about release fit, risky sprints, leaked stories, or redistribution.</div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "self-end" : "self-start"}>
                <div
                  className={
                    message.role === "user"
                      ? "max-w-2xl rounded-md bg-accent px-3 py-2 text-sm text-white"
                      : "max-w-2xl rounded-md border border-line bg-white px-3 py-2 text-sm text-slate-800"
                  }
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.toolCalls?.map((call) => (
                    <div key={call.id} className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                      Tool call: {call.name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          {loading ? <div className="text-sm text-slate-500">Assistant is thinking...</div> : null}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
        >
          <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question" />
          <Button type="submit" disabled={loading}>
            <Send className="h-4 w-4" aria-hidden />
            Send
          </Button>
        </form>
      </Card>

      {pendingToolCall ? (
        <ConfirmDialog toolCall={pendingToolCall} onConfirm={confirmToolCall} onCancel={() => setPendingToolCall(null)} />
      ) : null}
    </div>
  );
}
