"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleAlert, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";

export type ImpedimentStoryOption = {
  id: string;
  title: string;
  featureName: string;
  estimatedDays: number | null;
  status: string;
};

type ImpedimentFormProps = {
  stories: ImpedimentStoryOption[];
  selectedReleaseId: string;
  defaultReportedDate: string;
};

export function validateAffectedStorySelection(storyIds: string[]) {
  return storyIds.length > 0 ? null : "Selecione pelo menos uma historia afetada";
}

export function ImpedimentForm({ stories, selectedReleaseId, defaultReportedDate }: ImpedimentFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reportedDate, setReportedDate] = useState(defaultReportedDate);
  const [affectedStoryIds, setAffectedStoryIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function toggleStory(storyId: string) {
    setAffectedStoryIds((current) =>
      current.includes(storyId) ? current.filter((id) => id !== storyId) : [...current, storyId]
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectionError = validateAffectedStorySelection(affectedStoryIds);
    if (selectionError) {
      setErrors({ affectedStoryIds: selectionError });
      return;
    }

    setErrors({});
    const response = await fetch("/api/impediments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, reportedDate, affectedStoryIds })
    });
    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      return;
    }

    startTransition(() => {
      router.push(`/impediments/${payload.impediment.id}?releaseId=${encodeURIComponent(selectedReleaseId)}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4 rounded-lg border border-line bg-white p-4" onSubmit={onSubmit}>
      <div className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 text-accent" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase text-slate-500">Novo impedimento</h2>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Titulo
        <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Descricao
        <textarea
          className="min-h-[84px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Data de registro
        <Input type="date" value={reportedDate} onChange={(event) => setReportedDate(event.target.value)} required />
        {errors.reportedDate && <p className="text-xs text-red-600">{errors.reportedDate}</p>}
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Historias afetadas</legend>
        <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
          {stories.map((story) => (
            <label key={story.id} className="flex cursor-pointer items-start gap-3 border-b border-line bg-white px-3 py-2 last:border-b-0">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-accent"
                checked={affectedStoryIds.includes(story.id)}
                onChange={() => toggleStory(story.id)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-800">{story.title}</span>
                <span className="block text-xs text-slate-500">
                  {story.featureName} - {story.estimatedDays ?? 0}d - {story.status}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.affectedStoryIds && <p className="text-xs text-red-600">{errors.affectedStoryIds}</p>}
      </fieldset>

      {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}

      <Button disabled={isPending || stories.length === 0} type="submit">
        <Save className="h-4 w-4" aria-hidden="true" />
        Criar impedimento
      </Button>
    </form>
  );
}
