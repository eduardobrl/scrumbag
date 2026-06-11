import { ReleaseStatus, StoryStatus, type PrismaClient } from "@prisma/client";

export const ESTIMATE_CHANGE_FIELDS = ["storyPoints", "estimatedDays"] as const;

export type EstimateChangeField = (typeof ESTIMATE_CHANGE_FIELDS)[number];
export type EstimateDeltaTone = "neutral" | "success" | "warning" | "danger";

type EstimateChangeDatabase = Pick<PrismaClient, "estimateChange" | "releaseEstimateBaseline" | "story">;

export type StoryEstimateHistoryItem = {
  id: string;
  field: EstimateChangeField;
  oldValue: number | null;
  newValue: number | null;
  changeReason: string | null;
  timestamp: Date;
  tone: EstimateDeltaTone;
};

export type ReleaseEstimateDrift = {
  baseline: {
    storyPoints: number;
    estimatedDays: number;
  };
  current: {
    storyPoints: number;
    estimatedDays: number;
  };
  delta: {
    storyPoints: number;
    estimatedDays: number;
    storyPointsTone: EstimateDeltaTone;
    estimatedDaysTone: EstimateDeltaTone;
  };
  counts: {
    comparedStories: number;
    changedStories: number;
    cancelledSinceBaseline: number;
    addedAfterBaseline: number;
  };
};

function isEstimateChangeField(field: string): field is EstimateChangeField {
  return ESTIMATE_CHANGE_FIELDS.includes(field as EstimateChangeField);
}

function numberOrZero(value: number | null): number {
  return value ?? 0;
}

export function getEstimateDeltaTone(oldValue: number | null, newValue: number | null): EstimateDeltaTone {
  const oldNumber = numberOrZero(oldValue);
  const newNumber = numberOrZero(newValue);
  const delta = newNumber - oldNumber;

  if (delta < 0) {
    return "success";
  }

  if (delta === 0) {
    return "neutral";
  }

  if (oldNumber === 0 || delta / oldNumber > 0.2) {
    return "danger";
  }

  return "warning";
}

export function isPostGoLiveReleaseStatus(status?: string | null) {
  return status === ReleaseStatus.IN_PROGRESS || status === ReleaseStatus.CLOSED;
}

export async function getStoryEstimateHistory(database: EstimateChangeDatabase, storyId: string): Promise<StoryEstimateHistoryItem[]> {
  const changes = await database.estimateChange.findMany({
    where: {
      storyId,
      field: { in: [...ESTIMATE_CHANGE_FIELDS] }
    },
    orderBy: { timestamp: "asc" }
  });

  return changes
    .filter((change) => isEstimateChangeField(change.field))
    .map((change) => ({
      id: change.id,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue,
      changeReason: change.changeReason,
      timestamp: change.timestamp,
      tone: getEstimateDeltaTone(change.oldValue, change.newValue)
    }));
}

export async function getReleaseEstimateDrift(
  database: EstimateChangeDatabase,
  releaseId: string
): Promise<ReleaseEstimateDrift | null> {
  const baseline = await database.releaseEstimateBaseline.findUnique({
    where: { releaseId },
    include: {
      items: {
        orderBy: { storyId: "asc" }
      }
    }
  });

  if (!baseline) {
    return null;
  }

  const storyIds = baseline.items.map((item) => item.storyId);
  const currentStories = await database.story.findMany({
    where: { id: { in: storyIds } },
    select: {
      id: true,
      storyPoints: true,
      estimatedDays: true,
      status: true
    }
  });
  const currentById = new Map(currentStories.map((story) => [story.id, story]));

  const baselineTotals = baseline.items.reduce(
    (totals, item) => ({
      storyPoints: totals.storyPoints + numberOrZero(item.storyPoints),
      estimatedDays: totals.estimatedDays + numberOrZero(item.estimatedDays)
    }),
    { storyPoints: 0, estimatedDays: 0 }
  );

  const currentTotals = baseline.items.reduce(
    (totals, item) => {
      const story = currentById.get(item.storyId);
      return {
        storyPoints: totals.storyPoints + numberOrZero(story?.storyPoints ?? null),
        estimatedDays: totals.estimatedDays + numberOrZero(story?.estimatedDays ?? null)
      };
    },
    { storyPoints: 0, estimatedDays: 0 }
  );

  const changedStories = await database.estimateChange.findMany({
    where: {
      storyId: { in: storyIds },
      field: { in: [...ESTIMATE_CHANGE_FIELDS] }
    },
    distinct: ["storyId"],
    select: { storyId: true }
  });

  const addedAfterBaseline = await database.story.count({
    where: {
      feature: { releaseId },
      id: { notIn: storyIds },
      createdAt: { gt: baseline.capturedAt }
    }
  });

  const cancelledSinceBaseline = currentStories.filter((story) => story.status === StoryStatus.CANCELLED).length;

  return {
    baseline: baselineTotals,
    current: currentTotals,
    delta: {
      storyPoints: currentTotals.storyPoints - baselineTotals.storyPoints,
      estimatedDays: currentTotals.estimatedDays - baselineTotals.estimatedDays,
      storyPointsTone: getEstimateDeltaTone(baselineTotals.storyPoints, currentTotals.storyPoints),
      estimatedDaysTone: getEstimateDeltaTone(baselineTotals.estimatedDays, currentTotals.estimatedDays)
    },
    counts: {
      comparedStories: baseline.items.length,
      changedStories: changedStories.length,
      cancelledSinceBaseline,
      addedAfterBaseline
    }
  };
}
