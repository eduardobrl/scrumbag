import { beforeEach, describe, expect, it } from "vitest";
import { FeatureLifecycleStatus, ReleaseStatus, RoleType, SprintStatus, StoryStatus } from "@prisma/client";
import { detectAlerts } from "@/lib/alerts";
import { getDashboardData } from "@/lib/dashboard";
import { prisma } from "@/lib/db";
import { calculateReleaseProgress, calculateSprintProgress } from "@/lib/progress";
import { buildTimelineData } from "@/lib/timeline";

async function resetDb() {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.appSettings.deleteMany();
}

async function seedRelease() {
  await prisma.appSettings.create({
    data: {
      workingHoursFullTime: 8,
      workingHoursIntern: 6,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: false
    }
  });
  await prisma.squadMember.create({ data: { name: "Ana", roleType: RoleType.FULL_TIME } });

  const release = await prisma.release.create({
    data: {
      name: "Release Intelligence",
      objective: "See release health",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 0,
      supportPercentage: 0,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint1 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      goal: "Kickoff",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.CLOSED
    }
  });
  const sprint2 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const sprint3 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 3",
      goal: "Finish",
      startDate: new Date("2026-07-20T00:00:00.000Z"),
      endDate: new Date("2026-07-24T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({
    data: { releaseId: release.id, name: "Feature A", lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
  });
  const emptyFeature = await prisma.feature.create({
    data: { releaseId: release.id, name: "Empty Feature", lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
  });
  const done = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint1.id,
      title: "Done story",
      storyPoints: 5,
      estimatedDays: 3,
      status: StoryStatus.DONE
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint3.id,
      title: "Future story",
      storyPoints: 5,
      estimatedDays: 2,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint2.id,
      title: "Unestimated story",
      estimatedDays: 0,
      status: StoryStatus.IN_PROGRESS
    }
  });
  await prisma.leakageHistory.create({
    data: {
      storyId: done.id,
      originSprintId: sprint1.id,
      destinationSprintId: sprint2.id,
      statusAtEvent: StoryStatus.IN_PROGRESS
    }
  });

  return { release, sprint1, sprint2, sprint3, feature, emptyFeature };
}

beforeEach(async () => {
  await resetDb();
});

describe("dashboard progress", () => {
  it("calculates release progress from finished story points", async () => {
    const { release } = await seedRelease();
    await prisma.story.deleteMany({ where: { title: "Unestimated story" } });

    await expect(calculateReleaseProgress(release.id)).resolves.toBe(0.5);
  });

  it("falls back to story counts when no story points exist", async () => {
    const { release } = await seedRelease();
    await prisma.story.updateMany({ data: { storyPoints: null } });
    await prisma.story.create({
      data: {
        featureId: (await prisma.feature.findFirstOrThrow({ where: { releaseId: release.id } })).id,
        title: "Backlog one",
        status: StoryStatus.BACKLOG
      }
    });

    await expect(calculateReleaseProgress(release.id)).resolves.toBe(0.25);
  });

  it("returns zero when release has no stories", async () => {
    const { release } = await seedRelease();
    await prisma.leakageHistory.deleteMany();
    await prisma.story.deleteMany();

    await expect(calculateReleaseProgress(release.id)).resolves.toBe(0);
  });

  it("calculates sprint progress by finished estimated days", async () => {
    const { sprint1, feature } = await seedRelease();
    await prisma.story.create({
      data: {
        featureId: feature.id,
        currentSprintId: sprint1.id,
        title: "Not done",
        estimatedDays: 2,
        status: StoryStatus.SPRINT_BACKLOG
      }
    });

    await expect(calculateSprintProgress(sprint1.id)).resolves.toBe(0.6);
  });
});

describe("dashboard aggregation and alerts", () => {
  it("includes capacity, planned effort, and risk fields", async () => {
    const { release } = await seedRelease();
    const data = await getDashboardData(release.id);

    expect(data.totalCapacityDays).toBeGreaterThan(0);
    expect(data.plannedEffortDays).toBe(5);
    expect(data.risk).toBe("On track");
  });

  it("detects over-capacity and leaked-story alerts", async () => {
    const { release, sprint2, feature } = await seedRelease();
    await prisma.story.create({
      data: {
        featureId: feature.id,
        currentSprintId: sprint2.id,
        title: "Huge story",
        estimatedDays: 99,
        status: StoryStatus.SPRINT_BACKLOG
      }
    });

    const alerts = await detectAlerts(release.id);
    expect(alerts.some((alert) => alert.type === "SPRINT_OVER_CAPACITY")).toBe(true);
    expect(alerts.some((alert) => alert.type === "LEAKED_STORIES")).toBe(true);
    expect(alerts.some((alert) => alert.type === "FEATURE_WITHOUT_STORIES")).toBe(true);
    expect(alerts.some((alert) => alert.type === "STORY_WITHOUT_ESTIMATE")).toBe(true);
  });
});

describe("timeline", () => {
  it("builds feature spans with inactive gaps and leaked sprint indicators", async () => {
    const { release, feature, sprint1 } = await seedRelease();
    await prisma.story.deleteMany({ where: { title: "Unestimated story" } });
    const featureStories = await prisma.story.findMany({ where: { featureId: feature.id }, orderBy: { title: "asc" } });
    await prisma.releaseEstimateBaseline.create({
      data: {
        releaseId: release.id,
        items: {
          create: featureStories.map((story) => ({
            storyId: story.id,
            featureId: feature.id,
            plannedSprintId: sprint1.id,
            storyPoints: story.storyPoints,
            estimatedDays: story.estimatedDays
          }))
        }
      }
    });

    const timeline = await buildTimelineData(release.id);
    const row = timeline.features.find((item) => item.id === feature.id);
    const sprint1Allocation = row?.sprintAllocations.find((item) => item.sprintId === sprint1.id);

    expect(row?.startIndex).toBe(0);
    expect(row?.endIndex).toBe(2);
    expect(row?.inactiveGaps).toContain(1);
    expect(row?.hasPlanBaseline).toBe(true);
    expect(sprint1Allocation).toMatchObject({ plannedPercentage: 100, actualPercentage: 60 });
    expect(timeline.sprints[0].isFinished).toBe(true);
    expect(timeline.leakedSprints).toContain(sprint1.id);
  });
});
