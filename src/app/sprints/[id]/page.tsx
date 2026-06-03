import { notFound } from "next/navigation";
import { getSprintDetails, detectSprintScheduleWarnings } from "@/lib/sprints";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { SprintDetail } from "@/features/sprints/sprint-detail";
import { SprintBoard, type LeakageEvent, type SprintStory } from "@/features/sprints/sprint-board";
import { prisma } from "@/lib/db";
import { StoryStatus } from "@prisma/client";

export default async function SprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sprint = await getSprintDetails(id);

  if (!sprint) {
    notFound();
  }

  const summary = await getSprintPlanningSummary(id);
  const stories = await prisma.story.findMany({
    where: {
      currentSprintId: id,
      status: { not: StoryStatus.CANCELLED }
    },
    include: { feature: true },
    orderBy: { createdAt: "asc" }
  });
  const storyIds = stories.map((story) => story.id);
  const leakage = storyIds.length > 0 && "leakageHistory" in prisma
    ? []
    : [];

  const warnings = await detectSprintScheduleWarnings(sprint.releaseId, {
    id: sprint.id,
    startDate: sprint.startDate,
    endDate: sprint.endDate
  });

  const sprintView = {
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal ?? "",
    startDate: sprint.startDate.toISOString().slice(0, 10),
    endDate: sprint.endDate.toISOString().slice(0, 10),
    status: sprint.status,
    releaseName: sprint.release.name,
    releaseId: sprint.releaseId
  };

  return (
    <div className="space-y-6">
      <SprintDetail sprint={sprintView} summary={summary} warnings={warnings} />
      <SprintBoard
        sprintId={sprint.id}
        releaseId={sprint.releaseId}
        readOnly={sprint.status === "CLOSED"}
        leakage={leakage as LeakageEvent[]}
        stories={stories.map(
          (story): SprintStory => ({
            id: story.id,
            title: story.title,
            featureName: story.feature.name,
            storyPoints: story.storyPoints,
            estimatedDays: story.estimatedDays,
            status:
              story.status === StoryStatus.IN_PROGRESS || story.status === StoryStatus.DONE
                ? story.status
                : StoryStatus.SPRINT_BACKLOG
          })
        )}
      />
    </div>
  );
}
