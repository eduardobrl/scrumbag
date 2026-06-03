import { beforeEach, describe, expect, it } from "vitest";
import { ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { closeSprint, reopenSprint, validateSprintClosure } from "@/lib/sprint-closure";

async function seedClosure(status: SprintStatus = SprintStatus.IN_PROGRESS, withNext = true) {
  const release = await prisma.release.create({
    data: {
      name: "Closure Release",
      objective: "Close sprint",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 5,
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
  const nextSprint = withNext
    ? await prisma.sprint.create({
        data: {
          releaseId: release.id,
          name: "Sprint 2",
          startDate: new Date("2026-07-13T00:00:00.000Z"),
          endDate: new Date("2026-07-17T00:00:00.000Z"),
          status: SprintStatus.PLANNED
        }
      })
    : null;
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Closure" } });
  const backlogStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Backlog story",
      status: StoryStatus.SPRINT_BACKLOG,
      estimatedDays: 1
    }
  });
  const progressStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Progress story",
      status: StoryStatus.IN_PROGRESS,
      estimatedDays: 2
    }
  });
  const doneStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Done story",
      status: StoryStatus.DONE,
      estimatedDays: 3
    }
  });
  return { release, sprint, nextSprint, backlogStory, progressStory, doneStory };
}

beforeEach(async () => {
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
});

describe("sprint closure", () => {
  it("rejects planned and closed sprints", async () => {
    const planned = await seedClosure(SprintStatus.PLANNED);
    const plannedResult = await validateSprintClosure(planned.sprint.id);
    expect(plannedResult.ok).toBe(false);
    if (!plannedResult.ok) {
      expect(plannedResult.errors.status).toBe("Sprint must be in progress to close");
    }

    await prisma.leakageHistory.deleteMany();
    await prisma.story.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();

    const closed = await seedClosure(SprintStatus.CLOSED);
    const closedResult = await validateSprintClosure(closed.sprint.id);
    expect(closedResult.ok).toBe(false);
    if (!closedResult.ok) {
      expect(closedResult.errors.status).toBe("Sprint must be in progress to close");
    }
  });

  it("moves unfinished stories and leaves done stories in place", async () => {
    const { sprint, nextSprint, backlogStory, progressStory, doneStory } = await seedClosure();
    const result = await closeSprint(sprint.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.movedCount).toBe(2);
    const movedBacklog = await prisma.story.findUniqueOrThrow({ where: { id: backlogStory.id } });
    const movedProgress = await prisma.story.findUniqueOrThrow({ where: { id: progressStory.id } });
    const done = await prisma.story.findUniqueOrThrow({ where: { id: doneStory.id } });
    expect(movedBacklog.currentSprintId).toBe(nextSprint!.id);
    expect(movedProgress.currentSprintId).toBe(nextSprint!.id);
    expect(done.currentSprintId).toBe(sprint.id);
  });

  it("creates next sprint when none exists", async () => {
    const { sprint } = await seedClosure(SprintStatus.IN_PROGRESS, false);
    const result = await closeSprint(sprint.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.createdNewSprint).toBe(true);
    expect(result.data.destinationSprint.name).toBe("Sprint 2");
    expect(result.data.destinationSprint.status).toBe(SprintStatus.PLANNED);
    expect(result.data.destinationSprint.startDate.toISOString().slice(0, 10)).toBe("2026-07-13");
  });

  it("records leakage rows with origin, destination, and status", async () => {
    const { sprint, nextSprint } = await seedClosure();
    await closeSprint(sprint.id);

    const records = await prisma.leakageHistory.findMany({ orderBy: { statusAtEvent: "asc" } });
    expect(records).toHaveLength(2);
    expect(records.map((record) => record.originSprintId)).toEqual([sprint.id, sprint.id]);
    expect(records.map((record) => record.destinationSprintId)).toEqual([nextSprint!.id, nextSprint!.id]);
    expect(records.map((record) => record.statusAtEvent).sort()).toEqual([
      StoryStatus.IN_PROGRESS,
      StoryStatus.SPRINT_BACKLOG
    ]);
  });

  it("reopens closed sprints without deleting leakage records", async () => {
    const { sprint } = await seedClosure();
    await closeSprint(sprint.id);
    const result = await reopenSprint(sprint.id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(SprintStatus.IN_PROGRESS);
    }
    expect(await prisma.leakageHistory.count()).toBe(2);
  });
});
