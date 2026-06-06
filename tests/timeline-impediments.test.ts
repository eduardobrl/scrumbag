import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImpedimentStatus, ReleaseStatus, SprintStatus, StoryStatus } from "@prisma/client";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { GET as getTimeline } from "@/app/api/timeline/route";
import { TimelineView } from "@/features/dashboard/timeline-view";
import { prisma } from "@/lib/db";
import { buildTimelineData } from "@/lib/timeline";

vi.stubGlobal("React", React);

async function resetDb() {
  await prisma.impediment.deleteMany();
  await prisma.leakageHistory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
}

async function seedTimeline() {
  const release = await prisma.release.create({
    data: {
      name: "Release Timeline",
      objective: "See blockers",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint1 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const sprint3 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 3",
      startDate: new Date("2026-07-20T00:00:00.000Z"),
      endDate: new Date("2026-07-24T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Checkout" } });
  const firstStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint1.id,
      title: "Create checkout shell",
      estimatedDays: 2,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  const secondStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint3.id,
      title: "Add payment validation",
      estimatedDays: 3,
      status: StoryStatus.IN_PROGRESS
    }
  });
  const unassignedStory = await prisma.story.create({
    data: {
      featureId: feature.id,
      title: "Wait for credentials",
      estimatedDays: 1,
      status: StoryStatus.BACKLOG
    }
  });
  const resolved = await prisma.impediment.create({
    data: {
      title: "Vendor sandbox unavailable",
      reportedDate: new Date("2026-07-03T00:00:00.000Z"),
      status: ImpedimentStatus.RESOLVED,
      resolutionDate: new Date("2026-07-07T00:00:00.000Z"),
      affectedStories: { connect: [{ id: firstStory.id }, { id: secondStory.id }] }
    }
  });
  const open = await prisma.impediment.create({
    data: {
      title: "Access request pending",
      reportedDate: new Date("2026-06-05T00:00:00.000Z"),
      affectedStories: { connect: [{ id: unassignedStory.id }] }
    }
  });

  return { release, feature, sprint1, sprint3, resolved, open };
}

beforeEach(async () => {
  await resetDb();
});

describe("timeline impediments", () => {
  it("calculates impediment span indexes from affected story sprint assignments", async () => {
    const { release, sprint1, sprint3, resolved } = await seedTimeline();

    const timeline = await buildTimelineData(release.id);
    const impediment = timeline.impediments.find((item) => item.id === resolved.id);

    expect(impediment?.affectedSprintIds).toEqual([sprint1.id, sprint3.id]);
    expect(impediment?.startIndex).toBe(0);
    expect(impediment?.endIndex).toBe(2);
  });

  it("includes resolved status and blocked duration", async () => {
    const { release, resolved } = await seedTimeline();

    const timeline = await buildTimelineData(release.id);
    const impediment = timeline.impediments.find((item) => item.id === resolved.id);

    expect(impediment?.status).toBe(ImpedimentStatus.RESOLVED);
    expect(impediment?.resolutionDate).toBe("2026-07-07");
    expect(impediment?.blockedBusinessDays).toBe(3);
    expect(impediment?.estimatedDays).toBe(5);
    expect(impediment?.impactText).toContain("2 stories");
  });

  it("keeps open unassigned impediments visible with running blocked duration", async () => {
    const { release, open } = await seedTimeline();

    const timeline = await buildTimelineData(release.id);
    const impediment = timeline.impediments.find((item) => item.id === open.id);

    expect(impediment?.status).toBe(ImpedimentStatus.OPEN);
    expect(impediment?.startIndex).toBeNull();
    expect(impediment?.endIndex).toBeNull();
    expect(impediment?.blockedBusinessDays).toBeGreaterThan(0);
  });

  it("keeps feature timeline rows alongside impediments", async () => {
    const { release, feature } = await seedTimeline();

    const timeline = await buildTimelineData(release.id);

    expect(timeline.features.some((item) => item.id === feature.id)).toBe(true);
    expect(timeline.impediments).toHaveLength(2);
    expect(timeline.sprints).toHaveLength(3);
  });

  it("renders impediment rows with compact impact tooltips", async () => {
    const { release } = await seedTimeline();
    const timeline = await buildTimelineData(release.id);

    const html = renderToStaticMarkup(React.createElement(TimelineView, { data: timeline }));

    expect(html).toContain("Impedimentos");
    expect(html).toContain("Vendor sandbox unavailable");
    expect(html).toContain("2 stories, 5d estimated, 3 blocked business days");
    expect(html).toContain("Impedimento resolvido");
    expect(html).not.toContain("/impediments/");
  });

  it("returns impediments from the timeline API without removing existing fields", async () => {
    const { release } = await seedTimeline();

    const response = await getTimeline(new Request(`http://localhost/api/timeline?releaseId=${release.id}`));
    const body = await response.json();

    expect(body.sprints).toHaveLength(3);
    expect(body.features.length).toBeGreaterThan(0);
    expect(body.leakedSprints).toEqual([]);
    expect(body.impediments).toHaveLength(2);
  });
});
