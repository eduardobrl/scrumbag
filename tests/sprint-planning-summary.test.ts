import { beforeEach, describe, expect, it } from "vitest";
import { ReleaseStatus, RoleType, SprintStatus, StoryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSprintPlanningSummary } from "@/lib/sprint-planning-summary";

async function seedSummary(plannedEffortDays: number, businessDays: number) {
  await prisma.appSettings.create({
    data: {
      workingHoursFullTime: 8,
      workingHoursIntern: 6,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: false
    }
  });
  const release = await prisma.release.create({
    data: {
      name: "Summary Release",
      objective: "Summary",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: addBusinessDays(new Date("2026-07-06T00:00:00.000Z"), businessDays - 1),
      status: SprintStatus.IN_PROGRESS
    }
  });
  await prisma.squadMember.create({ data: { name: "Member 1", roleType: RoleType.FULL_TIME } });
  const feature = await prisma.feature.create({ data: { releaseId: release.id, name: "Feature" } });
  await prisma.story.create({
    data: {
      featureId: feature.id,
      currentSprintId: sprint.id,
      title: "Story",
      estimatedDays: plannedEffortDays,
      status: StoryStatus.SPRINT_BACKLOG
    }
  });
  return sprint;
}

function addBusinessDays(start: Date, businessDaysToAdd: number): Date {
  const date = new Date(start);
  let added = 0;
  while (added < businessDaysToAdd) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return date;
}

beforeEach(async () => {
  await prisma.absence.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.squadMember.deleteMany();
  await prisma.story.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.release.deleteMany();
  await prisma.appSettings.deleteMany();
});

describe("getSprintPlanningSummary", () => {
  it("labels over-capacity sprints", async () => {
    const sprint = await seedSummary(5, 4);
    const summary = await getSprintPlanningSummary(sprint.id);
    expect(summary.capacityDays).toBe(4);
    expect(summary.remainingCapacityDays).toBe(-1);
    expect(summary.riskLabel).toBe("Over capacity by 1.0 days");
  });

  it("labels 90 percent occupancy as high risk", async () => {
    const sprint = await seedSummary(9, 10);
    const summary = await getSprintPlanningSummary(sprint.id);
    expect(summary.occupancyPercentage).toBe(90);
    expect(summary.riskLabel).toBe("High risk");
  });

  it("labels 75 percent occupancy as medium risk", async () => {
    const sprint = await seedSummary(7.5, 10);
    const summary = await getSprintPlanningSummary(sprint.id);
    expect(summary.occupancyPercentage).toBe(75);
    expect(summary.riskLabel).toBe("Medium risk");
  });

  it("labels 40 percent occupancy as on track", async () => {
    const sprint = await seedSummary(4, 10);
    const summary = await getSprintPlanningSummary(sprint.id);
    expect(summary.occupancyPercentage).toBe(40);
    expect(summary.riskLabel).toBe("On track");
  });
});
