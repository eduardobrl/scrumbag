import { FeatureLifecycleStatus, StoryStatus } from "@prisma/client";
import { calculateFeatureSummary } from "@/lib/features";
import {
  calculateFeatureSprintAllocation,
  type FeatureAllocationBaselineItem,
  type FeatureSprintAllocation
} from "@/lib/feature-sprint-allocation";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";

export type AnnualTimelineSprint = {
  index: number;
  id: string;
  releaseId: string;
  name: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type AnnualTimelineReleaseBand = {
  releaseId: string;
  label: string;
  status: string;
  startIndex: number;
  endIndex: number;
  sprintCount: number;
  startDate: string;
  endDate: string;
};

export type AnnualReleaseSummary = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  featureCount: number;
  storyCount: number;
  estimatedDays: number;
  completionPercentage: number;
  sprintCount: number;
  totalCapacityDays: number;
  plannedEffortDays: number;
  remainingCapacityDays: number;
};

export type AnnualTimelineFeatureStatus = "ACTIVE" | "FINISHED" | "CANCELLED";

export type AnnualTimelineSprintAllocation = FeatureSprintAllocation & {
  sprintIndex: number;
};

export type AnnualTimelineFeature = {
  id: string;
  releaseId: string | null;
  name: string;
  status: AnnualTimelineFeatureStatus;
  storyCount: number;
  estimatedDays: number;
  completionPercentage: number;
  startIndex: number | null;
  endIndex: number | null;
  activeSprintIndexes: number[];
  plannedSprintIndexes: number[];
  inactiveGaps: number[];
  hasPlanBaseline: boolean;
  sprintAllocations: AnnualTimelineSprintAllocation[];
};

export type AnnualTimelineRelease = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  summary: AnnualReleaseSummary;
  features: AnnualTimelineFeature[];
};

export type AnnualTimelineData = {
  year: number;
  sprints: AnnualTimelineSprint[];
  releaseBands: AnnualTimelineReleaseBand[];
  releases: AnnualTimelineRelease[];
  orphanFeatures: AnnualTimelineFeature[];
  summaries: AnnualReleaseSummary[];
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function yearStart(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

function yearEnd(year: number): Date {
  return new Date(Date.UTC(year, 11, 31));
}

export function releaseOverlapsYear(
  release: { startDate: Date; endDate: Date },
  year: number
): boolean {
  return release.startDate <= yearEnd(year) && release.endDate >= yearStart(year);
}

function sprintShortLabel(name: string, index: number): string {
  const trimmed = name.trim();
  const numericSuffix = trimmed.match(/(\d+)$/)?.[1];

  return numericSuffix ? `S${numericSuffix}` : `S${index + 1}`;
}

async function buildReleaseSummary(releaseId: string): Promise<AnnualReleaseSummary> {
  const [data, stories] = await Promise.all([
    getDashboardData(releaseId),
    prisma.story.findMany({
      where: {
        status: { not: StoryStatus.CANCELLED },
        feature: { releaseId }
      },
      select: { estimatedDays: true }
    })
  ]);

  return {
    id: data.release.id,
    name: data.release.name,
    status: data.release.status,
    startDate: data.release.startDate,
    endDate: data.release.endDate,
    featureCount: data.featureCount,
    storyCount: data.storyCount,
    estimatedDays: round(stories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0)),
    completionPercentage: data.progress,
    sprintCount: data.sprints.length,
    totalCapacityDays: data.totalCapacityDays,
    plannedEffortDays: data.plannedEffortDays,
    remainingCapacityDays: data.remainingCapacityDays
  };
}

function deriveFeatureStatus(feature: {
  lifecycleStatus: FeatureLifecycleStatus;
  stories: Array<{ status: StoryStatus }>;
}): AnnualTimelineFeatureStatus {
  if (feature.lifecycleStatus === FeatureLifecycleStatus.CANCELLED) {
    return "CANCELLED";
  }

  const scopedStories = feature.stories.filter((story) => story.status !== StoryStatus.CANCELLED);
  if (scopedStories.length > 0 && scopedStories.every((story) => story.status === StoryStatus.DONE)) {
    return "FINISHED";
  }

  return "ACTIVE";
}

function deriveFeatureSprintIndexes(
  stories: Array<{
    status: StoryStatus;
    currentSprintId?: string | null;
    currentSprint: { id: string } | null;
  }>,
  sprintIndexById: Map<string, number>
): number[] {
  const indexes = new Set<number>();

  for (const story of stories) {
    if (story.status === StoryStatus.CANCELLED || !story.currentSprint) {
      continue;
    }

    const sprintIndex = sprintIndexById.get(story.currentSprint.id);
    if (sprintIndex !== undefined) {
      indexes.add(sprintIndex);
    }
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

async function buildReleaseFeatures(
  releaseId: string,
  sprintIndexById: Map<string, number>,
  sprintIds: string[],
  baselineItems: FeatureAllocationBaselineItem[] | null
): Promise<AnnualTimelineFeature[]> {
  const features = await prisma.feature.findMany({
    where: { releaseId },
    include: {
      stories: {
        include: { currentSprint: true },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: [{ lifecycleStatus: "asc" }, { createdAt: "asc" }]
  });

  return features.map((feature) => toAnnualTimelineFeature(feature, sprintIndexById, sprintIds, baselineItems));
}

async function buildOrphanFeatures(sprintIndexById: Map<string, number>): Promise<AnnualTimelineFeature[]> {
  const features = await prisma.feature.findMany({
    where: { releaseId: null },
    include: {
      stories: {
        include: { currentSprint: true },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: [{ lifecycleStatus: "asc" }, { createdAt: "asc" }]
  });

  return features.map((feature) => toAnnualTimelineFeature(feature, sprintIndexById, [], null));
}

function toAnnualTimelineFeature(
  feature: {
    id: string;
    releaseId: string | null;
    name: string;
    lifecycleStatus: FeatureLifecycleStatus;
    stories: Array<{
      id: string;
      currentSprintId: string | null;
      storyPoints: number | null;
      estimatedDays: number | null;
      status: StoryStatus;
      currentSprint: { id: string; name: string; startDate: Date; endDate: Date } | null;
    }>;
  },
  sprintIndexById: Map<string, number>,
  sprintIds: string[],
  baselineItems: FeatureAllocationBaselineItem[] | null
): AnnualTimelineFeature {
  const summary = calculateFeatureSummary(feature.stories);
  const allocation = calculateFeatureSprintAllocation({
    featureId: feature.id,
    stories: feature.stories,
    baselineItems,
    sprintIds
  });
  const activeSprintIndexes = deriveFeatureSprintIndexes(feature.stories, sprintIndexById);
  const plannedSprintIndexes = allocation.plannedSprintIds
    .map((sprintId) => sprintIndexById.get(sprintId))
    .filter((index): index is number => index !== undefined);
  const visibleSprintIndexes = Array.from(new Set([...activeSprintIndexes, ...plannedSprintIndexes])).sort(
    (left, right) => left - right
  );
  const startIndex = visibleSprintIndexes.length > 0 ? visibleSprintIndexes[0] : null;
  const endIndex = visibleSprintIndexes.length > 0 ? visibleSprintIndexes[visibleSprintIndexes.length - 1] : null;
  const visibleSet = new Set(visibleSprintIndexes);
  const inactiveGaps =
    startIndex === null || endIndex === null
      ? []
      : Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => startIndex + offset).filter(
          (index) => !visibleSet.has(index)
        );

  return {
    id: feature.id,
    releaseId: feature.releaseId,
    name: feature.name,
    status: deriveFeatureStatus(feature),
    storyCount: summary.storyCount,
    estimatedDays: summary.totalEstimatedDays,
    completionPercentage: summary.progressPercentage,
    startIndex,
    endIndex,
    activeSprintIndexes,
    plannedSprintIndexes,
    inactiveGaps,
    hasPlanBaseline: allocation.hasPlanBaseline,
    sprintAllocations: allocation.allocations.flatMap((item) => {
      const sprintIndex = sprintIndexById.get(item.sprintId);
      return sprintIndex === undefined ? [] : [{ ...item, sprintIndex }];
    })
  };
}

export async function buildAnnualTimelineData(year: number): Promise<AnnualTimelineData> {
  const selectedYear = Number.isInteger(year) ? year : new Date().getUTCFullYear();
  const releases = await prisma.release.findMany({
    where: {
      startDate: { lte: yearEnd(selectedYear) },
      endDate: { gte: yearStart(selectedYear) }
    },
    include: {
      sprints: { orderBy: { startDate: "asc" } }
    },
    orderBy: { startDate: "asc" }
  });

  const sprints = releases.flatMap((release) =>
    release.sprints.map((sprint, releaseSprintIndex) => ({
      source: sprint,
      release,
      releaseSprintIndex
    }))
  );
  const timelineSprints: AnnualTimelineSprint[] = sprints.map(({ source, release, releaseSprintIndex }, index) => ({
    index,
    id: source.id,
    releaseId: release.id,
    name: source.name,
    label: source.name,
    shortLabel: sprintShortLabel(source.name, releaseSprintIndex),
    startDate: dateOnly(source.startDate),
    endDate: dateOnly(source.endDate),
    status: source.status
  }));
  const sprintIndexById = new Map(timelineSprints.map((sprint) => [sprint.id, sprint.index]));
  const releaseBands: AnnualTimelineReleaseBand[] = releases.flatMap((release) => {
    const indexes = release.sprints
      .map((sprint) => sprintIndexById.get(sprint.id))
      .filter((index): index is number => index !== undefined);

    if (indexes.length === 0) {
      return [];
    }

    return [
      {
        releaseId: release.id,
        label: release.name,
        status: release.status,
        startIndex: indexes[0],
        endIndex: indexes[indexes.length - 1],
        sprintCount: indexes.length,
        startDate: dateOnly(release.startDate),
        endDate: dateOnly(release.endDate)
      }
    ];
  });

  const [annualReleases, orphanFeatures] = await Promise.all([
    Promise.all(
      releases.map(async (release) => {
        const [summary, baseline] = await Promise.all([
          buildReleaseSummary(release.id),
          prisma.releaseEstimateBaseline.findUnique({
            where: { releaseId: release.id },
            include: { items: true }
          })
        ]);

        return {
          id: release.id,
          name: release.name,
          status: release.status,
          startDate: dateOnly(release.startDate),
          endDate: dateOnly(release.endDate),
          summary,
          features: await buildReleaseFeatures(
            release.id,
            sprintIndexById,
            release.sprints.map((sprint) => sprint.id),
            baseline?.items ?? null
          )
        };
      })
    ),
    buildOrphanFeatures(sprintIndexById)
  ]);

  return {
    year: selectedYear,
    sprints: timelineSprints,
    releaseBands,
    releases: annualReleases,
    orphanFeatures,
    summaries: annualReleases.map((release) => release.summary)
  };
}
