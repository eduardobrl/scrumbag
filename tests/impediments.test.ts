import { beforeEach, describe, expect, it } from "vitest";
import { ReleaseStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createImpediment, toImpedimentView } from "@/lib/impediments";

async function seedReleaseWithStories() {
  const release = await prisma.release.create({
    data: {
      name: "Release Q3",
      objective: "Track blockers",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Checkout" } });
  const firstStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Create checkout shell",
      estimatedDays: 2,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  const secondStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Add payment validation",
      estimatedDays: 3,
      status: StoryStatus.IN_PROGRESS
    }
  });

  return { release, firstStory, secondStory };
}

beforeEach(async () => {
  await prisma.impediment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

describe("impediment data helpers", () => {
  it("creates a story-linked impediment and calculates delivery impact", async () => {
    const { release, firstStory, secondStory } = await seedReleaseWithStories();

    const result = await createImpediment({
      title: "Vendor sandbox unavailable",
      description: "Payments cannot be validated.",
      reportedDate: "2026-07-06",
      affectedStoryIds: [firstStory.id, secondStory.id]
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const view = toImpedimentView(result.data);
    expect(view.releaseId).toBe(release.id);
    expect(view.affectedStories.map((story) => story.id).sort()).toEqual([firstStory.id, secondStory.id].sort());
    expect(view.impact.storyCount).toBe(2);
    expect(view.impact.estimatedDays).toBe(5);
  });
});
