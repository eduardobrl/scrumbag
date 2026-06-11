import { StoryStatus, type PrismaClient } from "@prisma/client";

type ReleaseEstimateDatabase = Pick<PrismaClient, "releaseEstimateBaseline" | "story">;

type BaselineStory = {
  id: string;
  storyPoints: number | null;
  estimatedDays: number | null;
};

function baselineInclude() {
  return {
    items: {
      orderBy: { storyId: "asc" as const }
    }
  };
}

export async function getReleaseEstimateBaseline(database: ReleaseEstimateDatabase, releaseId: string) {
  return database.releaseEstimateBaseline.findUnique({
    where: { releaseId },
    include: baselineInclude()
  });
}

export async function captureReleaseEstimateBaseline(database: ReleaseEstimateDatabase, releaseId: string) {
  const stories: BaselineStory[] = await database.story.findMany({
    where: {
      feature: { releaseId },
      status: { not: StoryStatus.CANCELLED }
    },
    select: {
      id: true,
      storyPoints: true,
      estimatedDays: true
    },
    orderBy: { createdAt: "asc" }
  });

  return database.releaseEstimateBaseline.upsert({
    where: { releaseId },
    create: {
      releaseId,
      items: {
        create: stories.map((story) => ({
          storyId: story.id,
          storyPoints: story.storyPoints,
          estimatedDays: story.estimatedDays
        }))
      }
    },
    update: {},
    include: baselineInclude()
  });
}
