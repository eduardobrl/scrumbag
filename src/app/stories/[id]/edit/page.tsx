import { StoryForm } from "@/features/stories/story-form";
import { prisma } from "@/lib/db";
import { getStoryEstimateHistory } from "@/lib/estimate-changes";
import { listFeatures, listOrphanFeatures } from "@/lib/features";
import { getStoryDetails, toStoryView } from "@/lib/stories";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function StoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryDetails(id);
  const tStories = await getTranslations("stories");

  if (!story) {
    notFound();
  }

  const features = story.feature.releaseId ? await listFeatures(story.feature.releaseId) : await listOrphanFeatures();
  const view = toStoryView(story);
  const estimateHistory = await getStoryEstimateHistory(prisma, story.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal text-ink">{tStories("edit")}</h1>
      <StoryForm
        features={features.map((feature) => ({ id: feature.id, name: feature.name }))}
        releaseStatus={story.feature.release?.status}
        estimateHistory={estimateHistory.map((change) => ({
          ...change,
          timestamp: change.timestamp.toISOString()
        }))}
        initial={view}
      />
    </div>
  );
}
