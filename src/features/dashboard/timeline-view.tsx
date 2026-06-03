import Link from "next/link";
import { CheckCircle2, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TimelineData } from "@/lib/timeline";

export function TimelineView({ data }: { data: TimelineData }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Release timeline</h2>
          <p className="mt-1 text-sm text-slate-600">Feature spans across planned sprints</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded bg-accent" /> Feature span</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded border border-slate-300 bg-white" /> Inactive gap</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-700" aria-hidden /> Finished sprint</span>
          <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3 text-amber-700" aria-hidden /> Leaked sprint</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div
          className="grid min-w-[860px] gap-1 text-sm"
          style={{ gridTemplateColumns: `220px repeat(${Math.max(data.sprints.length, 1)}, minmax(96px, 1fr))` }}
        >
          <div />
          {data.sprints.map((sprint) => (
            <div key={sprint.id} className="rounded-md border border-line bg-slate-50 p-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-1">
                <span>{sprint.name}</span>
                {sprint.isFinished ? <CheckCircle2 className="h-3 w-3 text-emerald-700" aria-label="Finished sprint" /> : null}
                {data.leakedSprints.includes(sprint.id) ? <Flag className="h-3 w-3 text-amber-700" aria-label="Leaked sprint" /> : null}
              </div>
              <div className="mt-1 text-[11px] font-normal text-slate-500">{sprint.startDate}</div>
            </div>
          ))}

          {data.features.map((feature) => (
            <TimelineRow key={feature.id} feature={feature} sprints={data.sprints} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function TimelineRow({
  feature,
  sprints
}: {
  feature: TimelineData["features"][number];
  sprints: TimelineData["sprints"];
}) {
  const activeSet = new Set(feature.activeSprintIds);

  return (
    <>
      <Link href={`/features/${feature.id}`} className="flex min-h-11 items-center text-sm font-medium text-accent hover:underline">
        {feature.name}
        <span className="ml-2 text-xs font-normal text-slate-500">{feature.completionProgress}%</span>
      </Link>
      {sprints.map((sprint, index) => {
        const inSpan = feature.startIndex !== null && feature.endIndex !== null && index >= feature.startIndex && index <= feature.endIndex;
        const isGap = feature.inactiveGaps.includes(index);
        const activeHere = activeSet.has(sprint.id);
        const barClass = feature.isFinished ? "bg-emerald-600" : "bg-accent";

        return (
          <div key={`${feature.id}-${sprint.id}`} className="flex min-h-11 items-center">
            {inSpan ? (
              <Link
                href={`/features/${feature.id}`}
                className={`h-5 w-full rounded-sm border ${
                  isGap || !activeHere
                    ? "border-slate-300 bg-white"
                    : `border-transparent ${barClass}`
                }`}
                title={`${feature.name} ${isGap ? "inactive" : "active"}`}
              />
            ) : (
              <div className="h-5 w-full rounded-sm border border-transparent" />
            )}
          </div>
        );
      })}
    </>
  );
}
