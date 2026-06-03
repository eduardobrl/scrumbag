import { StoryForm } from "@/features/stories/story-form";
import { listFeatures } from "@/lib/features";
import { getStoryDetails, toStoryView } from "@/lib/stories";
import { notFound } from "next/navigation";

export default async function StoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const story = await getStoryDetails(id);

  if (!story) {
    notFound();
  }

  const features = await listFeatures(story.feature.releaseId);
  const view = toStoryView(story);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal text-ink">Edit Story</h1>
      <StoryForm
        features={features.map((feature) => ({ id: feature.id, name: feature.name }))}
        initial={view}
      />
    </div>
  );
}
