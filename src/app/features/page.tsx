import { FeatureForm } from "@/features/features/feature-form";
import { FeatureList } from "@/features/features/feature-list";
import { listFeatures, toFeatureView } from "@/lib/features";
import { prisma } from "@/lib/db";
import { ReleaseStatus } from "@prisma/client";

export default async function FeaturesPage({
  searchParams
}: {
  searchParams?: Promise<{ releaseId?: string }>;
}) {
  const releases = await prisma.release.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });
  const sp = searchParams ? await searchParams : {};
  const selectedRelease =
    (sp.releaseId ? releases.find((release) => release.id === sp.releaseId) : undefined) ??
    releases.find((release) => release.status === ReleaseStatus.IN_PROGRESS) ??
    releases[0];
  const features = selectedRelease ? await listFeatures(selectedRelease.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Features / Histórias</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Nova feature</h2>
          <FeatureForm
            releases={releases.map((release) => ({ id: release.id, name: release.name }))}
            selectedReleaseId={selectedRelease?.id}
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {selectedRelease ? `${selectedRelease.name} features (${features.length})` : "Features"}
            </h2>
          </div>
          <FeatureList features={features.map(toFeatureView)} />
        </section>
      </div>
    </div>
  );
}
