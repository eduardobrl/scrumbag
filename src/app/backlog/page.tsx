import { BacklogFilters } from "@/features/backlog/backlog-filters";
import { BacklogList } from "@/features/backlog/backlog-list";
import { listBacklogStories } from "@/lib/backlog";
import { listFeatures } from "@/lib/features";
import { toStoryView } from "@/lib/stories";
import { prisma } from "@/lib/db";
import { ReleaseStatus, StoryStatus } from "@prisma/client";

export default async function BacklogPage({
  searchParams
}: {
  searchParams?: Promise<{
    releaseId?: string;
    featureId?: string;
    status?: string;
    q?: string;
    unplannedOnly?: string;
    includeCanceled?: string;
  }>;
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
  const sprints = selectedRelease
    ? await prisma.sprint.findMany({ where: { releaseId: selectedRelease.id }, orderBy: { startDate: "asc" } })
    : [];
  const stories = selectedRelease
    ? await listBacklogStories({
        releaseId: selectedRelease.id,
        featureId: sp.featureId,
        status: sp.status ? (sp.status as StoryStatus) : "ALL",
        q: sp.q,
        unplannedOnly: sp.unplannedOnly !== "false",
        includeCanceled: sp.includeCanceled === "true"
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Backlog</h1>
      </div>

      {!selectedRelease ? (
        <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-slate-600">
          Crie uma release antes de planejar histórias do backlog.
        </div>
      ) : (
        <>
          <BacklogFilters
            releases={releases.map((release) => ({ id: release.id, name: release.name }))}
            features={features.map((feature) => ({ id: feature.id, name: feature.name }))}
            selectedReleaseId={selectedRelease.id}
          />
          <BacklogList
            stories={stories.map(toStoryView)}
            sprints={sprints.map((sprint) => ({
              id: sprint.id,
              name: sprint.name,
              startDate: sprint.startDate.toISOString().slice(0, 10),
              endDate: sprint.endDate.toISOString().slice(0, 10)
            }))}
          />
        </>
      )}
    </div>
  );
}
