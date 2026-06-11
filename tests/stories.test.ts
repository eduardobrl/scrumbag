import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createStory, updateStory, cancelStory } from "@/lib/stories";
import { createFeature, getFeatureDetails, toFeatureView } from "@/lib/features";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";

async function seedFeature(status: ReleaseStatus = ReleaseStatus.IN_PROGRESS) {
  const release = await prisma.release.create({
    data: {
      name: "Release Q3",
      objective: "Plan scope",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status
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
  const feature = await createFeature({ releaseId: release.id, name: "Onboarding Digital" });
  if (!feature.ok) throw new Error("Failed to seed feature");
  return { release, sprint, feature: feature.data };
}

beforeEach(async () => {
  await prisma.estimateChange.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

describe("story CRUD", () => {
  it("validates required title", async () => {
    const { feature } = await seedFeature();
    const result = await createStory({ featureId: feature.id, title: " " });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBe("Required");
    }
  });

  it("accepts zero estimates and rejects negative values", async () => {
    const { feature } = await seedFeature();
    const created = await createStory({ featureId: feature.id, title: "Zero estimate", storyPoints: 0, estimatedDays: 0 });
    expect(created.ok).toBe(true);

    const rejected = await createStory({ featureId: feature.id, title: "Bad", storyPoints: -1, estimatedDays: -1 });
    expect(rejected.ok).toBe(false);
  });

  it("cancels without deleting", async () => {
    const { feature } = await seedFeature();
    const created = await createStory({ featureId: feature.id, title: "Create onboarding screen" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const canceled = await cancelStory(created.data.id);
    expect(canceled.ok).toBe(true);
    const row = await prisma.story.findUnique({ where: { id: created.data.id } });
    expect(row?.status).toBe(StoryStatus.CANCELLED);
  });

  it("blocks direct sprint assignment for an unplanned story", async () => {
    const { feature, sprint } = await seedFeature();
    const created = await createStory({ featureId: feature.id, title: "Plan me" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateStory(created.data.id, {
      featureId: feature.id,
      title: "Plan me",
      currentSprintId: sprint.id
    });

    expect(updated.ok).toBe(false);
    if (!updated.ok) {
      expect(updated.errors.currentSprintId).toContain("Use backlog planning");
    }
  });
});

describe("story-driven feature aggregates", () => {
  it("recalculates totals, status, progress, and cancellation exclusions", async () => {
    const { feature } = await seedFeature();
    const first = await createStory({ featureId: feature.id, title: "Screen", storyPoints: 5, estimatedDays: 2 });
    const second = await createStory({ featureId: feature.id, title: "API", storyPoints: 8, estimatedDays: 4 });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    await updateStory(first.data.id, {
      featureId: feature.id,
      title: "Screen",
      storyPoints: 5,
      estimatedDays: 2,
      status: StoryStatus.DONE
    });
    await cancelStory(second.data.id);

    const details = await getFeatureDetails(feature.id);
    expect(details).toBeTruthy();
    const view = toFeatureView(details!);
    expect(view.summary.totalStoryPoints).toBe(5);
    expect(view.summary.totalEstimatedDays).toBe(2);
    expect(view.summary.calculatedStatus).toBe("FINISHED");
    expect(view.summary.progressPercentage).toBe(100);
  });
});

describe("story estimate audit history", () => {
  it("records one audit row per changed estimate field after go-live", async () => {
    const { feature } = await seedFeature(ReleaseStatus.IN_PROGRESS);
    const created = await createStory({
      featureId: feature.id,
      title: "Estimate me",
      storyPoints: 5,
      estimatedDays: 2
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateStory(created.data.id, {
      featureId: feature.id,
      title: "Estimate me",
      storyPoints: 8,
      estimatedDays: 3,
      status: StoryStatus.BACKLOG,
      changeReason: "Scope clarified"
    });

    expect(updated.ok).toBe(true);

    const changes = await prisma.estimateChange.findMany({
      where: { storyId: created.data.id },
      orderBy: { field: "asc" }
    });
    expect(changes).toHaveLength(2);
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "storyPoints",
          oldValue: 5,
          newValue: 8,
          changeReason: "Scope clarified"
        }),
        expect.objectContaining({
          field: "estimatedDays",
          oldValue: 2,
          newValue: 3,
          changeReason: "Scope clarified"
        })
      ])
    );
  });

  it("does not record planning-time estimate edits", async () => {
    const { feature } = await seedFeature(ReleaseStatus.PLANNING);
    const created = await createStory({
      featureId: feature.id,
      title: "Still planning",
      storyPoints: 5,
      estimatedDays: 2
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateStory(created.data.id, {
      featureId: feature.id,
      title: "Still planning",
      storyPoints: 8,
      estimatedDays: 3,
      status: StoryStatus.BACKLOG
    });

    expect(updated.ok).toBe(true);
    await expect(prisma.estimateChange.count({ where: { storyId: created.data.id } })).resolves.toBe(0);
  });

  it("records explicit null estimate transitions but skips unchanged null values", async () => {
    const { feature } = await seedFeature(ReleaseStatus.CLOSED);
    const created = await createStory({
      featureId: feature.id,
      title: "Nullable estimate"
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const unchanged = await updateStory(created.data.id, {
      featureId: feature.id,
      title: "Nullable estimate",
      status: StoryStatus.BACKLOG
    });
    expect(unchanged.ok).toBe(true);
    await expect(prisma.estimateChange.count({ where: { storyId: created.data.id } })).resolves.toBe(0);

    const changed = await updateStory(created.data.id, {
      featureId: feature.id,
      title: "Nullable estimate",
      storyPoints: 3,
      estimatedDays: "",
      status: StoryStatus.BACKLOG
    });
    expect(changed.ok).toBe(true);

    const changes = await prisma.estimateChange.findMany({ where: { storyId: created.data.id } });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      field: "storyPoints",
      oldValue: null,
      newValue: 3
    });
  });
});
