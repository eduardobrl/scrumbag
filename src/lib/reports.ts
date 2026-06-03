import { StoryStatus } from "@prisma/client";
import { calculateSprintCapacity } from "@/lib/capacity";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { calculateFeatureSummary } from "@/lib/features";
import { getOrCreateSettings } from "@/lib/settings";
import { buildTimelineData } from "@/lib/timeline";
import { REPORT_LABELS, type ReportType } from "@/lib/report-types";

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportRow = Record<string, string | number | boolean | null>;

export type GeneratedReport = {
  title: string;
  columns: ReportColumn[];
  rows: ReportRow[];
};

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function period(start: Date, end: Date): string {
  return `${dateOnly(start)} to ${dateOnly(end)}`;
}

export async function generateReport(type: ReportType, releaseId: string): Promise<GeneratedReport> {
  switch (type) {
    case "release-planning":
      return releasePlanningReport(releaseId);
    case "sprint-capacity":
      return sprintCapacityReport(releaseId);
    case "stories-by-sprint":
      return storiesBySprintReport(releaseId);
    case "feature-progress":
      return featureProgressReport(releaseId);
    case "leakage":
      return leakageReport(releaseId);
    case "planned-vs-capacity":
      return plannedVsCapacityReport(releaseId);
    case "timeline":
      return timelineReport(releaseId);
  }
}

async function releasePlanningReport(releaseId: string): Promise<GeneratedReport> {
  const data = await getDashboardData(releaseId);

  return {
    title: REPORT_LABELS["release-planning"],
    columns: [
      { key: "releaseName", label: "Release" },
      { key: "objective", label: "Objective" },
      { key: "period", label: "Period" },
      { key: "sprintCount", label: "Sprints" },
      { key: "featureCount", label: "Features" },
      { key: "storyCount", label: "Stories" },
      { key: "totalCapacityDays", label: "Total capacity days" },
      { key: "plannedEffortDays", label: "Planned effort days" },
      { key: "progressPercentage", label: "Progress %" },
      { key: "risk", label: "Risk" }
    ],
    rows: [
      {
        releaseName: data.release.name,
        objective: data.release.objective,
        period: `${data.release.startDate} to ${data.release.endDate}`,
        sprintCount: data.sprints.length,
        featureCount: data.featureCount,
        storyCount: data.storyCount,
        totalCapacityDays: data.totalCapacityDays,
        plannedEffortDays: data.plannedEffortDays,
        progressPercentage: data.progress,
        risk: data.risk
      }
    ]
  };
}

async function sprintCapacityReport(releaseId: string): Promise<GeneratedReport> {
  const [settings, sprints] = await Promise.all([
    getOrCreateSettings(),
    prisma.sprint.findMany({
      where: { releaseId },
      orderBy: { startDate: "asc" },
      include: {
        stories: {
          where: { status: { not: StoryStatus.CANCELLED } },
          select: { estimatedDays: true }
        }
      }
    })
  ]);

  const rows = await Promise.all(
    sprints.map(async (sprint) => {
      const capacity = await calculateSprintCapacity(sprint.id);
      const plannedEffortDays = sprint.stories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);
      const remainingCapacityDays = capacity.netCapacityDays - plannedEffortDays;
      const occupancyPercentage =
        capacity.netCapacityDays > 0 ? (plannedEffortDays / capacity.netCapacityDays) * 100 : 0;

      return {
        sprintName: sprint.name,
        period: period(sprint.startDate, sprint.endDate),
        grossCapacityDays: round(capacity.grossCapacityDays),
        absenceReductionDays: round(capacity.absenceReductionHours / settings.standardDayHours),
        holidayReductionDays: round(capacity.holidayReductionHours / settings.standardDayHours),
        meetingReductionDays: round(capacity.meetingReductionHours / settings.standardDayHours),
        supportReductionDays: round(capacity.supportReductionHours / settings.standardDayHours),
        netCapacityDays: round(capacity.netCapacityDays),
        plannedEffortDays: round(plannedEffortDays),
        remainingCapacityDays: round(remainingCapacityDays),
        occupancyPercentage: round(occupancyPercentage),
        overCapacity: plannedEffortDays > capacity.netCapacityDays
      };
    })
  );

  return {
    title: REPORT_LABELS["sprint-capacity"],
    columns: [
      { key: "sprintName", label: "Sprint" },
      { key: "period", label: "Period" },
      { key: "grossCapacityDays", label: "Gross capacity days" },
      { key: "absenceReductionDays", label: "Absence reduction days" },
      { key: "holidayReductionDays", label: "Holiday reduction days" },
      { key: "meetingReductionDays", label: "Meeting reduction days" },
      { key: "supportReductionDays", label: "Support reduction days" },
      { key: "netCapacityDays", label: "Net capacity days" },
      { key: "plannedEffortDays", label: "Planned effort days" },
      { key: "remainingCapacityDays", label: "Remaining capacity days" },
      { key: "occupancyPercentage", label: "Occupancy %" },
      { key: "overCapacity", label: "Over capacity" }
    ],
    rows
  };
}

async function storiesBySprintReport(releaseId: string): Promise<GeneratedReport> {
  const stories = await prisma.story.findMany({
    where: {
      currentSprintId: { not: null },
      status: { not: StoryStatus.CANCELLED },
      currentSprint: { releaseId }
    },
    include: { currentSprint: true, feature: true }
  });

  stories.sort((left, right) => {
    const sprintDelta = left.currentSprint!.startDate.getTime() - right.currentSprint!.startDate.getTime();
    return sprintDelta || left.title.localeCompare(right.title);
  });

  return {
    title: REPORT_LABELS["stories-by-sprint"],
    columns: [
      { key: "sprintName", label: "Sprint" },
      { key: "featureName", label: "Feature" },
      { key: "storyTitle", label: "Story" },
      { key: "storyPoints", label: "Story points" },
      { key: "estimatedDays", label: "Estimated days" },
      { key: "status", label: "Status" },
      { key: "done", label: "Done" }
    ],
    rows: stories.map((story) => ({
      sprintName: story.currentSprint!.name,
      featureName: story.feature.name,
      storyTitle: story.title,
      storyPoints: story.storyPoints ?? 0,
      estimatedDays: story.estimatedDays ?? 0,
      status: story.status,
      done: story.status === StoryStatus.DONE
    }))
  };
}

async function featureProgressReport(releaseId: string): Promise<GeneratedReport> {
  const features = await prisma.feature.findMany({
    where: { releaseId, lifecycleStatus: "ACTIVE" },
    include: { stories: { include: { currentSprint: true } } },
    orderBy: { createdAt: "asc" }
  });

  return {
    title: REPORT_LABELS["feature-progress"],
    columns: [
      { key: "featureName", label: "Feature" },
      { key: "totalStories", label: "Total stories" },
      { key: "finishedStories", label: "Finished stories" },
      { key: "totalStoryPoints", label: "Total story points" },
      { key: "finishedStoryPoints", label: "Finished story points" },
      { key: "progressPercentage", label: "Progress %" },
      { key: "calculatedStatus", label: "Calculated status" }
    ],
    rows: features.map((feature) => {
      const scopedStories = feature.stories.filter((story) => story.status !== StoryStatus.CANCELLED);
      const finishedStories = scopedStories.filter((story) => story.status === StoryStatus.DONE);
      const summary = calculateFeatureSummary(feature.stories);

      return {
        featureName: feature.name,
        totalStories: summary.storyCount,
        finishedStories: summary.finishedStoryCount,
        totalStoryPoints: summary.totalStoryPoints,
        finishedStoryPoints: finishedStories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0),
        progressPercentage: summary.progressPercentage,
        calculatedStatus: summary.calculatedStatus
      };
    })
  };
}

async function leakageReport(releaseId: string): Promise<GeneratedReport> {
  const events = await prisma.leakageHistory.findMany({
    where: { originSprint: { releaseId } },
    include: {
      originSprint: true,
      destinationSprint: true,
      story: { include: { feature: true } }
    },
    orderBy: { eventDate: "desc" }
  });

  return {
    title: REPORT_LABELS.leakage,
    columns: [
      { key: "originSprint", label: "Origin sprint" },
      { key: "destinationSprint", label: "Destination sprint" },
      { key: "featureName", label: "Feature" },
      { key: "storyTitle", label: "Story" },
      { key: "eventDate", label: "Event date" },
      { key: "statusAtEvent", label: "Status at event" }
    ],
    rows: events.map((event) => ({
      originSprint: event.originSprint.name,
      destinationSprint: event.destinationSprint.name,
      featureName: event.story.feature.name,
      storyTitle: event.story.title,
      eventDate: event.eventDate.toISOString(),
      statusAtEvent: event.statusAtEvent
    }))
  };
}

async function plannedVsCapacityReport(releaseId: string): Promise<GeneratedReport> {
  const data = await getDashboardData(releaseId);

  return {
    title: REPORT_LABELS["planned-vs-capacity"],
    columns: [
      { key: "sprintName", label: "Sprint" },
      { key: "netCapacityDays", label: "Net capacity days" },
      { key: "plannedEffortDays", label: "Planned effort days" },
      { key: "difference", label: "Difference" },
      { key: "occupancyPercentage", label: "Occupancy %" },
      { key: "risk", label: "Risk" }
    ],
    rows: data.sprints.map((sprint) => ({
      sprintName: sprint.name,
      netCapacityDays: sprint.netCapacityDays,
      plannedEffortDays: sprint.plannedEffortDays,
      difference: round(sprint.plannedEffortDays - sprint.netCapacityDays),
      occupancyPercentage: sprint.occupancyPercentage,
      risk: sprint.overCapacity ? "Over capacity" : "On track"
    }))
  };
}

async function timelineReport(releaseId: string): Promise<GeneratedReport> {
  const timeline = await buildTimelineData(releaseId);

  return {
    title: REPORT_LABELS.timeline,
    columns: [
      { key: "featureName", label: "Feature" },
      { key: "startSprint", label: "Start sprint" },
      { key: "endSprint", label: "End sprint" },
      { key: "spanLength", label: "Span length" },
      { key: "inactiveGapCount", label: "Inactive gaps" },
      { key: "completionPercentage", label: "Completion %" }
    ],
    rows: timeline.features.map((feature) => {
      const startSprint = timeline.sprints.find((sprint) => sprint.id === feature.startSprintId);
      const endSprint = timeline.sprints.find((sprint) => sprint.id === feature.endSprintId);

      return {
        featureName: feature.name,
        startSprint: startSprint?.name ?? "Unplanned",
        endSprint: endSprint?.name ?? "Unplanned",
        spanLength:
          feature.startIndex === null || feature.endIndex === null ? 0 : feature.endIndex - feature.startIndex + 1,
        inactiveGapCount: feature.inactiveGaps.length,
        completionPercentage: feature.completionProgress
      };
    })
  };
}
