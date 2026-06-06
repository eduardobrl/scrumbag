import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnnualTimelineData, AnnualTimelineFeature } from "@/lib/annual-timeline";

export type AnnualTimelineLabels = {
  title: string;
  subtitle: string;
  comparisonTitle: string;
  release: string;
  features: string;
  stories: string;
  estimatedDays: string;
  completion: string;
  sprints: string;
  remainingCapacity: string;
  noReleases: string;
  noFeatures: string;
  active: string;
  finished: string;
  cancelled: string;
  unplanned: string;
  legendActive: string;
  legendFinished: string;
  legendCancelled: string;
  legendGap: string;
};

export function AnnualTimelineView({
  data,
  labels
}: {
  data: AnnualTimelineData;
  labels: AnnualTimelineLabels;
}) {
  if (data.releases.length === 0) {
    return (
      <Card>
        <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{labels.noReleases}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">{labels.comparisonTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{labels.subtitle}</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4 font-semibold">{labels.release}</th>
                <th className="px-3 py-2 font-semibold">{labels.features}</th>
                <th className="px-3 py-2 font-semibold">{labels.stories}</th>
                <th className="px-3 py-2 font-semibold">{labels.estimatedDays}</th>
                <th className="px-3 py-2 font-semibold">{labels.completion}</th>
                <th className="px-3 py-2 font-semibold">{labels.sprints}</th>
                <th className="px-3 py-2 font-semibold">{labels.remainingCapacity}</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.map((summary) => (
                <tr key={summary.id} className="border-b border-line last:border-b-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{summary.name}</div>
                    <div className="text-xs text-slate-500">
                      {summary.startDate} - {summary.endDate}
                    </div>
                  </td>
                  <td className="px-3 py-3">{summary.featureCount}</td>
                  <td className="px-3 py-3">{summary.storyCount}</td>
                  <td className="px-3 py-3">{summary.estimatedDays.toFixed(1)}d</td>
                  <td className="px-3 py-3">{summary.completionPercentage}%</td>
                  <td className="px-3 py-3">{summary.sprintCount}</td>
                  <td
                    className={clsx(
                      "px-3 py-3 font-medium",
                      summary.remainingCapacityDays < 0 ? "text-red-700" : "text-emerald-700"
                    )}
                  >
                    {summary.remainingCapacityDays.toFixed(1)}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{labels.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <Legend swatch="bg-accent" label={labels.legendActive} />
            <Legend swatch="bg-emerald-600" label={labels.legendFinished} />
            <Legend swatch="border border-slate-300 bg-slate-100" label={labels.legendCancelled} />
            <Legend swatch="border border-dashed border-slate-300 bg-white" label={labels.legendGap} />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[1120px] gap-1 text-sm"
            style={{ gridTemplateColumns: "220px repeat(12, minmax(72px, 1fr))" }}
          >
            <div />
            {data.quarters.map((quarter) => (
              <div
                key={quarter.quarter}
                className="rounded-md border border-line bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-600"
                style={{ gridColumn: `span ${quarter.monthCount}` }}
              >
                {quarter.label}
              </div>
            ))}
            <div />
            {data.months.map((month) => (
              <div
                key={month.index}
                className="rounded-md border border-line bg-white px-2 py-2 text-center text-xs font-semibold text-slate-600"
              >
                {month.label}
              </div>
            ))}

            {data.releases.map((release) => (
              <ReleaseSwimlane key={release.id} release={release} labels={labels} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={clsx("h-2 w-5 rounded", swatch)} />
      {label}
    </span>
  );
}

function ReleaseSwimlane({
  release,
  labels
}: {
  release: AnnualTimelineData["releases"][number];
  labels: AnnualTimelineLabels;
}) {
  return (
    <>
      <div className="col-span-full mt-3 rounded-md border border-line bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{release.name}</span>
          <Badge tone={release.status === "IN_PROGRESS" ? "success" : "neutral"}>{release.status}</Badge>
          <span className="text-xs text-slate-500">
            {release.startDate} - {release.endDate}
          </span>
        </div>
      </div>
      {release.features.length === 0 ? (
        <>
          <div className="flex min-h-11 items-center text-sm text-slate-500">{labels.noFeatures}</div>
          {Array.from({ length: 12 }, (_, index) => (
            <div key={`${release.id}-empty-${index}`} className="min-h-11 rounded-sm border border-transparent" />
          ))}
        </>
      ) : (
        release.features.map((feature) => <FeatureRow key={feature.id} feature={feature} labels={labels} />)
      )}
    </>
  );
}

function FeatureRow({ feature, labels }: { feature: AnnualTimelineFeature; labels: AnnualTimelineLabels }) {
  const activeSet = new Set(feature.activeMonthIndexes);
  const statusLabel =
    feature.status === "CANCELLED" ? labels.cancelled : feature.status === "FINISHED" ? labels.finished : labels.active;

  return (
    <>
      <Link
        href={`/features/${feature.id}`}
        className={clsx(
          "flex min-h-11 items-center gap-2 overflow-hidden text-sm font-medium text-accent hover:underline",
          feature.status === "CANCELLED" && "text-slate-500 line-through"
        )}
      >
        <span className="min-w-0 truncate">{feature.name}</span>
        <span className="shrink-0 text-xs font-normal text-slate-500">{feature.completionPercentage}%</span>
      </Link>
      {Array.from({ length: 12 }, (_, index) => {
        const inSpan = feature.startIndex !== null && feature.endIndex !== null && index >= feature.startIndex && index <= feature.endIndex;
        const activeHere = activeSet.has(index);
        const isGap = inSpan && !activeHere;

        return (
          <div key={`${feature.id}-${index}`} className="flex min-h-11 items-center">
            {inSpan ? (
              <Link
                href={`/features/${feature.id}`}
                className={clsx(
                  "h-5 w-full rounded-sm border",
                  feature.status === "CANCELLED"
                    ? "border-slate-300 bg-slate-100"
                    : feature.status === "FINISHED"
                      ? "border-transparent bg-emerald-600"
                      : isGap
                        ? "border-dashed border-slate-300 bg-white"
                        : "border-transparent bg-accent"
                )}
                title={`${feature.name} - ${isGap ? labels.legendGap : statusLabel}`}
                aria-label={`${feature.name} - ${isGap ? labels.legendGap : statusLabel}`}
              />
            ) : index === 0 && feature.startIndex === null ? (
              <div className="flex h-5 w-full items-center rounded-sm border border-dashed border-slate-300 bg-white px-2 text-[11px] text-slate-500">
                {labels.unplanned}
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
