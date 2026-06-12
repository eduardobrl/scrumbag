import { StoryStatus } from "@prisma/client";

export type FeatureAllocationStory = {
  id: string;
  currentSprintId: string | null;
  estimatedDays: number | null;
  status: StoryStatus;
};

export type FeatureAllocationBaselineItem = {
  storyId: string;
  featureId: string | null;
  plannedSprintId: string | null;
  estimatedDays: number | null;
};

export type FeatureSprintAllocation = {
  sprintId: string;
  plannedDays: number;
  actualDays: number;
  plannedPercentage: number;
  actualPercentage: number;
};

export type FeatureSprintAllocationSummary = {
  hasPlanBaseline: boolean;
  plannedTotalDays: number;
  actualTotalDays: number;
  allocations: FeatureSprintAllocation[];
  plannedSprintIds: string[];
  actualSprintIds: string[];
};

function roundDays(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundPercentage(value: number): number {
  return Math.round(value);
}

function addDays(bucket: Map<string, number>, sprintId: string | null, days: number) {
  if (!sprintId) {
    return;
  }

  bucket.set(sprintId, (bucket.get(sprintId) ?? 0) + days);
}

export function calculateFeatureSprintAllocation({
  featureId,
  stories,
  baselineItems,
  sprintIds
}: {
  featureId: string;
  stories: FeatureAllocationStory[];
  baselineItems: FeatureAllocationBaselineItem[] | null;
  sprintIds: string[];
}): FeatureSprintAllocationSummary {
  const storyIds = new Set(stories.map((story) => story.id));
  const currentStories = stories.filter((story) => story.status !== StoryStatus.CANCELLED);
  const actualBySprint = new Map<string, number>();

  for (const story of currentStories) {
    addDays(actualBySprint, story.currentSprintId, story.estimatedDays ?? 0);
  }

  const actualTotalDays = currentStories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);
  const matchingBaselineItems =
    baselineItems?.filter((item) => item.featureId === featureId || (item.featureId === null && storyIds.has(item.storyId))) ?? [];
  const hasPlanBaseline = matchingBaselineItems.some((item) => item.featureId === featureId && item.plannedSprintId);
  const plannedBySprint = new Map<string, number>();
  const plannedTotalDays = hasPlanBaseline
    ? matchingBaselineItems.reduce((sum, item) => sum + (item.estimatedDays ?? 0), 0)
    : actualTotalDays;

  if (hasPlanBaseline) {
    for (const item of matchingBaselineItems) {
      addDays(plannedBySprint, item.plannedSprintId, item.estimatedDays ?? 0);
    }
  } else {
    for (const [sprintId, days] of actualBySprint) {
      plannedBySprint.set(sprintId, days);
    }
  }

  const allocations = sprintIds.map((sprintId) => {
    const plannedDays = plannedBySprint.get(sprintId) ?? 0;
    const actualDays = actualBySprint.get(sprintId) ?? 0;

    return {
      sprintId,
      plannedDays: roundDays(plannedDays),
      actualDays: roundDays(actualDays),
      plannedPercentage: plannedTotalDays > 0 ? roundPercentage((plannedDays / plannedTotalDays) * 100) : 0,
      actualPercentage: actualTotalDays > 0 ? roundPercentage((actualDays / actualTotalDays) * 100) : 0
    };
  });

  return {
    hasPlanBaseline,
    plannedTotalDays: roundDays(plannedTotalDays),
    actualTotalDays: roundDays(actualTotalDays),
    allocations,
    plannedSprintIds: allocations.filter((item) => item.plannedDays > 0).map((item) => item.sprintId),
    actualSprintIds: allocations.filter((item) => item.actualDays > 0).map((item) => item.sprintId)
  };
}
