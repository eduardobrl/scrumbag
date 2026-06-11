import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { generateSprintsForRelease } from "@/lib/sprint-generation";
import {
  createRelease,
  validateReleaseInput,
  getReleaseDetails,
  updateRelease,
  getActiveReleaseSummary,
  reconcileGeneratedSprints
} from "@/lib/releases";
import { getReleaseEstimateBaseline } from "@/lib/release-estimates";
import { ReleaseStatus } from "@prisma/client";
import { StoryStatus } from "@prisma/client";

describe("sprint generation", () => {
  it("generates sequential non-overlapping sprints for a simple range", () => {
    const sprints = generateSprintsForRelease({
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      holidays: []
    });

    expect(sprints.length).toBeGreaterThanOrEqual(1);
    expect(sprints[0].name).toBe("Sprint 1");

    // Verify non-overlapping and sequential
    for (let i = 1; i < sprints.length; i++) {
      const prev = sprints[i - 1];
      const curr = sprints[i];
      const dayAfterPrev = new Date(prev.endDate);
      dayAfterPrev.setDate(dayAfterPrev.getDate() + 1);
      expect(curr.startDate.getTime()).toBe(dayAfterPrev.getTime());
    }
  });

  it("excludes registered holidays from business day count", () => {
    // 2026-07-09 is a Thursday (holiday)
    const sprints = generateSprintsForRelease({
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 5,
      holidays: [new Date("2026-07-09T00:00:00.000Z")]
    });

    // 6-17 is 2 weeks = 10 business days normally, minus 1 holiday = 9 business days
    // With default 5, we'd expect 2 sprints: first 5 biz days, second 4 biz days (absorbed)
    expect(sprints.length).toBe(1);
    // Since remainder < default, it gets absorbed into first sprint
    expect(sprints[0].name).toBe("Sprint 1");
  });

  it("absorbs remaining business days into the final sprint", () => {
    // July 2026: 23 business days total
    // With default 10: expect Sprint 1 (10), Sprint 2 (13 - absorbed)
    const sprints = generateSprintsForRelease({
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      holidays: []
    });

    expect(sprints.length).toBe(2);
    expect(sprints[1].name).toBe("Sprint 2");
    expect(sprints[1].endDate.toISOString().slice(0, 10)).toBe("2026-07-31");
  });

  it("throws on non-positive sprint length", () => {
    expect(() =>
      generateSprintsForRelease({
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        endDate: new Date("2026-07-31T00:00:00.000Z"),
        defaultSprintLengthBusinessDays: 0,
        holidays: []
      })
    ).toThrow("defaultSprintLengthBusinessDays must be greater than 0");
  });
});

describe("release validation", () => {
  it("rejects empty name", async () => {
    const result = await validateReleaseInput({
      name: " ",
      objective: "Test",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBe("Required");
    }
  });

  it("rejects percentages that sum over 100", async () => {
    const result = await validateReleaseInput({
      name: "Test",
      objective: "Test",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 60,
      supportPercentage: 50,
      status: ReleaseStatus.PLANNED
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.meetingPercentage).toBe("Meeting + support percentages cannot exceed 100%");
    }
  });

  it("rejects end date before start date", async () => {
    const result = await validateReleaseInput({
      name: "Test",
      objective: "Test",
      startDate: "2026-07-31",
      endDate: "2026-07-01",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.endDate).toBe("End date must be on or after start date");
    }
  });
});

describe("release creation", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("creates a release and generates sprints", async () => {
    const result = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Release Q3 2026");
      expect(result.data.sprints.length).toBeGreaterThan(0);
    }
  });

  it("creates a release directly in PLANNING", async () => {
    const result = await createRelease({
      name: "Planning Release",
      objective: "Plan scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNING
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(ReleaseStatus.PLANNING);
    }
  });

  it("prevents a second IN_PROGRESS release", async () => {
    const first = await createRelease({
      name: "First",
      objective: "First release",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });
    expect(first.ok).toBe(true);

    const second = await createRelease({
      name: "Second",
      objective: "Second release",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.errors.status).toContain("Only one release can be in progress");
    }
  });
});

describe("release detail", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("returns release with ordered sprints", async () => {
    const created = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const release = await getReleaseDetails(created.data.id);
    expect(release).toBeTruthy();
    expect(release?.name).toBe("Release Q3 2026");
    expect(release?.sprints.length).toBeGreaterThan(0);

    // Verify sprints are ordered by startDate ascending
    for (let i = 1; i < release!.sprints.length; i++) {
      expect(release!.sprints[i].startDate.getTime()).toBeGreaterThanOrEqual(
        release!.sprints[i - 1].startDate.getTime()
      );
    }
  });
});

describe("release update", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("updates release fields", async () => {
    const created = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await updateRelease(created.data.id, {
      name: "Release Q3 2026 Updated",
      objective: "Updated objective",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.name).toBe("Release Q3 2026 Updated");
      expect(updated.data.objective).toBe("Updated objective");
    }
  });

  it("enforces ordered lifecycle transitions and captures the baseline once", async () => {
    const created = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const feature = await prisma.feature.create({
      data: {
        releaseId: created.data.id,
        name: "Planning feature"
      }
    });

    const story = await prisma.story.create({
      data: {
        featureId: feature.id,
        title: "Capture baseline story",
        storyPoints: 8,
        estimatedDays: 3,
        status: StoryStatus.BACKLOG
      }
    });

    const skipAhead = await updateRelease(created.data.id, {
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });

    expect(skipAhead.ok).toBe(false);
    if (!skipAhead.ok) {
      expect(skipAhead.errors.status).toContain("PLANNED -> PLANNING -> IN_PROGRESS -> CLOSED");
    }

    const planning = await updateRelease(created.data.id, {
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNING
    });

    expect(planning.ok).toBe(true);

    const skipClose = await updateRelease(created.data.id, {
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.CLOSED
    });

    expect(skipClose.ok).toBe(false);
    if (!skipClose.ok) {
      expect(skipClose.errors.status).toContain("PLANNED -> PLANNING -> IN_PROGRESS -> CLOSED");
    }

    const goLive = await updateRelease(created.data.id, {
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });

    expect(goLive.ok).toBe(true);

    const baseline = await getReleaseEstimateBaseline(prisma, created.data.id);
    expect(baseline).toBeTruthy();
    expect(baseline?.items).toHaveLength(1);
    expect(baseline?.items[0].storyId).toBe(story.id);
    expect(baseline?.items[0].storyPoints).toBe(8);
    expect(baseline?.items[0].estimatedDays).toBe(3);

    const repeatedGoLive = await updateRelease(created.data.id, {
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });

    expect(repeatedGoLive.ok).toBe(true);

    const baselineCount = await prisma.releaseEstimateBaseline.count({
      where: { releaseId: created.data.id }
    });
    expect(baselineCount).toBe(1);
  });

  it("rejects updating a second release to IN_PROGRESS", async () => {
    const first = await createRelease({
      name: "First",
      objective: "First release",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });
    expect(first.ok).toBe(true);

    const second = await createRelease({
      name: "Second",
      objective: "Second release",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    const planning = await updateRelease(second.data.id, {
      name: "Second",
      objective: "Second release",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNING
    });
    expect(planning.ok).toBe(true);

    const updated = await updateRelease(second.data.id, {
      name: "Second",
      objective: "Second release",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });

    expect(updated.ok).toBe(false);
    if (!updated.ok) {
      expect(updated.errors.status).toContain("Only one release can be in progress");
    }
  });

  it("reconciles sprints when end date changes", async () => {
    const created = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const originalSprintCount = created.data.sprints.length;

    // Extend end date to August 15
    const updated = await updateRelease(created.data.id, {
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-08-15",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(updated.ok).toBe(true);
    if (updated.ok) {
      // More sprints should be generated for the extended period
      expect(updated.data.sprints.length).toBeGreaterThanOrEqual(originalSprintCount);
      // Verify sprints are ordered by startDate ascending
      for (let i = 1; i < updated.data.sprints.length; i++) {
        expect(updated.data.sprints[i].startDate.getTime()).toBeGreaterThanOrEqual(
          updated.data.sprints[i - 1].startDate.getTime()
        );
      }
    }
  });
});

describe("active release summary", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("returns the IN_PROGRESS release", async () => {
    const created = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.IN_PROGRESS
    });

    expect(created.ok).toBe(true);

    const active = await getActiveReleaseSummary();
    expect(active).toBeTruthy();
    expect(active?.name).toBe("Release Q3 2026");
    expect(active?.status).toBe(ReleaseStatus.IN_PROGRESS);
  });

  it("returns null when no IN_PROGRESS release exists", async () => {
    const active = await getActiveReleaseSummary();
    expect(active).toBeNull();
  });
});

describe("sprint reconciliation", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("updates existing sprints, creates missing, and removes extras", async () => {
    const created = await createRelease({
      name: "Release Q3 2026",
      objective: "Plan Q3 scope",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const originalSprints = created.data.sprints;

    // Reconcile with modified ranges
    const newRanges = [
      { name: "Sprint 1", startDate: new Date("2026-07-01T00:00:00.000Z"), endDate: new Date("2026-07-10T00:00:00.000Z") },
      { name: "Sprint 2", startDate: new Date("2026-07-11T00:00:00.000Z"), endDate: new Date("2026-07-20T00:00:00.000Z") },
      { name: "Sprint 3", startDate: new Date("2026-07-21T00:00:00.000Z"), endDate: new Date("2026-07-31T00:00:00.000Z") }
    ];

    await reconcileGeneratedSprints(created.data.id, newRanges);

    const release = await getReleaseDetails(created.data.id);
    expect(release).toBeTruthy();
    expect(release!.sprints.length).toBe(3);
    expect(release!.sprints[0].name).toBe("Sprint 1");
    expect(release!.sprints[0].startDate.toISOString().slice(0, 10)).toBe("2026-07-01");
    expect(release!.sprints[0].endDate.toISOString().slice(0, 10)).toBe("2026-07-10");
    expect(release!.sprints[1].name).toBe("Sprint 2");
    expect(release!.sprints[2].name).toBe("Sprint 3");
  });
});
