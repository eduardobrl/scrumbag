import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import {
  AnnualTimelineView,
  buildFeatureReassignmentRequest,
  getFeatureDragId,
  getFeatureDropTargetId,
  shouldIgnoreFeatureDrop,
  type AnnualTimelineLabels
} from "@/features/timeline/annual-timeline-view";
import type { AnnualTimelineData } from "@/lib/annual-timeline";
import ptMessages from "@/messages/pt-BR.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
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
  months: Array.from({ length: 12 }, (_, index) => ({
    index,
    month: index + 1,
    year: 2026,
    label: `M${index + 1}`,
    shortLabel: `M${index + 1}`,
    startDate: "2026-01-01",
    endDate: "2026-01-28",
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
      id: "release-a",
      name: "Release A",
      status: "IN_PROGRESS",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      featureCount: 1,
      storyCount: 1,
      estimatedDays: 2,
      completionPercentage: 0,
      sprintCount: 1,
      totalCapacityDays: 10,
      plannedEffortDays: 2,
      remainingCapacityDays: 8
    },
    {
      id: "release-b",
      name: "Release B",
      status: "PLANNED",
      startDate: "2026-07-01",
      endDate: "2026-09-30",
      featureCount: 0,
      storyCount: 0,
      estimatedDays: 0,
      completionPercentage: 0,
      sprintCount: 0,
      totalCapacityDays: 0,
      plannedEffortDays: 0,
      remainingCapacityDays: 0
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
  releases: []
};

data.releases = [
  {
    id: "release-a",
    name: "Release A",
    status: "IN_PROGRESS",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    summary: data.summaries[0],
    features: [
      {
        id: "feature-a",
        releaseId: "release-a",
        name: "Move me",
        status: "ACTIVE",
        storyCount: 1,
        estimatedDays: 2,
        completionPercentage: 0,
        startIndex: 0,
        endIndex: 1,
        activeMonthIndexes: [0, 1],
        inactiveGaps: []
      }
    ]
  },
  {
    id: "release-b",
    name: "Release B",
    status: "PLANNED",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    summary: data.summaries[1],
    features: []
  }
];

function renderAnnualTimeline() {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="pt-BR" messages={ptMessages} timeZone="America/Araguaina">
      <AnnualTimelineView data={data} labels={labels} />
    </NextIntlClientProvider>
  );
}

describe("annual timeline drag-and-drop", () => {
  it("renders draggable feature bars and release drop target markers", () => {
    const html = renderAnnualTimeline();

    expect(html).toContain('data-feature-id="feature-a"');
    expect(html).toContain('data-orphan-feature-id="feature-orphan"');
    expect(html).toContain('data-release-id="release-a"');
    expect(html).toContain('data-release-id="release-b"');
    expect(html).toContain("/features/feature-a");
  });

  it("builds the reassignment API request", () => {
    const request = buildFeatureReassignmentRequest("feature-a", "release-b");

    expect(request.url).toBe("/api/features/feature-a");
    expect(request.init.method).toBe("PATCH");
    expect(request.init.body).toContain("reassignRelease");
    expect(request.init.body).toContain("release-b");
  });

  it("ignores same-release, missing-target, and pending drops", () => {
    const feature = { featureId: "feature-a", sourceReleaseId: "release-a", featureName: "Move me" };
    const orphan = { featureId: "feature-orphan", sourceReleaseId: null, featureName: "Orphan feature" };

    expect(getFeatureDropTargetId("release-drop-release-b")).toBe("release-b");
    expect(getFeatureDropTargetId("feature-drag-feature-a")).toBeNull();
    expect(getFeatureDragId("feature-drag-feature-a")).toBe("feature-a");
    expect(getFeatureDragId("release-drop-release-b")).toBeNull();
    expect(shouldIgnoreFeatureDrop(feature, "release-a", false)).toBe(true);
    expect(shouldIgnoreFeatureDrop(feature, null, false)).toBe(true);
    expect(shouldIgnoreFeatureDrop(feature, "release-b", true)).toBe(true);
    expect(shouldIgnoreFeatureDrop(feature, "release-b", false)).toBe(false);
    expect(shouldIgnoreFeatureDrop(orphan, "release-b", false)).toBe(false);
  });
});
