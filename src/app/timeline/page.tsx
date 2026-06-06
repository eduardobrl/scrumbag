import { getTranslations } from "next-intl/server";
import { AnnualTimelineView, type AnnualTimelineLabels } from "@/features/timeline/annual-timeline-view";
import { YearSelector } from "@/features/timeline/year-selector";
import { buildAnnualTimelineData } from "@/lib/annual-timeline";

export const dynamic = "force-dynamic";

function parseYear(value: string | undefined): number {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 2000 || numeric > 2100) {
    return new Date().getFullYear();
  }

  return numeric;
}

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const year = parseYear(sp.year);
  const [data, t] = await Promise.all([buildAnnualTimelineData(year), getTranslations("timeline")]);
  const labels: AnnualTimelineLabels = {
    title: t("annualTitle"),
    subtitle: t("annualSubtitle"),
    comparisonTitle: t("comparisonTitle"),
    release: t("release"),
    features: t("features"),
    stories: t("stories"),
    estimatedDays: t("estimatedDays"),
    completion: t("completion"),
    sprints: t("sprints"),
    remainingCapacity: t("remainingCapacity"),
    noReleases: t("noReleases"),
    noFeatures: t("noFeatures"),
    active: t("active"),
    finished: t("finished"),
    cancelled: t("cancelled"),
    unplanned: t("unplanned"),
    legendActive: t("legendActive"),
    legendFinished: t("legendFinished"),
    legendCancelled: t("legendCancelled"),
    legendGap: t("legendGap"),
    movedTo: t("movedTo"),
    undo: t("undo")
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">{t("annualTitle")}</h1>
          <p className="mt-1 text-sm text-slate-600">{t("annualSubtitle")}</p>
        </div>
        <YearSelector year={year} label={t("year")} />
      </div>

      <AnnualTimelineView data={data} labels={labels} />
    </div>
  );
}
