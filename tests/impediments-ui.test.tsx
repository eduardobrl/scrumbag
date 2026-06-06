import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ImpedimentDetail, type ImpedimentDetailView } from "@/features/impediments/impediment-detail";
import { ImpedimentForm, validateAffectedStorySelection } from "@/features/impediments/impediment-form";
import { ImpedimentList } from "@/features/impediments/impediment-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

vi.stubGlobal("React", React);

const storyOptions = [
  {
    id: "story-1",
    title: "Create checkout shell",
    featureName: "Checkout",
    estimatedDays: 2,
    status: "SPRINT_BACKLOG"
  },
  {
    id: "story-2",
    title: "Add payment validation",
    featureName: "Checkout",
    estimatedDays: 3,
    status: "IN_PROGRESS"
  }
];

const openDetail: ImpedimentDetailView = {
  id: "imp-1",
  title: "Vendor sandbox unavailable",
  description: "Payments cannot be validated.",
  reportedDate: "2026-07-06",
  resolutionDate: null,
  resolutionNotes: "",
  status: "OPEN",
  releaseId: "release-1",
  affectedStories: [
    { id: "story-1", title: "Create checkout shell", featureId: "feature-1" },
    { id: "story-2", title: "Add payment validation", featureId: "feature-1" }
  ],
  impact: { storyCount: 2, estimatedDays: 5, blockedBusinessDays: 4 }
};

describe("impediment UI", () => {
  it("renders create form story options", () => {
    const html = renderToStaticMarkup(
      <ImpedimentForm stories={storyOptions} selectedReleaseId="release-1" defaultReportedDate="2026-07-06" />
    );

    expect(html).toContain("Novo impedimento");
    expect(html).toContain("Create checkout shell");
    expect(html).toContain("Add payment validation");
  });

  it("validates omitted affected stories", () => {
    expect(validateAffectedStorySelection([])).toContain("historia afetada");
    expect(validateAffectedStorySelection(["story-1"])).toBeNull();
  });

  it("renders list impact columns", () => {
    const html = renderToStaticMarkup(
      <ImpedimentList
        releaseId="release-1"
        impediments={[
          {
            id: "imp-1",
            title: "Vendor sandbox unavailable",
            reportedDate: "2026-07-06",
            status: "OPEN",
            impact: { storyCount: 2, estimatedDays: 5, blockedBusinessDays: 4 }
          }
        ]}
      />
    );

    expect(html).toContain("Vendor sandbox unavailable");
    expect(html).toContain("2");
    expect(html).toContain("5d");
    expect(html).toContain("4d");
  });

  it("renders detail impact summary for open impediments", () => {
    const html = renderToStaticMarkup(<ImpedimentDetail impediment={openDetail} releaseId="release-1" />);

    expect(html).toContain("Vendor sandbox unavailable");
    expect(html).toContain("Dias bloqueados");
    expect(html).toContain("4d");
    expect(html).toContain("Create checkout shell");
    expect(html).toContain("Resolver impedimento");
  });

  it("renders resolved details without a reopen action", () => {
    const html = renderToStaticMarkup(
      <ImpedimentDetail
        releaseId="release-1"
        impediment={{
          ...openDetail,
          status: "RESOLVED",
          resolutionDate: "2026-07-08",
          resolutionNotes: "Sandbox credentials restored.",
          impact: { storyCount: 2, estimatedDays: 5, blockedBusinessDays: 3 }
        }}
      />
    );

    expect(html).toContain("Resolvido");
    expect(html).toContain("Sandbox credentials restored.");
    expect(html).toContain("3d");
    expect(html).not.toContain("Reabrir");
    expect(html).not.toContain("Resolver impedimento");
  });
});
