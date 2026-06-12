import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DashboardCards } from "@/features/dashboard/dashboard-cards";
import { SprintTable } from "@/features/dashboard/sprint-table";
import type { DashboardData } from "@/lib/dashboard";

vi.stubGlobal("React", React);

const dashboard: DashboardData = {
  release: {
    id: "release-1",
    name: "Release Alpha",
    objective: "Track capacity",
    status: "IN_PROGRESS",
    startDate: "2026-01-01",
    endDate: "2026-01-31"
  },
  progress: 40,
  totalCapacityDays: 20,
  plannedEffortDays: 26,
  remainingCapacityDays: -6,
  overCapacityDays: 6,
  risk: "Over capacity",
  featureCount: 2,
  storyCount: 5,
  finishedStoryCount: 1,
  leakedStoryCount: 0,
  sprints: [
    {
      id: "sprint-1",
      name: "Sprint 1",
      goal: "Healthy scope",
      status: "IN_PROGRESS",
      startDate: "2026-01-01",
      endDate: "2026-01-14",
      period: "2026-01-01 - 2026-01-14",
      grossCapacityDays: 10,
      netCapacityDays: 10,
      plannedEffortDays: 8,
      remainingCapacityDays: 2,
      overCapacityDays: 0,
      occupancyPercentage: 80,
      progressPercentage: 25,
      overCapacity: false
    },
    {
      id: "sprint-2",
      name: "Sprint 2",
      goal: "Heavy scope",
      status: "PLANNED",
      startDate: "2026-01-15",
      endDate: "2026-01-28",
      period: "2026-01-15 - 2026-01-28",
      grossCapacityDays: 10,
      netCapacityDays: 10,
      plannedEffortDays: 16,
      remainingCapacityDays: -6,
      overCapacityDays: 6,
      occupancyPercentage: 160,
      progressPercentage: 0,
      overCapacity: true
    }
  ]
};

describe("dashboard overflow UI", () => {
  it("renders release and sprint overflow labels explicitly", () => {
    const cards = renderToStaticMarkup(<DashboardCards data={dashboard} />);
    const table = renderToStaticMarkup(<SprintTable sprints={dashboard.sprints} />);

    expect(cards).toContain("Estouro da release: 6.0d");
    expect(table).toContain("Sobra 2.0d");
    expect(table).toContain("Estouro 6.0d");
  });
});
