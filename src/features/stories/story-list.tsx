"use client";

import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Pencil, RotateCcw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

export function StoryList({ stories }: { stories: StoryListItem[] }) {
  const router = useRouter();
  const t = useTranslations("stories");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
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
        <p className="text-sm text-slate-600">{t("noStories")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">{t("title")}</th>
            <th className="px-3 py-2">{t("status")}</th>
            <th className="px-3 py-2">{t("sp")}</th>
            <th className="px-3 py-2">{t("days")}</th>
            <th className="px-3 py-2">{t("sprint")}</th>
            <th className="px-3 py-2">{tCommon("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {stories.map((story) => (
            <tr key={story.id}>
              <td className="px-3 py-3 font-medium">{story.title}</td>
              <td className="px-3 py-3">
                <Badge tone={story.status === "CANCELLED" ? "danger" : story.status === "DONE" ? "success" : "neutral"}>
                  {tStatus(story.status)}
                </Badge>
              </td>
              <td className="px-3 py-3">{story.storyPoints ?? "-"}</td>
              <td className="px-3 py-3">{story.estimatedDays ?? "-"}d</td>
              <td className="px-3 py-3">{story.currentSprintName}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <IconButton label={t("edit")} href={`/stories/${story.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  {story.currentSprintId && (
                    <IconButton
                      label={t("moveToBacklog")}
                      disabled={isPending}
                      onClick={() => patchStory(story.id, "backlog")}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  )}
                  <IconButton
                    label={t("cancel")}
                    disabled={isPending || story.status === "CANCELLED"}
                    onClick={() => patchStory(story.id, "cancel")}
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
