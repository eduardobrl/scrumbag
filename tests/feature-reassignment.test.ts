import { beforeEach, describe, expect, it } from "vitest";
import { FeatureLifecycleStatus, ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { PATCH as patchFeature } from "@/app/api/features/[id]/route";
import { prisma } from "@/lib/db";
import { reassignFeatureRelease, undoReassignFeatureRelease } from "@/lib/features";

async function resetDb() {
  await prisma.leakageHistory.deleteMany();
  await prisma.impediment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
}

async function seedReassignment() {
  const sourceRelease = await prisma.release.create({
    data: {
      name: "Source Release",
      objective: "Original scope",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const targetRelease = await prisma.release.create({
    data: {
      name: "Target Release",
      objective: "New scope",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-09-30T00:00:00.000Z"),
      status: ReleaseStatus.PLANNED
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: sourceRelease.id,
      name: "Sprint 1",
      startDate: new Date("2026-01-05T00:00:00.000Z"),
      endDate: new Date("2026-01-16T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({
    data: {
      releaseId: sourceRelease.id,
      name: "Moveable Feature",
      lifecycleStatus: FeatureLifecycleStatus.ACTIVE
    }
  });
  const plannedStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Planned story",
      status: StoryStatus.IN_PROGRESS,
      estimatedDays: 3
    }
  });
  const backlogStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Backlog story",
      status: StoryStatus.BACKLOG,
      estimatedDays: 2
    }
  });

  return { sourceRelease, targetRelease, sprint, feature, plannedStory, backlogStory };
}

beforeEach(async () => {
  await resetDb();
});

describe("feature release reassignment domain", () => {
  it("reassigns a feature and moves all stories to backlog", async () => {
    const { targetRelease, feature, plannedStory, backlogStory } = await seedReassignment();

    const result = await reassignFeatureRelease(feature.id, targetRelease.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.feature.releaseId).toBe(targetRelease.id);
    expect(result.data.changed).toBe(true);
    expect(result.data.undo.previousReleaseId).toBe(feature.releaseId);

    const stories = await prisma.story.findMany({ where: { id: { in: [plannedStory.id, backlogStory.id] } } });
    expect(stories.every((story) => story.currentSprintId === null)).toBe(true);
    expect(stories.every((story) => story.status === StoryStatus.BACKLOG)).toBe(true);
  });

  it("returns no-op success when target release matches current release", async () => {
    const { sourceRelease, feature } = await seedReassignment();

    const result = await reassignFeatureRelease(feature.id, sourceRelease.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.changed).toBe(false);
    expect(result.data.feature.releaseId).toBe(sourceRelease.id);
  });

  it("restores previous release and valid story state on undo", async () => {
    const { sourceRelease, targetRelease, sprint, feature, plannedStory } = await seedReassignment();
    const moved = await reassignFeatureRelease(feature.id, targetRelease.id);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;

    const undone = await undoReassignFeatureRelease(feature.id, moved.data.undo);
    expect(undone.ok).toBe(true);
    if (!undone.ok) return;

    expect(undone.data.feature.releaseId).toBe(sourceRelease.id);
    const story = await prisma.story.findUniqueOrThrow({ where: { id: plannedStory.id } });
    expect(story.currentSprintId).toBe(sprint.id);
    expect(story.status).toBe(StoryStatus.IN_PROGRESS);
  });

  it("leaves invalid prior sprint stories in backlog during undo", async () => {
    const { targetRelease, feature, sprint, plannedStory } = await seedReassignment();
    const moved = await reassignFeatureRelease(feature.id, targetRelease.id);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;

    await prisma.sprint.update({ where: { id: sprint.id }, data: { releaseId: targetRelease.id } });
    const undone = await undoReassignFeatureRelease(feature.id, moved.data.undo);

    expect(undone.ok).toBe(true);
    const story = await prisma.story.findUniqueOrThrow({ where: { id: plannedStory.id } });
    expect(story.currentSprintId).toBeNull();
    expect(story.status).toBe(StoryStatus.BACKLOG);
  });

  it("reports invalid target release and missing feature failures", async () => {
    const { feature, targetRelease } = await seedReassignment();

    const invalidTarget = await reassignFeatureRelease(feature.id, "missing-release");
    expect(invalidTarget.ok).toBe(false);

    const missingFeature = await reassignFeatureRelease("missing-feature", targetRelease.id);
    expect(missingFeature.ok).toBe(false);
    if (!missingFeature.ok) {
      expect(missingFeature.errors.general).toBe("Feature not found");
    }
  });
});

describe("feature release reassignment API", () => {
  it("commits and undoes reassignment through PATCH actions", async () => {
    const { sourceRelease, targetRelease, feature } = await seedReassignment();

    const moveResponse = await patchFeature(
      new Request("http://localhost/api/features/feature", {
        method: "PATCH",
        body: JSON.stringify({ action: "reassignRelease", targetReleaseId: targetRelease.id })
      }),
      { params: Promise.resolve({ id: feature.id }) }
    );
    const movePayload = await moveResponse.json();

    expect(moveResponse.status).toBe(200);
    expect(movePayload.feature.releaseId).toBe(targetRelease.id);
    expect(movePayload.undo.previousReleaseId).toBe(sourceRelease.id);

    const undoResponse = await patchFeature(
      new Request("http://localhost/api/features/feature", {
        method: "PATCH",
        body: JSON.stringify({ action: "undoReassignRelease", undo: movePayload.undo })
      }),
      { params: Promise.resolve({ id: feature.id }) }
    );
    const undoPayload = await undoResponse.json();

    expect(undoResponse.status).toBe(200);
    expect(undoPayload.feature.releaseId).toBe(sourceRelease.id);
  });

  it("returns 400 for invalid undo payloads", async () => {
    const { feature } = await seedReassignment();

    const response = await patchFeature(
      new Request("http://localhost/api/features/feature", {
        method: "PATCH",
        body: JSON.stringify({ action: "undoReassignRelease", undo: { featureId: "other" } })
      }),
      { params: Promise.resolve({ id: feature.id }) }
    );

    expect(response.status).toBe(400);
  });
});
