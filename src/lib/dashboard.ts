import { FeatureLifecycleStatus, StoryStatus } from "@prisma/client";
import { calculateSprintCapacity, countBusinessDaysInRange } from "@/lib/capacity";
import { prisma } from "@/lib/db";
import { calculateReleaseProgress, calculateSprintProgress } from "@/lib/progress";

export type DashboardSprintRow = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string;
  endDate: string;
  period: string;
  grossCapacityDays: number;
  netCapacityDays: number;
  plannedEffortDays: number;
  remainingCapacityDays: number;
  occupancyPercentage: number;
  progressPercentage: number;
  overCapacity: boolean;
};

export type DashboardData = {
  release: {
    id: string;
    name: string;
    objective: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  progress: number;
  totalCapacityDays: number;
  plannedEffortDays: number;
  remainingCapacityDays: number;
  risk: "On track" | "Over capacity";
  featureCount: number;
  storyCount: number;
  finishedStoryCount: number;
  leakedStoryCount: number;
  sprints: DashboardSprintRow[];
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function getSprintDashboardRows(releaseId: string): Promise<DashboardSprintRow[]> {
  const sprints = await prisma.sprint.findMany({
    where: { releaseId },
    orderBy: { startDate: "asc" },
    include: {
      stories: {
        where: { status: { not: StoryStatus.CANCELLED } },
        select: { estimatedDays: true }
      }
    }
  });

  return Promise.all(
    sprints.map(async (sprint) => {
      const [capacity, progress] = await Promise.all([
        calculateSprintCapacity(sprint.id),
        calculateSprintProgress(sprint.id)
      ]);
      const plannedEffortDays = sprint.stories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);
      const remainingCapacityDays = capacity.netCapacityDays - plannedEffortDays;
      const occupancyPercentage =
        capacity.netCapacityDays > 0 ? (plannedEffortDays / capacity.netCapacityDays) * 100 : 0;

      return {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        status: sprint.status,
        startDate: dateOnly(sprint.startDate),
        endDate: dateOnly(sprint.endDate),
        period: `${dateOnly(sprint.startDate)} - ${dateOnly(sprint.endDate)} (${countBusinessDaysInRange(
          sprint.startDate,
          sprint.endDate
        )} dias úteis)`,
        grossCapacityDays: round(capacity.grossCapacityDays),
        netCapacityDays: round(capacity.netCapacityDays),
        plannedEffortDays: round(plannedEffortDays),
        remainingCapacityDays: round(remainingCapacityDays),
        occupancyPercentage: round(occupancyPercentage),
        progressPercentage: round(progress * 100),
        overCapacity: plannedEffortDays > capacity.netCapacityDays
      };
    })
  );
}

export async function getDashboardData(releaseId: string): Promise<DashboardData> {
  const release = await prisma.release.findUnique({ where: { id: releaseId } });
  if (!release) {
    throw new Error("Release not found");
  }

  const [sprints, progressRatio, featureCount, stories, leakage] = await Promise.all([
    getSprintDashboardRows(releaseId),
    calculateReleaseProgress(releaseId),
    prisma.feature.count({
      where: { releaseId, lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
    }),
    prisma.story.findMany({
      where: {
        status: { not: StoryStatus.CANCELLED },
        feature: { releaseId }
      },
      select: { id: true, status: true }
    }),
    prisma.leakageHistory.findMany({
      where: { originSprint: { releaseId } },
      distinct: ["storyId"],
      select: { storyId: true }
    })
  ]);

  const totalCapacityDays = round(sprints.reduce((sum, sprint) => sum + sprint.netCapacityDays, 0));
  const plannedEffortDays = round(sprints.reduce((sum, sprint) => sum + sprint.plannedEffortDays, 0));

  return {
    release: {
      id: release.id,
      name: release.name,
      objective: release.objective,
      status: release.status,
      startDate: dateOnly(release.startDate),
      endDate: dateOnly(release.endDate)
    },
    progress: Math.round(progressRatio * 100),
    totalCapacityDays,
    plannedEffortDays,
    remainingCapacityDays: round(totalCapacityDays - plannedEffortDays),
    risk: plannedEffortDays > totalCapacityDays ? "Over capacity" : "On track",
    featureCount,
    storyCount: stories.length,
    finishedStoryCount: stories.filter((story) => story.status === StoryStatus.DONE).length,
    leakedStoryCount: leakage.length,
    sprints
  };
}
