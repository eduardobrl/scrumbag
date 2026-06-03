import { beforeEach, describe, expect, it } from "vitest";
import { AbsenceType, ReleaseStatus, RoleType, SprintStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateSprintCapacity } from "@/lib/capacity";

async function seedSprint({ meetingPercentage = 0, supportPercentage = 0 } = {}) {
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
      name: "Capacity Release",
      objective: "Capacity",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      defaultSprintLengthBusinessDays: 10,
      meetingPercentage,
      supportPercentage,
      status: ReleaseStatus.IN_PROGRESS
    }
  });
  const sprint = await prisma.sprint.create({
    data: {
      releaseId: release.id,
      name: "Sprint 1",
      startDate: new Date("2026-07-06T00:00:00.000Z"),
      endDate: new Date("2026-07-17T00:00:00.000Z"),
      status: SprintStatus.IN_PROGRESS
    }
  });
  const first = await prisma.squadMember.create({ data: { name: "Ana", roleType: RoleType.FULL_TIME } });
  const second = await prisma.squadMember.create({ data: { name: "Bia", roleType: RoleType.FULL_TIME } });
  return { release, sprint, first, second };
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

describe("calculateSprintCapacity", () => {
  it("calculates gross and net capacity for active members over business days", async () => {
    const { sprint } = await seedSprint();
    const capacity = await calculateSprintCapacity(sprint.id);

    expect(capacity.businessDaysInSprint).toBe(10);
    expect(capacity.grossCapacityHours).toBe(160);
    expect(capacity.netCapacityHours).toBe(160);
    expect(capacity.netCapacityDays).toBe(20);
  });

  it("reduces capacity for overlapping absences", async () => {
    const { sprint, first } = await seedSprint();
    await prisma.absence.create({
      data: {
        memberId: first.id,
        type: AbsenceType.VACATION,
        startDate: new Date("2026-07-06T00:00:00.000Z"),
        endDate: new Date("2026-07-07T00:00:00.000Z")
      }
    });

    const capacity = await calculateSprintCapacity(sprint.id);
    expect(capacity.grossCapacityHours).toBe(160);
    expect(capacity.absenceReductionHours).toBe(16);
    expect(capacity.netCapacityHours).toBe(144);
  });

  it("reduces capacity for holidays on business days", async () => {
    const { sprint } = await seedSprint();
    await prisma.holiday.create({
      data: { name: "Holiday", date: new Date("2026-07-08T00:00:00.000Z") }
    });

    const capacity = await calculateSprintCapacity(sprint.id);
    expect(capacity.holidayReductionHours).toBe(16);
  });

  it("applies meeting and support percentages to 300h after absences", async () => {
    const { sprint } = await seedSprint({ meetingPercentage: 10, supportPercentage: 20 });
    await prisma.squadMember.create({ data: { name: "Caio", roleType: RoleType.FULL_TIME } });
    await prisma.squadMember.create({ data: { name: "Duda", roleType: RoleType.INTERN } });

    const capacity = await calculateSprintCapacity(sprint.id);
    expect(capacity.capacityAfterAbsencesHours).toBe(300);
    expect(capacity.netCapacityHours).toBe(210);
  });

  it("normalizes net hours into standard days", async () => {
    const { sprint } = await seedSprint({ meetingPercentage: 10, supportPercentage: 20 });
    await prisma.squadMember.create({ data: { name: "Caio", roleType: RoleType.FULL_TIME } });
    await prisma.squadMember.create({ data: { name: "Duda", roleType: RoleType.INTERN } });

    const capacity = await calculateSprintCapacity(sprint.id);
    expect(capacity.netCapacityHours).toBe(210);
    expect(capacity.netCapacityDays).toBe(26.25);
  });
});
