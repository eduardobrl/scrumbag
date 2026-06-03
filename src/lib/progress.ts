import { StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function calculateReleaseProgress(releaseId: string): Promise<number> {
  const stories = await prisma.story.findMany({
    where: {
      status: { not: StoryStatus.CANCELLED },
      feature: { releaseId }
    },
    select: { storyPoints: true, status: true }
  });

  if (stories.length === 0) return 0;

  const totalStoryPoints = stories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0);
  const finishedStories = stories.filter((story) => story.status === StoryStatus.DONE);

  if (totalStoryPoints > 0) {
    const finishedStoryPoints = finishedStories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0);
    return finishedStoryPoints / totalStoryPoints;
  }

  return finishedStories.length / stories.length;
}

export async function calculateSprintProgress(sprintId: string): Promise<number> {
  const stories = await prisma.story.findMany({
    where: {
      currentSprintId: sprintId,
      status: { not: StoryStatus.CANCELLED }
    },
    select: { estimatedDays: true, status: true }
  });

  const plannedDays = stories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);
  if (plannedDays === 0) return 0;

  const finishedDays = stories
    .filter((story) => story.status === StoryStatus.DONE)
    .reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);

  return finishedDays / plannedDays;
}
