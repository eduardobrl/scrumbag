import { prisma } from "@/lib/db";
import { ReleaseStatus } from "@prisma/client";
import { SprintList } from "@/features/sprints/sprint-list";

export default async function SprintsPage() {
  const releases = await prisma.release.findMany({
    orderBy: [{ status: "asc" }, { startDate: "desc" }]
  });

  const activeRelease = releases.find((r) => r.status === ReleaseStatus.IN_PROGRESS);
  const selectedRelease = activeRelease ?? releases[0];

  const sprints = selectedRelease
    ? await prisma.sprint.findMany({
        where: { releaseId: selectedRelease.id },
        orderBy: { startDate: "asc" }
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Sprints</h1>
      </div>

      {!selectedRelease ? (
        <div className="rounded-lg border border-line bg-white p-6 text-center">
          <p className="text-sm text-slate-600">No release created yet.</p>
          <p className="mt-1 text-xs text-slate-500">Create a release to generate sprints.</p>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {selectedRelease.name}
            </h2>
            <span className="text-xs text-slate-500">
              {selectedRelease.startDate.toISOString().slice(0, 10)} to{" "}
              {selectedRelease.endDate.toISOString().slice(0, 10)}
            </span>
          </div>
          <SprintList sprints={sprints} />
        </section>
      )}
    </div>
  );
}
