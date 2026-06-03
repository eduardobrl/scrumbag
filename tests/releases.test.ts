import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { generateSprintsForRelease } from "@/lib/sprint-generation";
import { createRelease, validateReleaseInput } from "@/lib/releases";
import { ReleaseStatus } from "@prisma/client";

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
