import { FeatureLifecycleStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDashboardData } from "@/lib/dashboard";

export type ReleaseAlert = {
  type:
    | "SPRINT_OVER_CAPACITY"
    | "RELEASE_OVER_CAPACITY"
    | "FEATURE_WITHOUT_STORIES"
    | "STORY_WITHOUT_ESTIMATE"
    | "LEAKED_STORIES"
    | "SPRINT_WITHOUT_GOAL"
    | "EMPTY_SPRINT";
  severity: "info" | "warning" | "danger";
  message: string;
  link?: string;
};

export async function detectAlerts(releaseId: string): Promise<ReleaseAlert[]> {
  const dashboard = await getDashboardData(releaseId);
  const alerts: ReleaseAlert[] = [];

  for (const sprint of dashboard.sprints) {
    if (sprint.overCapacity) {
      alerts.push({
        type: "SPRINT_OVER_CAPACITY",
        severity: "warning",
        message: `${sprint.name} is over capacity by ${Math.abs(sprint.remainingCapacityDays).toFixed(1)} days.`,
        link: `/sprints/${sprint.id}`
      });
    }
  }

  if (dashboard.plannedEffortDays > dashboard.totalCapacityDays) {
    alerts.push({
      type: "RELEASE_OVER_CAPACITY",
      severity: "danger",
      message: `${dashboard.release.name} is over capacity by ${Math.abs(dashboard.remainingCapacityDays).toFixed(1)} days.`,
      link: `/releases/${dashboard.release.id}`
    });
  }

  const features = await prisma.feature.findMany({
    where: { releaseId, lifecycleStatus: FeatureLifecycleStatus.ACTIVE },
    include: {
      stories: {
        where: { status: { not: StoryStatus.CANCELLED } },
        select: { id: true, estimatedDays: true }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  for (const feature of features.filter((feature) => feature.stories.length === 0)) {
    alerts.push({
      type: "FEATURE_WITHOUT_STORIES",
      severity: "info",
      message: `${feature.name} has no active stories.`,
      link: `/features/${feature.id}`
    });
  }

  const storiesWithoutEstimates = await prisma.story.count({
    where: {
      status: { not: StoryStatus.CANCELLED },
      feature: { releaseId },
      OR: [{ estimatedDays: null }, { estimatedDays: 0 }]
    }
  });
  if (storiesWithoutEstimates > 0) {
    alerts.push({
      type: "STORY_WITHOUT_ESTIMATE",
      severity: "info",
      message: `${storiesWithoutEstimates} active stories are missing estimated days.`,
      link: "/backlog"
    });
  }

  if (dashboard.leakedStoryCount > 0) {
    alerts.push({
      type: "LEAKED_STORIES",
      severity: "warning",
      message: `${dashboard.leakedStoryCount} stories have leaked from earlier sprints.`,
      link: "/reports"
    });
  }

  for (const sprint of dashboard.sprints) {
    if (!sprint.goal?.trim()) {
      alerts.push({
        type: "SPRINT_WITHOUT_GOAL",
        severity: "info",
        message: `${sprint.name} has no sprint goal.`,
        link: `/sprints/${sprint.id}`
      });
    }

    if (
      (sprint.status === SprintStatus.PLANNED || sprint.status === SprintStatus.IN_PROGRESS) &&
      sprint.plannedEffortDays === 0
    ) {
      alerts.push({
        type: "EMPTY_SPRINT",
        severity: "info",
        message: `${sprint.name} has no planned stories.`,
        link: `/sprints/${sprint.id}`
      });
    }
  }

  return alerts.sort((left, right) => severityRank(right.severity) - severityRank(left.severity));
}

function severityRank(severity: ReleaseAlert["severity"]): number {
  return { info: 1, warning: 2, danger: 3 }[severity];
}
