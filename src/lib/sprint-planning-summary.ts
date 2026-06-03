export type SprintPlanningSummary = {
  plannedEffortDays: number;
  capacityDays: number | null;
  remainingCapacityDays: number | null;
  occupancyPercentage: number | null;
  riskLabel: string;
  grossCapacityDays: number;
  grossCapacityHours: number;
  netCapacityDays: number;
  netCapacityHours: number;
};

import { prisma } from "@/lib/db";
import { calculateSprintCapacity } from "@/lib/capacity";
import { StoryStatus } from "@prisma/client";

export async function getSprintPlanningSummary(sprintId: string): Promise<SprintPlanningSummary> {
  const stories = await prisma.story.findMany({
    where: {
      currentSprintId: sprintId,
      status: { not: StoryStatus.CANCELLED }
    },
    select: { estimatedDays: true }
  });
  const capacity = await calculateSprintCapacity(sprintId);
  const plannedEffortDays = stories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);
  const capacityDays = capacity.netCapacityDays;
  const remainingCapacityDays = capacityDays - plannedEffortDays;
  const occupancyPercentage = capacityDays > 0 ? (plannedEffortDays / capacityDays) * 100 : null;

  return {
    plannedEffortDays,
    capacityDays,
    remainingCapacityDays,
    occupancyPercentage,
    riskLabel: getRiskLabel(plannedEffortDays, capacityDays, occupancyPercentage),
    grossCapacityDays: capacity.grossCapacityDays,
    grossCapacityHours: capacity.grossCapacityHours,
    netCapacityDays: capacity.netCapacityDays,
    netCapacityHours: capacity.netCapacityHours
  };
}

export async function recalculateSprintPlanningSummary(sprintId: string): Promise<SprintPlanningSummary> {
  return getSprintPlanningSummary(sprintId);
}

function getRiskLabel(plannedEffortDays: number, netCapacityDays: number, occupancyPercentage: number | null): string {
  if (plannedEffortDays > netCapacityDays) {
    return `Over capacity by ${(plannedEffortDays - netCapacityDays).toFixed(1)} days`;
  }
  if (occupancyPercentage !== null && occupancyPercentage >= 90) {
    return "High risk";
  }
  if (occupancyPercentage !== null && occupancyPercentage >= 75) {
    return "Medium risk";
  }
  return "On track";
}
