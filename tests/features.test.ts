import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { calculateFeatureSummary, cancelFeature, createFeature, getFeatureDetails, listFeatures, listOrphanFeatures } from "@/lib/features";
import { ReleaseStatus, StoryStatus } from "@prisma/client";

async function seedRelease() {
  return prisma.release.create({
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
}

beforeEach(async () => {
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

describe("feature CRUD", () => {
  it("validates required name", async () => {
    const release = await seedRelease();
    const result = await createFeature({ releaseId: release.id, name: " " });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBe("Required");
    }
  });

  it("cancels without deleting", async () => {
    const release = await seedRelease();
    const created = await createFeature({ releaseId: release.id, name: "Onboarding Digital" });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const canceled = await cancelFeature(created.data.id);
    expect(canceled.ok).toBe(true);

    const stillThere = await getFeatureDetails(created.data.id);
    expect(stillThere?.lifecycleStatus).toBe("CANCELLED");
  });

  it("creates and lists orphan features separately from release features", async () => {
    const release = await seedRelease();
    const orphan = await createFeature({ releaseId: null, name: "Parking lot" });
    const releaseFeature = await createFeature({ releaseId: release.id, name: "Release scope" });

    expect(orphan.ok).toBe(true);
    expect(releaseFeature.ok).toBe(true);
    if (!orphan.ok || !releaseFeature.ok) return;

    expect(orphan.data.releaseId).toBeNull();

    const releaseFeatures = await listFeatures(release.id);
    const orphanFeatures = await listOrphanFeatures();

    expect(releaseFeatures.map((feature) => feature.id)).toEqual([releaseFeature.data.id]);
    expect(orphanFeatures.map((feature) => feature.id)).toEqual([orphan.data.id]);
  });
});

describe("feature aggregates", () => {
  it("excludes canceled stories from totals and progress", () => {
    const summary = calculateFeatureSummary([
      { storyPoints: 5, estimatedDays: 2, status: StoryStatus.DONE },
      { storyPoints: 8, estimatedDays: 3, status: StoryStatus.BACKLOG },
      { storyPoints: 13, estimatedDays: 5, status: StoryStatus.CANCELLED }
    ]);

    expect(summary.totalStoryPoints).toBe(13);
    expect(summary.totalEstimatedDays).toBe(5);
    expect(summary.calculatedStatus).toBe("IN_PROGRESS");
    expect(summary.progressPercentage).toBe(38);
  });

  it("falls back to story count when story points are zero", () => {
    const summary = calculateFeatureSummary([
      { storyPoints: 0, estimatedDays: 2, status: StoryStatus.DONE },
      { storyPoints: 0, estimatedDays: 3, status: StoryStatus.BACKLOG }
    ]);

    expect(summary.totalStoryPoints).toBe(0);
    expect(summary.progressPercentage).toBe(50);
  });
});
