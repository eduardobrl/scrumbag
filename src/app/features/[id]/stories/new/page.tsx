import { StoryForm } from "@/features/stories/story-form";
import { getFeatureDetails } from "@/lib/features";
import { notFound } from "next/navigation";

export default async function NewStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feature = await getFeatureDetails(id);

  if (!feature) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal text-ink">New Story</h1>
      <StoryForm fixedFeatureId={feature.id} features={[{ id: feature.id, name: feature.name }]} />
    </div>
  );
}
