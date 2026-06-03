import { FeatureLifecycleStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { calculateFeatureSummary } from "@/lib/features";
import { prisma } from "@/lib/db";

export type TimelineSprint = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isFinished: boolean;
};

export type TimelineFeature = {
  id: string;
  name: string;
  startSprintId: string | null;
  endSprintId: string | null;
  startIndex: number | null;
  endIndex: number | null;
  activeSprintIds: string[];
  inactiveGaps: number[];
  completionProgress: number;
  isFinished: boolean;
};

export type TimelineData = {
  sprints: TimelineSprint[];
  features: TimelineFeature[];
  leakedSprints: string[];
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function buildTimelineData(releaseId: string): Promise<TimelineData> {
  const [sprints, features, leakage] = await Promise.all([
    prisma.sprint.findMany({
      where: { releaseId },
      orderBy: { startDate: "asc" }
    }),
    prisma.feature.findMany({
      where: { releaseId, lifecycleStatus: FeatureLifecycleStatus.ACTIVE },
      include: {
        stories: {
          include: { currentSprint: true },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.leakageHistory.findMany({
      where: { originSprint: { releaseId } },
      select: { originSprintId: true },
      distinct: ["originSprintId"]
    })
  ]);

  const sprintIndex = new Map(sprints.map((sprint, index) => [sprint.id, index]));
  const timelineSprints = sprints.map((sprint) => ({
    id: sprint.id,
    name: sprint.name,
    startDate: dateOnly(sprint.startDate),
    endDate: dateOnly(sprint.endDate),
    status: sprint.status,
    isFinished: sprint.status === SprintStatus.CLOSED
  }));

  const timelineFeatures = features.map((feature) => {
    const scopedStories = feature.stories.filter((story) => story.status !== StoryStatus.CANCELLED);
    const activeSprintIds = Array.from(
      new Set(
        scopedStories
          .map((story) => story.currentSprintId)
          .filter((id): id is string => typeof id === "string" && sprintIndex.has(id))
      )
    ).sort((left, right) => sprintIndex.get(left)! - sprintIndex.get(right)!);

    const startIndex = activeSprintIds.length > 0 ? sprintIndex.get(activeSprintIds[0])! : null;
    const endIndex =
      activeSprintIds.length > 0 ? sprintIndex.get(activeSprintIds[activeSprintIds.length - 1])! : null;
    const activeIndexSet = new Set(activeSprintIds.map((id) => sprintIndex.get(id)!));
    const inactiveGaps =
      startIndex === null || endIndex === null
        ? []
        : Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => startIndex + offset).filter(
            (index) => !activeIndexSet.has(index)
          );
    const summary = calculateFeatureSummary(feature.stories);

    return {
      id: feature.id,
      name: feature.name,
      startSprintId: startIndex === null ? null : sprints[startIndex].id,
      endSprintId: endIndex === null ? null : sprints[endIndex].id,
      startIndex,
      endIndex,
      activeSprintIds,
      inactiveGaps,
      completionProgress: summary.progressPercentage,
      isFinished: scopedStories.length > 0 && scopedStories.every((story) => story.status === StoryStatus.DONE)
    };
  });

  return {
    sprints: timelineSprints,
    features: timelineFeatures,
    leakedSprints: leakage.map((item) => item.originSprintId)
  };
}
