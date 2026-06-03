import { prisma } from "@/lib/db";
import { ReleaseStatus } from "@prisma/client";
import { SprintList } from "@/features/sprints/sprint-list";
import { ReleaseSelector } from "@/features/sprints/release-selector";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";

export default async function SprintsPage({
  searchParams
}: {
  searchParams?: Promise<{ releaseId?: string }>;
}) {
  const releases = await prisma.release.findMany({
    orderBy: [{ status: "asc" }, { startDate: "desc" }]
  });

  const sp = searchParams ? await searchParams : {};
  const selectedRelease =
    sp.releaseId
      ? releases.find((r) => r.id === sp.releaseId)
      : (releases.find((r) => r.status === ReleaseStatus.IN_PROGRESS) ?? releases[0]);

  const sprintsRaw = selectedRelease
    ? await prisma.sprint.findMany({
        where: { releaseId: selectedRelease.id },
        orderBy: { startDate: "asc" }
      })
    : [];
  const sprints = await Promise.all(
    sprintsRaw.map(async (sprint) => {
      const summary = await getSprintPlanningSummary(sprint.id);
      return {
        ...sprint,
        plannedEffortDays: summary.plannedEffortDays,
        capacityDays: summary.capacityDays,
        remainingCapacityDays: summary.remainingCapacityDays,
        occupancyPercentage: summary.occupancyPercentage,
        riskLabel: summary.riskLabel
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Sprints</h1>
        <ReleaseSelector
          releases={releases.map((r) => ({ id: r.id, name: r.name }))}
          selectedId={selectedRelease?.id ?? ""}
        />
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
