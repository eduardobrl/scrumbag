import { FeatureForm } from "@/features/features/feature-form";
import { getFeatureDetails } from "@/lib/features";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function FeatureEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [feature, releases] = await Promise.all([
    getFeatureDetails(id),
    prisma.release.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] })
  ]);

  if (!feature) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal text-ink">Edit Feature</h1>
      <FeatureForm
        releases={releases.map((release) => ({ id: release.id, name: release.name }))}
        initial={{
          id: feature.id,
          releaseId: feature.releaseId,
          name: feature.name,
          description: feature.description ?? ""
        }}
      />
    </div>
  );
}
