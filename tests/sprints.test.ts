import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import {
  detectSprintScheduleWarnings,
  getSprintDetails,
  listSprintsForRelease,
  updateSprint,
  validateSprintInput
} from "@/lib/sprints";
import { getSprintPlanningSummary, recalculateSprintPlanningSummary } from "@/lib/sprint-planning-summary";
import { ReleaseStatus, SprintStatus } from "@prisma/client";

async function seedReleaseWithSprints() {
  const release = await prisma.release.create({
    data: {
      name: "Test Release",
      objective: "Test",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage: 10,
      supportPercentage: 20,
      status: ReleaseStatus.PLANNED
    }
  });

  const sprint1 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 2",
      startDate: new Date("2026-07-13T00:00:00.000Z"),
      endDate: new Date("2026-07-24T00:00:00.000Z"),
      status: SprintStatus.PLANNED
    }
  });

  return { release, sprint1, sprint2 };
}

describe("sprint planning summary", () => {
  it("returns Phase 2 placeholders", () => {
    const summary = getSprintPlanningSummary("any-id");
    expect(summary.plannedEffortDays).toBe(0);
    expect(summary.capacityDays).toBeNull();
    expect(summary.remainingCapacityDays).toBeNull();
    expect(summary.occupancyPercentage).toBeNull();
    expect(summary.riskLabel).toBe("Pending capacity");
  });

  it("recalculate returns same placeholders", () => {
    const summary = recalculateSprintPlanningSummary("any-id");
    expect(summary.plannedEffortDays).toBe(0);
    expect(summary.riskLabel).toBe("Pending capacity");
  });
});

describe("sprint validation", () => {
  it("rejects invalid date format", async () => {
    const result = await validateSprintInput({
      startDate: "not-a-date",
      endDate: "2026-07-10"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.startDate).toBe("Use YYYY-MM-DD");
    }
  });

  it("rejects end date before start date", async () => {
    const result = await validateSprintInput({
      startDate: "2026-07-10",
      endDate: "2026-07-01"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.endDate).toBe("End date must be on or after start date");
    }
  });

  it("rejects invalid status", async () => {
    const result = await validateSprintInput({
      status: "INVALID"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.status).toBe("Choose a valid status");
    }
  });

  it("accepts valid optional goal", async () => {
    const result = await validateSprintInput({
      goal: "Stabilize release planning"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.goal).toBe("Stabilize release planning");
    }
  });
});

describe("sprint schedule warnings", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("detects overlapping sprints", async () => {
    const { release, sprint1 } = await seedReleaseWithSprints();

    const warnings = await detectSprintScheduleWarnings(release.id, {
      id: sprint1.id,
      startDate: new Date("2026-07-05T00:00:00.000Z"),
      endDate: new Date("2026-07-15T00:00:00.000Z")
    });

    expect(warnings.some((w) => w.type === "OVERLAP")).toBe(true);
    expect(warnings.some((w) => w.message.includes("Sprint dates cannot overlap"))).toBe(true);
  });

  it("does not warn for weekend-only gaps between sprints", async () => {
    const { release, sprint1 } = await seedReleaseWithSprints();

    // sprint1 ends 07-10 (Friday), sprint2 starts 07-13 (Monday)
    // The gap 07-11 to 07-12 is weekend only — should not warn
    const warnings = await detectSprintScheduleWarnings(release.id, {
      id: sprint1.id,
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      endDate: new Date("2026-07-10T00:00:00.000Z")
    });

    const gapWarning = warnings.find((w) => w.type === "GAP");
    expect(gapWarning).toBeUndefined();
  });

  it("produces gap warning for real business-day gap", async () => {
    const { release, sprint1, sprint2 } = await seedReleaseWithSprints();

    // Move sprint2 to start on 07-20, creating a gap from 07-13 to 07-20
    const warnings = await detectSprintScheduleWarnings(release.id, {
      id: sprint2.id,
      startDate: new Date("2026-07-20T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z")
    });

    const gapWarning = warnings.find((w) => w.type === "GAP");
    expect(gapWarning).toBeDefined();
    expect(gapWarning!.message).toContain("Gap in release schedule");
  });
});

describe("sprint update", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("rejects overlapping date update", async () => {
    const { sprint1, sprint2 } = await seedReleaseWithSprints();

    const result = await updateSprint(sprint1.id, {
      startDate: "2026-07-15",
      endDate: "2026-07-20"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.dates).toContain("Sprint dates cannot overlap");
    }
  });

  it("updates goal and returns warnings for gaps", async () => {
    const { sprint2 } = await seedReleaseWithSprints();

    const result = await updateSprint(sprint2.id, {
      goal: "Stabilize release planning",
      startDate: "2026-07-20",
      endDate: "2026-07-31"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.goal).toBe("Stabilize release planning");
      expect(result.warnings.some((w) => w.message.includes("Gap in release schedule"))).toBe(true);
    }
  });
});

describe("sprint queries", () => {
  beforeEach(async () => {
    await prisma.sprint.deleteMany();
    await prisma.release.deleteMany();
  });

  it("lists sprints for a release ordered by start date", async () => {
    const { release, sprint1, sprint2 } = await seedReleaseWithSprints();

    const sprints = await listSprintsForRelease(release.id);
    expect(sprints.length).toBe(2);
    expect(sprints[0].id).toBe(sprint1.id);
    expect(sprints[1].id).toBe(sprint2.id);
  });

  it("gets sprint details with release", async () => {
    const { sprint1 } = await seedReleaseWithSprints();

    const sprint = await getSprintDetails(sprint1.id);
    expect(sprint).toBeDefined();
    expect(sprint?.name).toBe("Sprint 1");
    expect(sprint?.release).toBeDefined();
  });
});
