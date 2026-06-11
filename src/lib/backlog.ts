import { prisma } from "@/lib/db";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { StoryStatus } from "@prisma/client";

export type BacklogFilters = {
  releaseId?: string;
  featureId?: string;
  status?: StoryStatus | "ALL";
  q?: string;
  unplannedOnly?: boolean;
  includeCanceled?: boolean;
};

export async function listBacklogStories(filters: BacklogFilters = {}) {
  const includeCanceled = filters.includeCanceled ?? false;
  const unplannedOnly = filters.unplannedOnly ?? true;

  return prisma.story.findMany({
    where: {
      ...(unplannedOnly ? { currentSprintId: null } : {}),
      ...(filters.featureId ? { featureId: filters.featureId } : {}),
      ...(filters.releaseId ? { feature: { releaseId: filters.releaseId } } : {}),
      ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(!includeCanceled ? { status: { not: StoryStatus.CANCELLED } } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q } },
              { description: { contains: filters.q } },
              { acceptanceCriteria: { contains: filters.q } }
            ]
          }
        : {})
    },
    include: {
      feature: { include: { release: true } },
      currentSprint: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function previewStorySprintPlan(storyId: string, sprintId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { feature: true }
  });
  if (!story) {
    return { ok: false as const, errors: { storyId: "Story not found" } };
  }
  if (story.status === StoryStatus.CANCELLED) {
    return { ok: false as const, errors: { storyId: "Canceled stories cannot be planned" } };
  }

  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) {
    return { ok: false as const, errors: { sprintId: "Sprint not found" } };
  }
  if (!story.feature.releaseId) {
    return { ok: false as const, errors: { sprintId: "Feature must belong to a release before planning stories" } };
  }
  if (sprint.releaseId !== story.feature.releaseId) {
    return { ok: false as const, errors: { sprintId: "Sprint must belong to the story release" } };
  }

  const summary = await getSprintPlanningSummary(sprintId);
  const storyEstimatedDays = story.estimatedDays ?? 0;

  return {
    ok: true as const,
    data: {
      storyId,
      sprintId,
      storyTitle: story.title,
      featureName: story.feature.name,
      storyPoints: story.storyPoints,
      storyEstimatedDays,
      currentPlannedEffortDays: summary.plannedEffortDays,
      afterAddPlannedEffortDays:
        story.currentSprintId === sprintId
          ? summary.plannedEffortDays
          : summary.plannedEffortDays + storyEstimatedDays,
      capacityDays: summary.capacityDays,
      riskLabel:
        summary.capacityDays !== null &&
        summary.plannedEffortDays + storyEstimatedDays > summary.capacityDays
          ? `Over capacity by ${(summary.plannedEffortDays + storyEstimatedDays - summary.capacityDays).toFixed(1)} days`
          : summary.riskLabel
    }
  };
}

export async function planStoryIntoSprint(storyId: string, sprintId: string) {
  const preview = await previewStorySprintPlan(storyId, sprintId);
  if (!preview.ok) {
    return preview;
  }

  const story = await prisma.story.update({
    where: { id: storyId },
    data: {
      currentSprintId: sprintId,
      status: StoryStatus.SPRINT_BACKLOG
    },
    include: {
      feature: { include: { release: true } },
      currentSprint: true
    }
  });

  return { ok: true as const, data: story };
}

export async function moveStoryToBacklog(storyId: string) {
  const existing = await prisma.story.findUnique({ where: { id: storyId } });
  if (!existing) {
    return { ok: false as const, errors: { storyId: "Story not found" } };
  }

  const story = await prisma.story.update({
    where: { id: storyId },
    data: {
      currentSprintId: null,
      status: StoryStatus.BACKLOG
    },
    include: {
      feature: { include: { release: true } },
      currentSprint: true
    }
  });

  return { ok: true as const, data: story };
}
