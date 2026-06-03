"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState, useTransition } from "react";

type BacklogStory = {
  id: string;
  title: string;
  featureName: string;
  storyPoints: number | null;
  estimatedDays: number | null;
};

type Preview = {
  storyTitle: string;
  storyEstimatedDays: number;
  currentPlannedEffortDays: number;
  afterAddPlannedEffortDays: number;
  capacityDays: number | null;
  riskLabel: string;
};

export function AddStoryDialog({
  sprintId,
  releaseId,
  onAdded
}: {
  sprintId: string;
  releaseId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stories, setStories] = useState<BacklogStory[]>([]);
  const [storyId, setStoryId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedStory = useMemo(() => stories.find((story) => story.id === storyId), [stories, storyId]);

  useEffect(() => {
    if (!open) return;
    setError("");
    fetch(`/api/backlog?releaseId=${releaseId}&unplannedOnly=true&includeCanceled=false`)
      .then((response) => response.json())
      .then((payload) => {
        const nextStories = payload.stories ?? [];
        setStories(nextStories);
        setStoryId(nextStories[0]?.id ?? "");
      })
      .catch(() => setError("Failed to load backlog stories"));
  }, [open, releaseId]);

  useEffect(() => {
    if (!open || !storyId) {
      setPreview(null);
      return;
    }

    setError("");
    fetch(`/api/stories/${storyId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprintId, previewOnly: true })
    })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setPreview(null);
          setError(Object.values(payload.errors ?? {}).join(", "));
          return;
        }
        setPreview(payload.preview);
      })
      .catch(() => {
        setPreview(null);
        setError("Failed to preview story impact");
      });
  }, [open, sprintId, storyId]);

  async function confirm() {
    if (!storyId) return;

    const response = await fetch(`/api/stories/${storyId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprintId })
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(Object.values(payload.errors ?? {}).join(", "));
      return;
    }

    setOpen(false);
    startTransition(onAdded);
  }

  const exceedsCapacity =
    preview?.capacityDays == null ||
    preview.afterAddPlannedEffortDays > preview.capacityDays;

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Add Story
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-xl rounded-lg border border-line bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Add Story</h2>
                <p className="text-sm text-slate-500">Select an unplanned story for this sprint.</p>
              </div>
              <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <label className="mt-4 grid gap-1 text-sm font-medium text-slate-700">
              Story
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={storyId}
                onChange={(event) => setStoryId(event.target.value)}
              >
                {stories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>
            </label>

            {stories.length === 0 && (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                No eligible backlog stories found.
              </p>
            )}

            {preview && (
              <dl className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Story</dt>
                  <dd className="font-medium">{preview.storyTitle}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Feature</dt>
                  <dd>{selectedStory?.featureName ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Estimated days</dt>
                  <dd>{preview.storyEstimatedDays}d</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Current planned effort</dt>
                  <dd>{preview.currentPlannedEffortDays}d</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">After add planned effort</dt>
                  <dd>{preview.afterAddPlannedEffortDays}d</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Capacity status</dt>
                  <dd>{preview.riskLabel}</dd>
                </div>
                {exceedsCapacity && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-800">
                    Sprint will exceed capacity
                  </p>
                )}
              </dl>
            )}

            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={isPending || !preview} onClick={confirm}>
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
