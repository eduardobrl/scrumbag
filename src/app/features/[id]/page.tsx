import { FeatureDetail } from "@/features/features/feature-detail";
import { getFeatureDetails, toFeatureView } from "@/lib/features";
import { toStoryView } from "@/lib/stories";
import { notFound } from "next/navigation";

export default async function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feature = await getFeatureDetails(id);

  if (!feature) {
    notFound();
  }

  return (
    <FeatureDetail
      feature={toFeatureView(feature)}
      stories={feature.stories.map((story) =>
        toStoryView({
          ...story,
          feature: { ...feature, release: feature.release }
        })
      )}
    />
  );
}
