import { ImpedimentForm } from "@/features/impediments/impediment-form";
import { ImpedimentList } from "@/features/impediments/impediment-list";
import { prisma } from "@/lib/db";
import { listImpedimentsByRelease, toImpedimentView } from "@/lib/impediments";
import { ReleaseStatus, StoryStatus } from "@prisma/client";

export default async function ImpedimentsPage({
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

  const stories = selectedRelease
    ? await prisma.story.findMany({
        where: {
          status: { not: StoryStatus.CANCELLED },
          feature: { releaseId: selectedRelease.id }
        },
        include: { feature: true },
        orderBy: [{ title: "asc" }]
      })
    : [];
  const impediments = selectedRelease ? await listImpedimentsByRelease(selectedRelease.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">Impedimentos</h1>
          {selectedRelease && <p className="text-sm text-slate-500">{selectedRelease.name}</p>}
        </div>
      </div>

      {!selectedRelease ? (
        <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-slate-600">
          Crie uma release antes de registrar impedimentos.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="space-y-3">
            {stories.length === 0 ? (
              <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-slate-600">
                Crie historias ativas nesta release antes de registrar impedimentos.
              </div>
            ) : (
              <ImpedimentForm
                stories={stories.map((story) => ({
                  id: story.id,
                  title: story.title,
                  featureName: story.feature.name,
                  estimatedDays: story.estimatedDays,
                  status: story.status
                }))}
                selectedReleaseId={selectedRelease.id}
                defaultReportedDate={new Date().toISOString().slice(0, 10)}
              />
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {selectedRelease.name} impedimentos ({impediments.length})
              </h2>
            </div>
            <ImpedimentList impediments={impediments.map(toImpedimentView)} releaseId={selectedRelease.id} />
          </section>
        </div>
      )}
    </div>
  );
}
