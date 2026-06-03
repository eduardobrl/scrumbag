"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type SprintOption = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

type Preview = {
  storyTitle: string;
  featureName: string;
  storyPoints: number | null;
  storyEstimatedDays: number;
  currentPlannedEffortDays: number;
  afterAddPlannedEffortDays: number;
  riskLabel: string;
};

export function PlanStoryDialog({
  storyId,
  storyTitle,
  sprints
}: {
  storyId: string;
  storyTitle: string;
  sprints: SprintOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sprintId, setSprintId] = useState(sprints[0]?.id ?? "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !sprintId) return;
    setError("");
    fetch(`/api/stories/${storyId}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprintId, previewOnly: true })
    })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) {
          setError(Object.values(payload.errors ?? {}).join(", "));
          setPreview(null);
        } else {
          setPreview(payload.preview);
        }
      });
  }, [open, sprintId, storyId]);

  async function confirm() {
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
    startTransition(() => router.refresh());
  }

  return (
    <>
      <Button type="button" variant="secondary" disabled={sprints.length === 0} onClick={() => setOpen(true)}>
        Plan
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Plan story</h2>
                <p className="text-sm text-slate-500">{storyTitle}</p>
              </div>
              <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <label className="mt-4 grid gap-1 text-sm font-medium text-slate-700">
              Sprint
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
              >
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} - {sprint.startDate} to {sprint.endDate}
                  </option>
                ))}
              </select>
            </label>

            {preview && (
              <dl className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Feature</dt>
                  <dd className="font-medium">{preview.featureName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Story Points</dt>
                  <dd>{preview.storyPoints ?? "-"}</dd>
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
                  <dt className="text-slate-500">After add</dt>
                  <dd>{preview.afterAddPlannedEffortDays}d</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Capacity</dt>
                  <dd>{preview.riskLabel}</dd>
                </div>
                {preview.storyEstimatedDays === 0 && (
                  <p className="text-amber-700">This story has no estimated days, so planned effort impact may be incomplete.</p>
                )}
              </dl>
            )}

            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending || !preview} onClick={confirm}>
                Add to sprint
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
