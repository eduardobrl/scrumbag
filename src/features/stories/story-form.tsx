"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

type FeatureOption = {
  id: string;
  name: string;
};

type EstimateHistoryItem = {
  id: string;
  field: "storyPoints" | "estimatedDays";
  oldValue: number | null;
  newValue: number | null;
  changeReason: string | null;
  timestamp: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

type StoryFormProps = {
  features: FeatureOption[];
  fixedFeatureId?: string;
  releaseStatus?: string;
  estimateHistory?: EstimateHistoryItem[];
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

const STATUS_OPTIONS = ["BACKLOG", "SPRINT_BACKLOG", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

function formatEstimateValue(value: number | null) {
  return value === null ? "-" : value.toString();
}

function signedDelta(oldValue: number | null, newValue: number | null) {
  const delta = (newValue ?? 0) - (oldValue ?? 0);
  if (delta > 0) return `+${delta}`;
  return delta.toString();
}

export function StoryForm({ features, fixedFeatureId, releaseStatus, estimateHistory = [], initial }: StoryFormProps) {
  const router = useRouter();
  const tStories = useTranslations("stories");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const isPostGoLive = Boolean(initial && (releaseStatus === "IN_PROGRESS" || releaseStatus === "CLOSED"));
  const [featureId, setFeatureId] = useState(initial?.featureId ?? fixedFeatureId ?? features[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(initial?.acceptanceCriteria ?? "");
  const [storyPoints, setStoryPoints] = useState(initial?.storyPoints?.toString() ?? "0");
  const [estimatedDays, setEstimatedDays] = useState(initial?.estimatedDays?.toString() ?? "0");
  const [status, setStatus] = useState(initial?.status ?? "BACKLOG");
  const [changeReason, setChangeReason] = useState("");
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
        status,
        ...(isPostGoLive ? { changeReason } : {})
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
    <div className="space-y-4">
      <form className="space-y-4 rounded-lg border border-line bg-white p-4" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {tStories("feature")}
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
        {tStories("title")}
        <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
        {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {tStories("description")}
        <textarea
          className="min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        {tStories("acceptanceCriteria")}
        <textarea
          className="min-h-[80px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100"
          value={acceptanceCriteria}
          onChange={(event) => setAcceptanceCriteria(event.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {tStories("storyPoints")}
          <Input min={0} step="0.5" type="number" value={storyPoints} onChange={(event) => setStoryPoints(event.target.value)} />
          {errors.storyPoints && <p className="text-xs text-red-600">{errors.storyPoints}</p>}
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {tStories("estimatedBusinessDays")}
          <Input min={0} step="0.5" type="number" value={estimatedDays} onChange={(event) => setEstimatedDays(event.target.value)} />
          {errors.estimatedDays && <p className="text-xs text-red-600">{errors.estimatedDays}</p>}
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {tCommon("status")}
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {tStatus(option)}
              </option>
            ))}
          </select>
          {errors.status && <p className="text-xs text-red-600">{errors.status}</p>}
        </label>
      </div>

      {releaseStatus === "PLANNING" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {tStories("planningHelper")}
        </p>
      )}

      {isPostGoLive && (
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          {tStories("changeReason")}
          <Input value={changeReason} onChange={(event) => setChangeReason(event.target.value)} />
        </label>
      )}

      {initial && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {tStories("sprint")}: <span className="font-medium text-slate-800">{initial.currentSprintName}</span>
        </p>
      )}
      {errors.currentSprintId && <p className="text-sm text-red-700">{errors.currentSprintId}</p>}
      {errors.general && <p className="text-sm text-red-700">{errors.general}</p>}

      <div className="flex gap-2">
        <Button disabled={isPending} type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          {tStories("save")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push(`/features/${featureId}`)}>
          <X className="h-4 w-4" aria-hidden="true" />
          {tCommon("cancel")}
        </Button>
      </div>
      </form>

      {isPostGoLive && estimateHistory.length > 0 && (
        <section className="space-y-3 rounded-lg border border-line bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{tStories("estimateHistory.title")}</h2>
            <p className="mt-1 text-sm text-slate-600">{tStories("estimateHistory.subtitle")}</p>
          </div>
          <div className="space-y-2">
            {estimateHistory.map((change) => (
              <article key={change.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {tStories(`estimateHistory.fields.${change.field}`)}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(change.timestamp).toLocaleString()}</p>
                  </div>
                  <Badge tone={change.tone}>{signedDelta(change.oldValue, change.newValue)}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {formatEstimateValue(change.oldValue)} -&gt; {formatEstimateValue(change.newValue)}
                </p>
                {change.changeReason && (
                  <p className="mt-2 text-sm text-slate-600">
                    {tStories("estimateHistory.reason")}: {change.changeReason}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
