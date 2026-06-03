import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { listBacklogStories, moveStoryToBacklog, planStoryIntoSprint, previewStorySprintPlan } from "@/lib/backlog";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";

async function seedBacklog() {
  const release = await prisma.release.create({
    data: {
      name: "Release Q3",
      objective: "Plan scope",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const otherRelease = await prisma.release.create({
    data: {
      name: "Release Q4",
      objective: "Future",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Onboarding" } });
  const otherFeature = await prisma.feature.create({ data: { releaseId: otherRelease.id, name: "Other" } });
  const story = await prisma.story.create({
    data: { featureId: feature.id, title: "Create screen", description: "Login", storyPoints: 5, estimatedDays: 2 }
  });
  await prisma.story.create({
    data: { featureId: feature.id, title: "Canceled work", status: StoryStatus.CANCELLED, estimatedDays: 8 }
  });
  await prisma.story.create({
    data: { featureId: otherFeature.id, title: "Other release story", estimatedDays: 3 }
  });
  return { release, feature, sprint, story };
}

beforeEach(async () => {
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

describe("backlog filters", () => {
  it("defaults to unplanned non-canceled stories", async () => {
    const { release } = await seedBacklog();
    const stories = await listBacklogStories({ releaseId: release.id });

    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe("Create screen");
  });

  it("filters by release, feature, status, text, unplanned, and canceled", async () => {
    const { release, feature } = await seedBacklog();
    expect(await listBacklogStories({ releaseId: release.id, featureId: feature.id })).toHaveLength(1);
    expect(await listBacklogStories({ releaseId: release.id, status: StoryStatus.BACKLOG })).toHaveLength(1);
    expect(await listBacklogStories({ releaseId: release.id, q: "Login" })).toHaveLength(1);
    expect(await listBacklogStories({ releaseId: release.id, includeCanceled: true })).toHaveLength(2);
    expect(await listBacklogStories({ releaseId: release.id, unplannedOnly: false })).toHaveLength(1);
  });
});

describe("backlog planning", () => {
  it("previews, plans, summarizes, and moves back to backlog", async () => {
    const { release, sprint, story } = await seedBacklog();
    const preview = await previewStorySprintPlan(story.id, sprint.id);
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.data.currentPlannedEffortDays).toBe(0);
      expect(preview.data.afterAddPlannedEffortDays).toBe(2);
      expect(preview.data.riskLabel).toBe("On track");
    }

    const planned = await planStoryIntoSprint(story.id, sprint.id);
    expect(planned.ok).toBe(true);
    const summary = await getSprintPlanningSummary(sprint.id);
    expect(summary.plannedEffortDays).toBe(2);
    expect(summary.capacityDays).not.toBeNull();
    expect(summary.riskLabel).toBe("On track");

    const defaultBacklog = await listBacklogStories({ releaseId: release.id });
    expect(defaultBacklog.find((item) => item.id === story.id)).toBeUndefined();

    const moved = await moveStoryToBacklog(story.id);
    expect(moved.ok).toBe(true);
    const row = await prisma.story.findUnique({ where: { id: story.id } });
    expect(row?.currentSprintId).toBeNull();
    expect(row?.status).toBe(StoryStatus.BACKLOG);
  });
});
