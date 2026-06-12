import { beforeEach, describe, expect, it } from "vitest";
import { FeatureLifecycleStatus, ReleaseStatus, RoleType, SprintStatus, StoryStatus } from "@prisma/client";
import {
  buildAnnualTimelineData,
  releaseOverlapsYear
} from "@/lib/annual-timeline";
import { prisma } from "@/lib/db";

async function resetDb() {
  await prisma.leakageHistory.deleteMany();
  await prisma.impediment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.appSettings.deleteMany();
}

async function seedAnnualData() {
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

  const releaseA = await prisma.release.create({
    data: {
      name: "Release A",
      objective: "First portfolio slot",
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 0,
      supportPercentage: 0,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const releaseB = await prisma.release.create({
    data: {
      name: "Release B",
      objective: "Second portfolio slot",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 0,
      supportPercentage: 0,
      status: ReleaseStatus.PLANNED
    }
  });
  await prisma.release.create({
    data: {
      name: "Outside",
      objective: "Not in selected year",
      startDate: new Date("2025-01-01T00:00:00.000Z"),
      endDate: new Date("2025-03-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 0,
      supportPercentage: 0,
      status: ReleaseStatus.CLOSED
    }
  });

  const sprintJan = await prisma.sprint.create({
    data: {
      releaseId: releaseA.id,
      name: "Sprint Jan",
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-01-16T00:00:00.000Z"),
      status: SprintStatus.CLOSED
    }
  });
  await prisma.sprint.create({
    data: {
      releaseId: releaseA.id,
      name: "Sprint Fev",
      startDate: new Date("2026-02-02T00:00:00.000Z"),
      endDate: new Date("2026-02-13T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const sprintMar = await prisma.sprint.create({
    data: {
      releaseId: releaseA.id,
      name: "Sprint Mar",
      startDate: new Date("2026-03-02T00:00:00.000Z"),
      endDate: new Date("2026-03-13T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const sprintJul = await prisma.sprint.create({
    data: {
      releaseId: releaseB.id,
      name: "Sprint Jul",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });

  const activeFeature = await prisma.feature.create({
    data: { releaseId: releaseA.id, name: "Feature with gap", lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
  });
  const finishedFeature = await prisma.feature.create({
    data: { releaseId: releaseA.id, name: "Finished feature", lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
  });
  const cancelledFeature = await prisma.feature.create({
    data: { releaseId: releaseB.id, name: "Cancelled feature", lifecycleStatus: FeatureLifecycleStatus.CANCELLED }
  });
  const unplannedFeature = await prisma.feature.create({
    data: { releaseId: releaseB.id, name: "Unplanned feature", lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
  });
  const orphanFeature = await prisma.feature.create({
    data: { name: "Orphan feature", lifecycleStatus: FeatureLifecycleStatus.ACTIVE }
  });

  await prisma.story.create({
    data: {
      featureId: activeFeature.id,
      currentSprintId: sprintJan.id,
      title: "January story",
      storyPoints: 3,
      estimatedDays: 2,
      status: StoryStatus.DONE
    }
  });
  await prisma.story.create({
    data: {
      featureId: activeFeature.id,
      currentSprintId: sprintMar.id,
      title: "March story",
      storyPoints: 5,
      estimatedDays: 4,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  await prisma.story.create({
    data: {
      featureId: finishedFeature.id,
      currentSprintId: sprintJan.id,
      title: "Finished story",
      storyPoints: 2,
      estimatedDays: 1,
      status: StoryStatus.DONE
    }
  });
  await prisma.story.create({
    data: {
      featureId: cancelledFeature.id,
      currentSprintId: sprintJul.id,
      title: "Cancelled feature story",
      storyPoints: 8,
      estimatedDays: 6,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });

  return { releaseA, releaseB, activeFeature, finishedFeature, cancelledFeature, unplannedFeature, orphanFeature };
}

beforeEach(async () => {
  await resetDb();
});

describe("annual timeline sprint grid", () => {
  it("checks release overlaps against the selected year", () => {
    expect(
      releaseOverlapsYear(
        {
          startDate: new Date("2025-12-15T00:00:00.000Z"),
          endDate: new Date("2026-01-15T00:00:00.000Z")
        },
        2026
      )
    ).toBe(true);
  });
});

describe("annual timeline data", () => {
  it("filters and orders releases by selected year", async () => {
    await seedAnnualData();

    const data = await buildAnnualTimelineData(2026);

    expect(data.releases.map((release) => release.name)).toEqual(["Release A", "Release B"]);
    expect(data.sprints.map((sprint) => sprint.name)).toEqual(["Sprint Jan", "Sprint Fev", "Sprint Mar", "Sprint Jul"]);
    expect(data.releaseBands.map((release) => release.label)).toEqual(["Release A", "Release B"]);
    expect(data.releaseBands[0]).toMatchObject({ startIndex: 0, endIndex: 2, sprintCount: 3 });
    expect(data.releaseBands[1]).toMatchObject({ startIndex: 3, endIndex: 3, sprintCount: 1 });
  });

  it("builds cross-release summary metrics", async () => {
    const { releaseA } = await seedAnnualData();

    const data = await buildAnnualTimelineData(2026);
    const summary = data.summaries.find((item) => item.id === releaseA.id);

    expect(summary).toMatchObject({
      name: "Release A",
      featureCount: 2,
      storyCount: 3,
      estimatedDays: 7,
      completionPercentage: 50,
      sprintCount: 3,
      plannedEffortDays: 7,
      overCapacityDays: 0
    });
    expect(summary?.totalCapacityDays).toBeGreaterThan(0);
  });

  it("includes sprint and release overflow metrics", async () => {
    const { releaseA, activeFeature } = await seedAnnualData();
    const sprintJan = await prisma.sprint.findFirstOrThrow({ where: { releaseId: releaseA.id, name: "Sprint Jan" } });
    await prisma.story.create({
      data: {
        featureId: activeFeature.id,
        currentSprintId: sprintJan.id,
        title: "Large scope",
        storyPoints: 13,
        estimatedDays: 40,
        status: StoryStatus.SPRINT_BACKLOG
      }
    });

    const data = await buildAnnualTimelineData(2026);
    const sprint = data.sprints.find((item) => item.id === sprintJan.id);
    const summary = data.summaries.find((item) => item.id === releaseA.id);

    expect(sprint).toMatchObject({
      plannedEffortDays: 43,
      netCapacityDays: 10,
      remainingCapacityDays: -33,
      overCapacityDays: 33
    });
    expect(summary?.overCapacityDays).toBeGreaterThan(0);
  });

  it("builds feature spans with inactive sprint gaps", async () => {
    const { activeFeature } = await seedAnnualData();
    const [sprintJan, activeStories] = await Promise.all([
      prisma.sprint.findFirstOrThrow({ where: { name: "Sprint Jan" } }),
      prisma.story.findMany({ where: { featureId: activeFeature.id } })
    ]);
    await prisma.releaseEstimateBaseline.create({
      data: {
        releaseId: activeFeature.releaseId!,
        items: {
          create: activeStories.map((story) => ({
            storyId: story.id,
            featureId: activeFeature.id,
            plannedSprintId: sprintJan.id,
            storyPoints: story.storyPoints,
            estimatedDays: story.estimatedDays
          }))
        }
      }
    });

    const data = await buildAnnualTimelineData(2026);
    const feature = data.releases.flatMap((release) => release.features).find((item) => item.id === activeFeature.id);
    const sprintJanAllocation = feature?.sprintAllocations.find((item) => item.sprintIndex === 0);

    expect(feature?.startIndex).toBe(0);
    expect(feature?.endIndex).toBe(2);
    expect(feature?.activeSprintIndexes).toEqual([0, 2]);
    expect(feature?.plannedSprintIndexes).toEqual([0]);
    expect(feature?.inactiveGaps).toEqual([1]);
    expect(feature?.hasPlanBaseline).toBe(true);
    expect(sprintJanAllocation).toMatchObject({ plannedPercentage: 100, actualPercentage: 33 });
  });

  it("includes active, finished, cancelled, and unplanned feature rows", async () => {
    const { activeFeature, finishedFeature, cancelledFeature, unplannedFeature } = await seedAnnualData();

    const data = await buildAnnualTimelineData(2026);
    const features = new Map(data.releases.flatMap((release) => release.features).map((feature) => [feature.id, feature]));

    expect(features.get(activeFeature.id)?.status).toBe("ACTIVE");
    expect(features.get(finishedFeature.id)?.status).toBe("FINISHED");
    expect(features.get(cancelledFeature.id)?.status).toBe("CANCELLED");
    expect(features.get(unplannedFeature.id)?.startIndex).toBeNull();
    expect(features.get(unplannedFeature.id)?.endIndex).toBeNull();
  });

  it("keeps orphan features outside release summaries", async () => {
    const { orphanFeature } = await seedAnnualData();

    const data = await buildAnnualTimelineData(2026);

    expect(data.orphanFeatures.map((feature) => feature.id)).toContain(orphanFeature.id);
    expect(data.releases.flatMap((release) => release.features).map((feature) => feature.id)).not.toContain(orphanFeature.id);
    expect(data.summaries.reduce((sum, summary) => sum + summary.featureCount, 0)).toBe(3);
  });
});
