export type SprintPlanningSummary = {
  plannedEffortDays: number;
  capacityDays: number | null;
  remainingCapacityDays: number | null;
  occupancyPercentage: number | null;
  riskLabel: string;
};

import { prisma } from "@/lib/db";
import { StoryStatus } from "@prisma/client";

/**
 * Returns current planned effort for a sprint. Capacity remains a Phase 4 hook.
 */
export async function getSprintPlanningSummary(sprintId: string): Promise<SprintPlanningSummary> {
  const stories = await prisma.story.findMany({
    where: {
      currentSprintId: sprintId,
      status: { not: StoryStatus.CANCELLED }
    },
    select: { estimatedDays: true }
  });

  return {
    plannedEffortDays: stories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0),
    capacityDays: null,
    remainingCapacityDays: null,
    occupancyPercentage: null,
    riskLabel: "Pending capacity"
  };
}

/**
 * Recalculates sprint planning summary after date/goal/story edits.
 * Capacity is still the explicit Phase 4 integration hook.
 */
export async function recalculateSprintPlanningSummary(sprintId: string): Promise<SprintPlanningSummary> {
  return getSprintPlanningSummary(sprintId);
}
