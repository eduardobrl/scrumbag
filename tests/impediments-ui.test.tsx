import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
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
});
