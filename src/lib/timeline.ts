import { FeatureLifecycleStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { calculateFeatureSummary } from "@/lib/features";
import { countBusinessDaysInRange } from "@/lib/date-utils";
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

export type TimelineImpediment = {
  id: string;
  title: string;
  status: string;
  reportedDate: string;
  resolutionDate: string | null;
  affectedStoryCount: number;
  estimatedDays: number;
  blockedBusinessDays: number;
  affectedSprintIds: string[];
  startIndex: number | null;
  endIndex: number | null;
  impactText: string;
};

export type TimelineData = {
  sprints: TimelineSprint[];
  features: TimelineFeature[];
  leakedSprints: string[];
  impediments: TimelineImpediment[];
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function buildTimelineData(releaseId: string): Promise<TimelineData> {
  const [sprints, features, leakage, impediments] = await Promise.all([
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
    }),
    prisma.impediment.findMany({
      where: {
        affectedStories: {
          some: {
            feature: { releaseId }
          }
        }
      },
      include: {
        affectedStories: {
          include: { feature: true, currentSprint: true },
          orderBy: { title: "asc" }
        }
      },
      orderBy: [{ status: "asc" }, { reportedDate: "desc" }, { createdAt: "desc" }]
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

  const timelineImpediments = impediments.map((impediment) => {
    const releaseStories = impediment.affectedStories.filter((story) => story.feature.releaseId === releaseId);
    const affectedSprintIds = Array.from(
      new Set(
        releaseStories
          .map((story) => story.currentSprintId)
          .filter((id): id is string => typeof id === "string" && sprintIndex.has(id))
      )
    ).sort((left, right) => sprintIndex.get(left)! - sprintIndex.get(right)!);
    const startIndex = affectedSprintIds.length > 0 ? sprintIndex.get(affectedSprintIds[0])! : null;
    const endIndex =
      affectedSprintIds.length > 0 ? sprintIndex.get(affectedSprintIds[affectedSprintIds.length - 1])! : null;
    const estimatedDays = releaseStories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);
    const blockedBusinessDays = countBusinessDaysInRange(
      impediment.reportedDate,
      impediment.resolutionDate ?? new Date()
    );
    const resolutionLabel = impediment.resolutionDate ? `resolved ${dateOnly(impediment.resolutionDate)}` : "open";

    return {
      id: impediment.id,
      title: impediment.title,
      status: impediment.status,
      reportedDate: dateOnly(impediment.reportedDate),
      resolutionDate: impediment.resolutionDate ? dateOnly(impediment.resolutionDate) : null,
      affectedStoryCount: releaseStories.length,
      estimatedDays,
      blockedBusinessDays,
      affectedSprintIds,
      startIndex,
      endIndex,
      impactText: `${impediment.title} (${resolutionLabel}) - ${releaseStories.length} stories, ${estimatedDays}d estimated, ${blockedBusinessDays} blocked business days`
    };
  });

  return {
    sprints: timelineSprints,
    features: timelineFeatures,
    leakedSprints: leakage.map((item) => item.originSprintId),
    impediments: timelineImpediments
  };
}
