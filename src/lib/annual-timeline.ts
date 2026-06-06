import { FeatureLifecycleStatus, StoryStatus } from "@prisma/client";
import { calculateFeatureSummary } from "@/lib/features";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";

export type AnnualTimelineMonth = {
  index: number;
  month: number;
  year: number;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  quarter: 1 | 2 | 3 | 4;
};

export type AnnualTimelineQuarter = {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  startIndex: number;
  endIndex: number;
  monthCount: number;
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

export type AnnualTimelineFeature = {
  id: string;
  releaseId: string;
  name: string;
  status: AnnualTimelineFeatureStatus;
  storyCount: number;
  estimatedDays: number;
  completionPercentage: number;
  startIndex: number | null;
  endIndex: number | null;
  activeMonthIndexes: number[];
  inactiveGaps: number[];
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
  months: AnnualTimelineMonth[];
  quarters: AnnualTimelineQuarter[];
  releases: AnnualTimelineRelease[];
  summaries: AnnualReleaseSummary[];
};

const MONTH_LABELS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function monthStart(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function monthEnd(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex + 1, 0));
}

function yearStart(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

function yearEnd(year: number): Date {
  return new Date(Date.UTC(year, 11, 31));
}

export function buildAnnualTimelineMonths(year: number): {
  months: AnnualTimelineMonth[];
  quarters: AnnualTimelineQuarter[];
} {
  const months = Array.from({ length: 12 }, (_, index) => {
    const quarter = (Math.floor(index / 3) + 1) as 1 | 2 | 3 | 4;

    return {
      index,
      month: index + 1,
      year,
      label: MONTH_LABELS_PT[index],
      shortLabel: MONTH_LABELS_PT[index],
      startDate: dateOnly(monthStart(year, index)),
      endDate: dateOnly(monthEnd(year, index)),
      quarter
    };
  });

  const quarters = [1, 2, 3, 4].map((quarter) => ({
    quarter: quarter as 1 | 2 | 3 | 4,
    label: `Q${quarter}`,
    startIndex: (quarter - 1) * 3,
    endIndex: quarter * 3 - 1,
    monthCount: 3
  }));

  return { months, quarters };
}

export function releaseOverlapsYear(
  release: { startDate: Date; endDate: Date },
  year: number
): boolean {
  return release.startDate <= yearEnd(year) && release.endDate >= yearStart(year);
}

export function dateToMonthIndex(date: Date, year: number): number | null {
  if (date < yearStart(year) || date > yearEnd(year)) {
    return null;
  }

  return date.getUTCMonth();
}

async function buildReleaseSummary(releaseId: string): Promise<AnnualReleaseSummary> {
  const data = await getDashboardData(releaseId);

  return {
    id: data.release.id,
    name: data.release.name,
    status: data.release.status,
    startDate: data.release.startDate,
    endDate: data.release.endDate,
    featureCount: data.featureCount,
    storyCount: data.storyCount,
    estimatedDays: round(
      data.sprints.reduce((sum, sprint) => sum + sprint.plannedEffortDays, 0)
    ),
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

function deriveFeatureMonthIndexes(
  stories: Array<{
    status: StoryStatus;
    currentSprint: { startDate: Date; endDate: Date } | null;
  }>,
  year: number
): number[] {
  const indexes = new Set<number>();

  for (const story of stories) {
    if (story.status === StoryStatus.CANCELLED || !story.currentSprint) {
      continue;
    }

    const start = Math.max(story.currentSprint.startDate.getUTCMonth(), 0);
    const end = Math.min(story.currentSprint.endDate.getUTCMonth(), 11);
    const storyStartYear = story.currentSprint.startDate.getUTCFullYear();
    const storyEndYear = story.currentSprint.endDate.getUTCFullYear();

    if (storyEndYear < year || storyStartYear > year) {
      continue;
    }

    const startIndex = storyStartYear < year ? 0 : start;
    const endIndex = storyEndYear > year ? 11 : end;

    for (let index = startIndex; index <= endIndex; index += 1) {
      indexes.add(index);
    }
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

async function buildReleaseFeatures(releaseId: string, year: number): Promise<AnnualTimelineFeature[]> {
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

  return features.map((feature) => {
    const summary = calculateFeatureSummary(feature.stories);
    const activeMonthIndexes = deriveFeatureMonthIndexes(feature.stories, year);
    const startIndex = activeMonthIndexes.length > 0 ? activeMonthIndexes[0] : null;
    const endIndex = activeMonthIndexes.length > 0 ? activeMonthIndexes[activeMonthIndexes.length - 1] : null;
    const activeSet = new Set(activeMonthIndexes);
    const inactiveGaps =
      startIndex === null || endIndex === null
        ? []
        : Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => startIndex + offset).filter(
            (index) => !activeSet.has(index)
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
      activeMonthIndexes,
      inactiveGaps
    };
  });
}

export async function buildAnnualTimelineData(year: number): Promise<AnnualTimelineData> {
  const selectedYear = Number.isInteger(year) ? year : new Date().getUTCFullYear();
  const { months, quarters } = buildAnnualTimelineMonths(selectedYear);
  const releases = await prisma.release.findMany({
    where: {
      startDate: { lte: yearEnd(selectedYear) },
      endDate: { gte: yearStart(selectedYear) }
    },
    orderBy: { startDate: "asc" }
  });

  const annualReleases = await Promise.all(
    releases.map(async (release) => {
      const [summary, features] = await Promise.all([
        buildReleaseSummary(release.id),
        buildReleaseFeatures(release.id, selectedYear)
      ]);

      return {
        id: release.id,
        name: release.name,
        status: release.status,
        startDate: dateOnly(release.startDate),
        endDate: dateOnly(release.endDate),
        summary,
        features
      };
    })
  );

  return {
    year: selectedYear,
    months,
    quarters,
    releases: annualReleases,
    summaries: annualReleases.map((release) => release.summary)
  };
}
