import { beforeEach, describe, expect, it } from "vitest";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { POST as closeSprintPost } from "@/app/api/sprints/[id]/close/route";
import { POST as reopenSprintPost } from "@/app/api/sprints/[id]/reopen/route";

async function seedApiSprint(status: SprintStatus) {
  const release = await prisma.release.create({
    data: {
      name: "API Release",
      objective: "Close sprint",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status
    }
  });
  const nextSprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "API Feature" } });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Move me",
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  return { release, sprint, nextSprint };
}

beforeEach(async () => {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

describe("sprint closure APIs", () => {
  it("returns 400 for closing planned sprints", async () => {
    const { sprint } = await seedApiSprint(SprintStatus.PLANNED);
    const response = await closeSprintPost(new Request("http://localhost"), { params: Promise.resolve({ id: sprint.id }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.errors.status).toBe("Sprint must be in progress to close");
  });

  it("returns moved count and destination sprint when close succeeds", async () => {
    const { sprint, nextSprint } = await seedApiSprint(SprintStatus.IN_PROGRESS);
    const response = await closeSprintPost(new Request("http://localhost"), { params: Promise.resolve({ id: sprint.id }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.movedCount).toBe(1);
    expect(payload.destinationSprint.id).toBe(nextSprint.id);
  });

  it("returns 400 for reopening non-closed sprints", async () => {
    const { sprint } = await seedApiSprint(SprintStatus.IN_PROGRESS);
    const response = await reopenSprintPost(new Request("http://localhost"), { params: Promise.resolve({ id: sprint.id }) });

    expect(response.status).toBe(400);
  });

  it("reopens closed sprints", async () => {
    const { sprint } = await seedApiSprint(SprintStatus.CLOSED);
    const response = await reopenSprintPost(new Request("http://localhost"), { params: Promise.resolve({ id: sprint.id }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.sprint.status).toBe(SprintStatus.IN_PROGRESS);
  });
});
