import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { ReleaseSwitcher } from "@/components/release-switcher";
import { AnnualTimelineView, type AnnualTimelineLabels } from "@/features/timeline/annual-timeline-view";
import { navigationItems } from "@/lib/navigation";
import type { AnnualTimelineData } from "@/lib/annual-timeline";
import ptMessages from "@/messages/pt-BR.json";

vi.mock("next/navigation", () => ({
  usePathname: () => "/timeline",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));

vi.stubGlobal("React", React);

const labels: AnnualTimelineLabels = {
  title: "Timeline anual",
  subtitle: "Compare releases",
  comparisonTitle: "Comparação entre releases",
  release: "Release",
  features: "Features",
  stories: "Histórias",
  estimatedDays: "Dias estimados",
  completion: "Conclusão",
  sprints: "Sprints",
  remainingCapacity: "Capacidade restante",
  noReleases: "Nenhuma release encontrada para este ano.",
  noFeatures: "Nenhuma feature nesta release",
  orphanFeatures: "Features órfãs",
  noOrphanFeatures: "Nenhuma feature órfã.",
  active: "Ativa",
  finished: "Finalizada",
  cancelled: "Cancelada",
  unplanned: "Não planejada",
  legendActive: "Ativa",
  legendFinished: "Finalizada",
  legendCancelled: "Cancelada",
  legendGap: "Intervalo inativo",
  movedTo: "movida para",
  undo: "Desfazer"
};

const data: AnnualTimelineData = {
  year: 2026,
  months: [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez"
  ].map((label, index) => ({
    index,
    month: index + 1,
    year: 2026,
    label,
    shortLabel: label,
    startDate: `2026-${String(index + 1).padStart(2, "0")}-01`,
    endDate: `2026-${String(index + 1).padStart(2, "0")}-28`,
    quarter: (Math.floor(index / 3) + 1) as 1 | 2 | 3 | 4
  })),
  quarters: [1, 2, 3, 4].map((quarter) => ({
    quarter: quarter as 1 | 2 | 3 | 4,
    label: `Q${quarter}`,
    startIndex: (quarter - 1) * 3,
    endIndex: quarter * 3 - 1,
    monthCount: 3
  })),
  summaries: [
    {
      id: "release-1",
      name: "Release Alpha",
      status: "IN_PROGRESS",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      featureCount: 3,
      storyCount: 7,
      estimatedDays: 12,
      completionPercentage: 50,
      sprintCount: 2,
      totalCapacityDays: 40,
      plannedEffortDays: 10,
      remainingCapacityDays: 30
    },
    {
      id: "release-2",
      name: "Release Beta",
      status: "PLANNED",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      featureCount: 1,
      storyCount: 2,
      estimatedDays: 6,
      completionPercentage: 0,
      sprintCount: 1,
      totalCapacityDays: 20,
      plannedEffortDays: 6,
      remainingCapacityDays: 14
    }
  ],
  orphanFeatures: [
    {
      id: "feature-orphan",
      releaseId: null,
      name: "Orphan feature",
      status: "ACTIVE",
      storyCount: 1,
      estimatedDays: 3,
      completionPercentage: 0,
      startIndex: null,
      endIndex: null,
      activeMonthIndexes: [],
      inactiveGaps: []
    }
  ],
  releases: [
    {
      id: "release-1",
      name: "Release Alpha",
      status: "IN_PROGRESS",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      summary: null as never,
      features: [
        {
          id: "feature-active",
          releaseId: "release-1",
          name: "Active feature",
          status: "ACTIVE",
          storyCount: 2,
          estimatedDays: 5,
          completionPercentage: 40,
          startIndex: 0,
          endIndex: 2,
          activeMonthIndexes: [0, 2],
          inactiveGaps: [1]
        },
        {
          id: "feature-finished",
          releaseId: "release-1",
          name: "Finished feature",
          status: "FINISHED",
          storyCount: 1,
          estimatedDays: 2,
          completionPercentage: 100,
          startIndex: 1,
          endIndex: 1,
          activeMonthIndexes: [1],
          inactiveGaps: []
        },
        {
          id: "feature-cancelled",
          releaseId: "release-1",
          name: "Cancelled feature",
          status: "CANCELLED",
          storyCount: 1,
          estimatedDays: 1,
          completionPercentage: 0,
          startIndex: 2,
          endIndex: 2,
          activeMonthIndexes: [2],
          inactiveGaps: []
        }
      ]
    },
    {
      id: "release-2",
      name: "Release Beta",
      status: "PLANNED",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      summary: null as never,
      features: []
    }
  ]
};

data.releases[0].summary = data.summaries[0];
data.releases[1].summary = data.summaries[1];

function renderAnnualTimeline() {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="pt-BR" messages={ptMessages} timeZone="America/Araguaina">
      <AnnualTimelineView data={data} labels={labels} />
    </NextIntlClientProvider>
  );
}

describe("annual timeline UI", () => {
  it("renders quarter and month headers", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("Q1");
    expect(html).toContain("Q4");
    expect(html).toContain("Jan");
    expect(html).toContain("Dez");
  });

  it("renders cross-release metrics for multiple releases", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("Comparação entre releases");
    expect(html).toContain("Release Alpha");
    expect(html).toContain("Release Beta");
    expect(html).toContain("12.0d");
    expect(html).toContain("14.0d");
  });

  it("renders feature links and status styles", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("/features/feature-active");
    expect(html).toContain("/features/feature-finished");
    expect(html).toContain("/features/feature-cancelled");
    expect(html).toContain("/features/feature-orphan");
    expect(html).toContain("Features órfãs");
    expect(html).toContain("Intervalo inativo");
    expect(html).toContain("line-through");
    expect(html).toContain("Nenhuma feature nesta release");
  });

  it("renders localized release status labels in swimlane headers", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("Em andamento");
    expect(html).toContain("Planejado");
  });

  it("adds the timeline item after impediments and before squad", () => {
    const labels = navigationItems.map((item) => item.labelKey);

    expect(labels.slice(labels.indexOf("impediments"), labels.indexOf("squad") + 1)).toEqual([
      "impediments",
      "timeline",
      "squad"
    ]);
  });

  it("renders the timeline release switcher variant without a release select", () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="pt-BR" messages={ptMessages} timeZone="America/Araguaina">
        <ReleaseSwitcher
          defaultReleaseId="release-1"
          releases={[
            {
              id: "release-1",
              name: "Release Alpha",
              status: "IN_PROGRESS",
              capacityLabel: "Capacidade: 10 / 20 dias",
              overCapacity: false
            }
          ]}
        />
      </NextIntlClientProvider>
    );

    expect(html).toContain("Contexto anual");
    expect(html).toContain("Não filtrado por release");
    expect(html).not.toContain("<select");
  });
});
