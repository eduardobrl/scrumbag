import { beforeEach, describe, expect, it } from "vitest";
import { ImpedimentStatus, ReleaseStatus, StoryStatus } from "@prisma/client";
import { PATCH as patchImpediment } from "@/app/api/impediments/[id]/route";
import { POST as postImpediment } from "@/app/api/impediments/route";
import { prisma } from "@/lib/db";
import { createImpediment, resolveImpediment, toImpedimentView } from "@/lib/impediments";

async function seedReleaseWithStories(name = "Release Q3") {
  const release = await prisma.release.create({
    data: {
      name,
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
  it("creates a story-linked impediment through the API and calculates delivery impact", async () => {
    const { release, firstStory, secondStory } = await seedReleaseWithStories();

    const response = await postImpediment(
      new Request("http://localhost/api/impediments", {
        method: "POST",
        body: JSON.stringify({
          title: "Vendor sandbox unavailable",
          description: "Payments cannot be validated.",
          reportedDate: "2026-07-06",
          affectedStoryIds: [firstStory.id, secondStory.id]
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.impediment.releaseId).toBe(release.id);
    expect(body.impediment.affectedStories.map((story: { id: string }) => story.id).sort()).toEqual(
      [firstStory.id, secondStory.id].sort()
    );
    expect(body.impediment.impact.storyCount).toBe(2);
    expect(body.impediment.impact.estimatedDays).toBe(5);
  });

  it("rejects impediments without affected stories", async () => {
    const result = await createImpediment({
      title: "Missing link",
      reportedDate: "2026-07-06",
      affectedStoryIds: []
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.affectedStoryIds).toContain("Select at least one");
    }
  });

  it("rejects affected stories from different releases", async () => {
    const first = await seedReleaseWithStories("Release A");
    const second = await seedReleaseWithStories("Release B");

    const result = await createImpediment({
      title: "Cross-release blocker",
      reportedDate: "2026-07-06",
      affectedStoryIds: [first.firstStory.id, second.firstStory.id]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.affectedStoryIds).toContain("same release");
    }
  });

  it("resolves an impediment once and calculates blocked business days", async () => {
    const { firstStory, secondStory } = await seedReleaseWithStories();
    const created = await createImpediment({
      title: "Environment unavailable",
      reportedDate: "2026-07-03",
      affectedStoryIds: [firstStory.id, secondStory.id]
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const response = await patchImpediment(
      new Request(`http://localhost/api/impediments/${created.data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "resolve",
          resolutionDate: "2026-07-07",
          resolutionNotes: "Sandbox credentials restored."
        })
      }),
      { params: Promise.resolve({ id: created.data.id }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.impediment.status).toBe(ImpedimentStatus.RESOLVED);
    expect(body.impediment.resolutionDate).toBe("2026-07-07");
    expect(body.impediment.impact.blockedBusinessDays).toBe(3);

    const secondResolve = await resolveImpediment(created.data.id, {
      resolutionDate: "2026-07-08",
      resolutionNotes: "Try again"
    });

    expect(secondResolve.ok).toBe(false);
    if (!secondResolve.ok) {
      expect(secondResolve.errors.status).toContain("cannot be reopened");
    }
  });

  it("does not change affected story status when resolving", async () => {
    const { firstStory } = await seedReleaseWithStories();
    const created = await createImpediment({
      title: "Decision pending",
      reportedDate: "2026-07-06",
      affectedStoryIds: [firstStory.id]
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await resolveImpediment(created.data.id, { resolutionDate: "2026-07-08" });

    const story = await prisma.story.findUniqueOrThrow({ where: { id: firstStory.id } });
    expect(story.status).toBe(firstStory.status);

    const view = toImpedimentView((await prisma.impediment.findUniqueOrThrow({
      where: { id: created.data.id },
      include: {
        affectedStories: { include: { feature: { include: { release: true } }, currentSprint: true } }
      }
    })));
    expect(view.impact.storyCount).toBe(1);
  });
});
