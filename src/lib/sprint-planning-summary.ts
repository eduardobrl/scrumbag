export type SprintPlanningSummary = {
  plannedEffortDays: number;
  capacityDays: number | null;
  remainingCapacityDays: number | null;
  occupancyPercentage: number | null;
  riskLabel: string;
};

/**
 * Returns Phase 2 placeholder summary for a sprint.
 * Real capacity and effort calculations will be wired in Phase 4.
 */
export function getSprintPlanningSummary(_sprintId: string): SprintPlanningSummary {
  return {
    plannedEffortDays: 0,
    capacityDays: null,
    remainingCapacityDays: null,
    occupancyPercentage: null,
    riskLabel: "Pending capacity"
  };
}

/**
 * Recalculates sprint planning summary after date/goal edits.
 * Currently returns the same placeholder summary.
 * This is the explicit Phase 4 integration hook.
 */
export function recalculateSprintPlanningSummary(_sprintId: string): SprintPlanningSummary {
  // Phase 4: wire real capacity and planned effort here
  return getSprintPlanningSummary(_sprintId);
}
