"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type FeatureOption = {
  id: string;
  name: string;
};

type StoryFormProps = {
  features: FeatureOption[];
  fixedFeatureId?: string;
  initial?: {
    id: string;
    featureId: string;
    title: string;
    description: string;
    acceptanceCriteria: string;
    storyPoints: number | null;
    estimatedDays: number | null;
    status: string;
    currentSprintName: string;
  };
};

const STATUS_OPTIONS = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "SPRINT_BACKLOG", label: "Sprint backlog" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" }
];

export function StoryForm({ features, fixedFeatureId, initial }: StoryFormProps) {
  const router = useRouter();
  const [featureId, setFeatureId] = useState(initial?.featureId ?? fixedFeatureId ?? features[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(initial?.acceptanceCriteria ?? "");
  const [storyPoints, setStoryPoints] = useState(initial?.storyPoints?.toString() ?? "0");
  const [estimatedDays, setEstimatedDays] = useState(initial?.estimatedDays?.toString() ?? "0");
  const [status, setStatus] = useState(initial?.status ?? "BACKLOG");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const response = await fetch(initial ? `/api/stories/${initial.id}` : "/api/stories", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        featureId,
        title,
        description,
        acceptanceCriteria,
        storyPoints: Number(storyPoints),
        estimatedDays: Number(estimatedDays),
        status
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setErrors(payload.errors ?? {});
      return;
    }

    startTransition(() => {
      router.push(`/features/${featureId}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4 rounded-lg border border-line bg-white p-4" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Feature
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={featureId}
          disabled={Boolean(fixedFeatureId)}
          onChange={(event) => setFeatureId(event.target.value)}
        >
          {features.map((feature) => (
            <option key={feature.id} value={feature.id}>
              {feature.name}
            </option>
          ))}
        </select>
        {errors.featureId && <p className="text-xs text-red-600">{errors.featureId}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Title
        <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Description
        <textarea
          className="min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Acceptance criteria
        <textarea
          className="min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={acceptanceCriteria}
          onChange={(event) => setAcceptanceCriteria(event.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Story Points
          <Input min={0} step="0.5" type="number" value={storyPoints} onChange={(event) => setStoryPoints(event.target.value)} />
          {errors.storyPoints && <p className="text-xs text-red-600">{errors.storyPoints}</p>}
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Estimated business days
          <Input min={0} step="0.5" type="number" value={estimatedDays} onChange={(event) => setEstimatedDays(event.target.value)} />
          {errors.estimatedDays && <p className="text-xs text-red-600">{errors.estimatedDays}</p>}
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Status
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && <p className="text-xs text-red-600">{errors.status}</p>}
        </label>
      </div>

      {initial && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Current sprint: <span className="font-medium text-slate-800">{initial.currentSprintName}</span>
        </p>
      )}
      {errors.currentSprintId && <p className="text-sm text-red-700">{errors.currentSprintId}</p>}
      {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}

      <div className="flex gap-2">
        <Button disabled={isPending} type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save story
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push(`/features/${featureId}`)}>
          <X className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
