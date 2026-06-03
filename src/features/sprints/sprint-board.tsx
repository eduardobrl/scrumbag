"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AddStoryDialog } from "@/features/sprints/add-story-dialog";

export type BoardStoryStatus = "SPRINT_BACKLOG" | "IN_PROGRESS" | "DONE";

export type SprintStory = {
  id: string;
  title: string;
  featureName: string;
  storyPoints: number | null;
  estimatedDays: number | null;
  status: BoardStoryStatus;
};

export type LeakageEvent = {
  storyId: string;
  originSprintName: string;
};

export const SPRINT_BOARD_COLUMNS: { title: string; status: BoardStoryStatus }[] = [
  { title: "Backlog da Sprint", status: "SPRINT_BACKLOG" },
  { title: "Em Execucao", status: "IN_PROGRESS" },
  { title: "Finalizado", status: "DONE" }
];

export function getSprintBoardColumnTitle(status: BoardStoryStatus): string {
  return SPRINT_BOARD_COLUMNS.find((column) => column.status === status)?.title ?? SPRINT_BOARD_COLUMNS[0].title;
}

export function SprintBoard({
  sprintId,
  releaseId,
  stories,
  leakage = [],
  readOnly = false
}: {
  sprintId: string;
  releaseId: string;
  stories: SprintStory[];
  leakage?: LeakageEvent[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(stories);
  const [dragOverStatus, setDragOverStatus] = useState<BoardStoryStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => setItems(stories), [stories]);

  const leakageByStory = useMemo(() => {
    return leakage.reduce<Record<string, LeakageEvent[]>>((acc, event) => {
      acc[event.storyId] = [...(acc[event.storyId] ?? []), event];
      return acc;
    }, {});
  }, [leakage]);

  async function dropStory(storyId: string, status: BoardStoryStatus) {
    const previous = items;
    const story = items.find((item) => item.id === storyId);
    if (!story || story.status === status || readOnly) return;

    setError("");
    setItems((current) => current.map((item) => (item.id === storyId ? { ...item, status } : item)));

    try {
      const response = await fetch(`/api/stories/${storyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        throw new Error("status update failed");
      }
      router.refresh();
    } catch {
      setItems(previous);
      setError("Failed to update status");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Sprint board</h2>
          <p className="text-sm text-slate-500">Track stories through the sprint workflow.</p>
        </div>
        {!readOnly && (
          <AddStoryDialog sprintId={sprintId} releaseId={releaseId} onAdded={() => router.refresh()} />
        )}
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="grid min-h-96 gap-4 lg:grid-cols-3">
        {SPRINT_BOARD_COLUMNS.map((column) => {
          const columnStories = items.filter((story) => story.status === column.status);
          const isDragOver = dragOverStatus === column.status;

          return (
            <div
              key={column.status}
              className={`rounded-lg border p-3 transition ${
                isDragOver ? "border-accent bg-teal-50" : "border-line bg-slate-50"
              }`}
              onDragOver={(event) => {
                if (readOnly) return;
                event.preventDefault();
                setDragOverStatus(column.status);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOverStatus(null);
                void dropStory(event.dataTransfer.getData("text/plain"), column.status);
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">{column.title}</h3>
                <Badge tone="neutral">{columnStories.length}</Badge>
              </div>

              <div className="space-y-3">
                {columnStories.map((story) => (
                  <Card
                    key={story.id}
                    draggable={!readOnly}
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", story.id)}
                    className={`cursor-grab space-y-1 p-3 ${readOnly ? "cursor-default opacity-90" : ""}`}
                  >
                    <p className="font-medium text-slate-900">{story.title}</p>
                    <p className="text-sm text-slate-500">{story.featureName}</p>
                    <p className="text-xs text-slate-600">
                      SP: {story.storyPoints ?? "-"} | Dias: {story.estimatedDays ?? "-"}
                    </p>
                    {leakageByStory[story.id]?.map((event) => (
                      <p key={event.originSprintName} className="text-xs font-medium text-amber-700">
                        Vazou da Sprint {event.originSprintName}
                      </p>
                    ))}
                  </Card>
                ))}
                {columnStories.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                    No stories
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
