import { SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ClosureValidation =
  | { ok: true; data: { finishedCount: number; unfinishedCount: number } }
  | { ok: false; errors: Record<string, string> };

export async function validateSprintClosure(sprintId: string): Promise<ClosureValidation> {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { stories: true }
  });

  if (!sprint) {
    return { ok: false, errors: { sprintId: "Sprint not found" } };
  }

  if (sprint.status !== SprintStatus.IN_PROGRESS) {
    return { ok: false, errors: { status: "Sprint must be in progress to close" } };
  }

  const activeStories = sprint.stories.filter((story) => story.status !== StoryStatus.CANCELLED);
  const finishedCount = activeStories.filter((story) => story.status === StoryStatus.DONE).length;

  return {
    ok: true,
    data: {
      finishedCount,
      unfinishedCount: activeStories.length - finishedCount
    }
  };
}

export async function closeSprint(sprintId: string) {
  const validation = await validateSprintClosure(sprintId);
  if (!validation.ok) return validation;

  const sprint = await prisma.sprint.findUniqueOrThrow({
    where: { id: sprintId },
    include: { release: true }
  });
  const unfinishedStories = await prisma.story.findMany({
    where: {
      currentSprintId: sprintId,
      status: { notIn: [StoryStatus.DONE, StoryStatus.CANCELLED] }
    }
  });

  const nextExisting = await prisma.sprint.findFirst({
    where: {
      releaseId: sprint.releaseId,
      startDate: { gt: sprint.startDate }
    },
    orderBy: { startDate: "asc" }
  });

  let createdNewSprint = false;
  const destinationSprint =
    nextExisting ??
    (await prisma.sprint.create({
      data: {
        releaseId: sprint.releaseId,
        name: `Sprint ${(await countReleaseSprints(sprint.releaseId)) + 1}`,
        startDate: nextBusinessDayAfter(sprint.endDate),
        endDate: addBusinessDays(
          nextBusinessDayAfter(sprint.endDate),
          sprint.release.defaultSprintLengthBusinessDays - 1
        ),
        status: SprintStatus.PLANNED
      }
    }));
  createdNewSprint = !nextExisting;

  const closedSprint = await prisma.$transaction(async (tx) => {
    const closed = await tx.sprint.update({
      where: { id: sprintId },
      data: { status: SprintStatus.CLOSED }
    });

    for (const story of unfinishedStories) {
      await tx.story.update({
        where: { id: story.id },
        data: { currentSprintId: destinationSprint.id }
      });
      await tx.leakageHistory.create({
        data: {
          storyId: story.id,
          originSprintId: sprintId,
          destinationSprintId: destinationSprint.id,
          statusAtEvent: story.status
        }
      });
    }

    return closed;
  });

  return {
    ok: true as const,
    data: {
      closedSprint,
      destinationSprint,
      movedCount: unfinishedStories.length,
      createdNewSprint
    }
  };
}

export async function reopenSprint(sprintId: string) {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) {
    return { ok: false as const, errors: { sprintId: "Sprint not found" } };
  }
  if (sprint.status !== SprintStatus.CLOSED) {
    return { ok: false as const, errors: { status: "Sprint must be closed to reopen" } };
  }

  const reopenedSprint = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: SprintStatus.IN_PROGRESS }
  });

  return { ok: true as const, data: reopenedSprint };
}

async function countReleaseSprints(releaseId: string): Promise<number> {
  return prisma.sprint.count({ where: { releaseId } });
}

function nextBusinessDayAfter(date: Date): Date {
  const next = new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  do {
    next.setUTCDate(next.getUTCDate() + 1);
  } while (!isBusinessDay(next));
  return next;
}

function addBusinessDays(start: Date, daysToAdd: number): Date {
  const date = new Date(start);
  let added = 0;
  while (added < daysToAdd) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (isBusinessDay(date)) {
      added++;
    }
  }
  return date;
}

function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}
