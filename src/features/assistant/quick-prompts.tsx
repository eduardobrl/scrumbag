"use client";

import { Button } from "@/components/ui/button";

const PROMPTS = [
  "Is my release on track?",
  "Which sprints are over capacity?",
  "What are my risky features?",
  "Suggest story redistribution",
  "Summarize leaked stories",
  "Which stories lack estimates?"
];

export function QuickPrompts({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {PROMPTS.map((prompt) => (
        <Button key={prompt} type="button" variant="secondary" onClick={() => onPrompt(prompt)} className="justify-start">
          {prompt}
        </Button>
      ))}
    </div>
  );
}
