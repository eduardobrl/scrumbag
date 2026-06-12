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
  title: "Timeline por sprint",
  subtitle: "Compare releases por sprints",
  comparisonTitle: "Comparação entre releases",
  release: "Release",
  features: "Features",
  stories: "Histórias",
  estimatedDays: "Dias estimados",
  completion: "Conclusão",
  sprints: "Sprints",
  remainingCapacity: "Capacidade restante",
  overCapacity: "Estouro",
  surplus: "Sobra",
  releaseOverflow: "Estouro da release",
  sprintOverflow: "Estouro da sprint",
  capacity: "Capacidade",
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
  planned: "Plan.",
  current: "Atual",
  movedTo: "movida para",
  undo: "Desfazer"
};

const data: AnnualTimelineData = {
  year: 2026,
  sprints: [
    ["sprint-a-1", "release-1", "Sprint 1", "2026-01-01", "2026-01-14"],
    ["sprint-a-2", "release-1", "Sprint 2", "2026-01-15", "2026-01-28"],
    ["sprint-a-3", "release-1", "Sprint 3", "2026-01-29", "2026-02-11"],
    ["sprint-b-1", "release-2", "Sprint 1", "2026-07-01", "2026-07-14"]
  ].map(([id, releaseId, name, startDate, endDate], index) => ({
    index,
    id,
    releaseId,
    name,
    label: name,
    shortLabel: `S${index === 3 ? 1 : index + 1}`,
    startDate,
    endDate,
    status: "PLANNED",
    netCapacityDays: 10,
    plannedEffortDays: index === 0 ? 16 : index === 1 ? 2 : index === 2 ? 3 : 6,
    remainingCapacityDays: index === 0 ? -6 : index === 1 ? 8 : index === 2 ? 7 : 4,
    overCapacityDays: index === 0 ? 6 : 0
  })),
  releaseBands: [
    {
      releaseId: "release-1",
      label: "Release Alpha",
      status: "IN_PROGRESS",
      startIndex: 0,
      endIndex: 2,
      sprintCount: 3,
      startDate: "2026-01-01",
      endDate: "2026-03-31"
    },
    {
      releaseId: "release-2",
      label: "Release Beta",
      status: "PLANNED",
      startIndex: 3,
      endIndex: 3,
      sprintCount: 1,
      startDate: "2026-07-01",
      endDate: "2026-09-30"
    }
  ],
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
      remainingCapacityDays: 30,
      overCapacityDays: 0
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
      remainingCapacityDays: 14,
      overCapacityDays: 0
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
      activeSprintIndexes: [],
      plannedSprintIndexes: [],
      inactiveGaps: [],
      hasPlanBaseline: false,
      sprintAllocations: []
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
          activeSprintIndexes: [0, 2],
          plannedSprintIndexes: [0, 2],
          inactiveGaps: [1],
          hasPlanBaseline: true,
          sprintAllocations: [
            {
              sprintId: "sprint-a-1",
              sprintIndex: 0,
              plannedDays: 3,
              actualDays: 2,
              plannedPercentage: 60,
              actualPercentage: 40
            },
            {
              sprintId: "sprint-a-3",
              sprintIndex: 2,
              plannedDays: 2,
              actualDays: 3,
              plannedPercentage: 40,
              actualPercentage: 60
            }
          ]
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
          activeSprintIndexes: [1],
          plannedSprintIndexes: [1],
          inactiveGaps: [],
          hasPlanBaseline: false,
          sprintAllocations: [
            {
              sprintId: "sprint-a-2",
              sprintIndex: 1,
              plannedDays: 2,
              actualDays: 2,
              plannedPercentage: 100,
              actualPercentage: 100
            }
          ]
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
          activeSprintIndexes: [2],
          plannedSprintIndexes: [2],
          inactiveGaps: [],
          hasPlanBaseline: false,
          sprintAllocations: [
            {
              sprintId: "sprint-a-3",
              sprintIndex: 2,
              plannedDays: 1,
              actualDays: 1,
              plannedPercentage: 100,
              actualPercentage: 100
            }
          ]
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
  it("renders release and sprint headers", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("Release Alpha");
    expect(html).toContain("Release Beta");
    expect(html).toContain("S1");
    expect(html).toContain("S3");
    expect(html).toContain("01-01 - 01-14");
  });

  it("renders cross-release metrics for multiple releases", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("Comparação entre releases");
    expect(html).toContain("Release Alpha");
    expect(html).toContain("Release Beta");
    expect(html).toContain("12.0d");
    expect(html).toContain("14.0d");
    expect(html).toContain("Estouro da release");
    expect(html).toContain("Sobra 30.0d");
  });

  it("renders sprint overflow in timeline headers", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("Capacidade 10.0d");
    expect(html).toContain("Estouro 6.0d");
  });

  it("renders feature links and status styles", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain("/features/feature-active");
    expect(html).toContain("Plan. 60%");
    expect(html).toContain("Atual 40%");
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

    expect(html).toContain("Contexto da timeline");
    expect(html).toContain("Não filtrado por release");
    expect(html).not.toContain("<select");
  });
});
