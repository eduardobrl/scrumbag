import Link from "next/link";
import { CheckCircle2, CircleAlert, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TimelineData } from "@/lib/timeline";
import { countBusinessDaysInRange } from "@/lib/date-utils";

export function TimelineView({ data }: { data: TimelineData }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Timeline da release</h2>
          <p className="mt-1 text-sm text-slate-600">Features distribuídas nas sprints planejadas</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded bg-accent" /> Intervalo da feature</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded border border-slate-300 bg-white" /> Intervalo inativo</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-5 rounded bg-rose-600" /> Impedimento</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-rose-700" aria-hidden /> Impedimento resolvido</span>
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-700" aria-hidden /> Sprint finalizada</span>
          <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3 text-amber-700" aria-hidden /> Sprint com vazamento</span>
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
                {sprint.isFinished ? <CheckCircle2 className="h-3 w-3 text-emerald-700" aria-label="Sprint finalizada" /> : null}
                {data.leakedSprints.includes(sprint.id) ? <Flag className="h-3 w-3 text-amber-700" aria-label="Sprint com vazamento" /> : null}
              </div>
              <div className="mt-1 text-[11px] font-normal text-slate-500">
                {sprint.startDate} - {sprint.endDate}
              </div>
              <div className="text-[11px] font-normal text-slate-500">
                {countBusinessDaysInRange(sprint.startDate, sprint.endDate)} dias úteis
              </div>
            </div>
          ))}

          {data.features.map((feature) => (
            <TimelineRow key={feature.id} feature={feature} sprints={data.sprints} />
          ))}

          {data.impediments.length > 0 ? (
            <>
              <div className="col-span-full pt-3 text-xs font-semibold uppercase text-slate-500">Impedimentos</div>
              {data.impediments.map((impediment) => (
                <TimelineImpedimentRow key={impediment.id} impediment={impediment} sprints={data.sprints} />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function TimelineImpedimentRow({
  impediment,
  sprints
}: {
  impediment: TimelineData["impediments"][number];
  sprints: TimelineData["sprints"];
}) {
  const hasSpan = impediment.startIndex !== null && impediment.endIndex !== null;

  return (
    <>
      <div className="flex min-h-11 items-center gap-2 text-sm font-medium text-rose-800">
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 truncate" title={impediment.impactText}>
          {impediment.title}
        </span>
        <span className="shrink-0 text-xs font-normal text-slate-500">{impediment.affectedStoryCount} hist.</span>
      </div>
      {sprints.map((sprint, index) => {
        const inSpan = hasSpan && index >= impediment.startIndex! && index <= impediment.endIndex!;
        const showUnassigned = !hasSpan && index === 0;

        return (
          <div key={`${impediment.id}-${sprint.id}`} className="flex min-h-11 items-center">
            {inSpan ? (
              <div
                className="flex h-5 w-full items-center justify-end rounded-sm border border-rose-700 bg-rose-600 px-1 text-white"
                title={impediment.impactText}
              >
                {impediment.status === "RESOLVED" ? <CheckCircle2 className="h-3 w-3" aria-label="Impedimento resolvido" /> : null}
              </div>
            ) : showUnassigned ? (
              <div
                className="flex h-5 w-full items-center rounded-sm border border-dashed border-rose-300 bg-rose-50 px-2 text-[11px] text-rose-800"
                title={impediment.impactText}
              >
                Sem sprint
              </div>
            ) : (
              <div className="h-5 w-full rounded-sm border border-transparent" />
            )}
          </div>
        );
      })}
    </>
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
                title={`${feature.name} ${isGap ? "inativo" : "ativo"}`}
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
