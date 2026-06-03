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
  const leakage = storyIds.length > 0
    ? await prisma.leakageHistory.findMany({
        where: { storyId: { in: storyIds } },
        include: { originSprint: true },
        orderBy: { eventDate: "desc" }
      })
    : [];
  const nextSprint = await prisma.sprint.findFirst({
    where: {
      releaseId: sprint.releaseId,
      startDate: { gt: sprint.startDate }
    },
    orderBy: { startDate: "asc" }
  });
  const releaseSprintCount = await prisma.sprint.count({ where: { releaseId: sprint.releaseId } });
  const activeStories = stories.filter((story) => story.status !== StoryStatus.CANCELLED);
  const closureInfo = {
    finishedCount: activeStories.filter((story) => story.status === StoryStatus.DONE).length,
    unfinishedCount: activeStories.filter((story) => story.status !== StoryStatus.DONE).length,
    destinationSprintName: nextSprint?.name ?? `Sprint ${releaseSprintCount + 1}`,
    hasNextSprint: Boolean(nextSprint)
  };

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
      <SprintDetail sprint={sprintView} summary={summary} warnings={warnings} closureInfo={closureInfo} />
      <SprintBoard
        sprintId={sprint.id}
        releaseId={sprint.releaseId}
        readOnly={sprint.status === "CLOSED"}
        leakage={leakage.map(
          (event): LeakageEvent => ({
            storyId: event.storyId,
            originSprintName: event.originSprint.name
          })
        )}
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
