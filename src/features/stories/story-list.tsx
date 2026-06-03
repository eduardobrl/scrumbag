"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type StoryListItem = {
  id: string;
  title: string;
  status: string;
  storyPoints: number | null;
  estimatedDays: number | null;
  currentSprintId: string | null;
  currentSprintName: string;
};

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  SPRINT_BACKLOG: "Sprint backlog",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled"
};

export function StoryList({ stories }: { stories: StoryListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function patchStory(id: string, action: "cancel" | "backlog") {
    const response = await fetch(action === "cancel" ? `/api/stories/${id}` : `/api/stories/${id}/backlog`, {
      method: action === "cancel" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "cancel" ? JSON.stringify({ action: "cancel" }) : undefined
    });

    if (response.ok) {
      startTransition(() => router.refresh());
    }
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 text-center">
        <p className="text-sm text-slate-600">This feature has no stories yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">SP</th>
            <th className="px-3 py-2">Days</th>
            <th className="px-3 py-2">Sprint</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {stories.map((story) => (
            <tr key={story.id}>
              <td className="px-3 py-3 font-medium">{story.title}</td>
              <td className="px-3 py-3">
                <Badge tone={story.status === "CANCELLED" ? "danger" : story.status === "DONE" ? "success" : "neutral"}>
                  {STATUS_LABEL[story.status] ?? story.status}
                </Badge>
              </td>
              <td className="px-3 py-3">{story.storyPoints ?? "-"}</td>
              <td className="px-3 py-3">{story.estimatedDays ?? "-"}d</td>
              <td className="px-3 py-3">{story.currentSprintName}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" className="h-8 w-8 p-0" asChild>
                    <Link href={`/stories/${story.id}/edit`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Edit story</span>
                    </Link>
                  </Button>
                  {story.currentSprintId && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      disabled={isPending}
                      onClick={() => patchStory(story.id, "backlog")}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Move to backlog</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled={isPending || story.status === "CANCELLED"}
                    onClick={() => patchStory(story.id, "cancel")}
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Cancel story</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
