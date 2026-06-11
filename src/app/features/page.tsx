import { FeatureForm } from "@/features/features/feature-form";
import { FeatureList } from "@/features/features/feature-list";
import { listFeatures, listOrphanFeatures, toFeatureView } from "@/lib/features";
import { prisma } from "@/lib/db";
import { ReleaseStatus } from "@prisma/client";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const ORPHAN_RELEASE_FILTER = "orphans";

export default async function FeaturesPage({
  searchParams
}: {
  searchParams?: Promise<{ releaseId?: string }>;
}) {
  const releases = await prisma.release.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });
  const tFeatures = await getTranslations("features");
  const sp = searchParams ? await searchParams : {};
  const showingOrphans = sp.releaseId === ORPHAN_RELEASE_FILTER;
  const selectedRelease =
    showingOrphans
      ? undefined
      : (sp.releaseId ? releases.find((release) => release.id === sp.releaseId) : undefined) ??
        releases.find((release) => release.status === ReleaseStatus.IN_PROGRESS) ??
        releases[0];
  const features = showingOrphans || !selectedRelease ? await listOrphanFeatures() : await listFeatures(selectedRelease.id);

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
            selectedReleaseId={showingOrphans ? undefined : selectedRelease?.id}
          />
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {showingOrphans || !selectedRelease
                ? `${tFeatures("orphanFeatures")} (${features.length})`
                : `${selectedRelease.name} features (${features.length})`}
            </h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                className={`rounded-md border px-3 py-2 ${
                  showingOrphans ? "border-accent bg-teal-50 text-accent" : "border-line bg-white text-slate-700"
                }`}
                href="/features?releaseId=orphans"
              >
                {tFeatures("orphanFeatures")}
              </Link>
              {releases.map((release) => (
                <Link
                  key={release.id}
                  className={`rounded-md border px-3 py-2 ${
                    selectedRelease?.id === release.id && !showingOrphans
                      ? "border-accent bg-teal-50 text-accent"
                      : "border-line bg-white text-slate-700"
                  }`}
                  href={`/features?releaseId=${encodeURIComponent(release.id)}`}
                >
                  {release.name}
                </Link>
              ))}
            </div>
          </div>
          <FeatureList features={features.map(toFeatureView)} />
        </section>
      </div>
    </div>
  );
}
