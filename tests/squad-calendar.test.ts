import { AbsenceType, RoleType } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { getCapacitySummary } from "@/lib/capacity-summary";
import { updateSettings } from "@/lib/settings";
import {
  createAbsence,
  createHoliday,
  createSquadMember,
  updateSquadMember,
  validateHolidayInput
} from "@/lib/squad";
import { prisma } from "@/lib/db";

describe("squad calendar management", () => {
  beforeEach(async () => {
    await prisma.absence.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.squadMember.deleteMany();
    await prisma.appSettings.deleteMany();
  });

  it("rejects an empty member name", async () => {
    const result = await createSquadMember({ name: "", roleType: RoleType.FULL_TIME });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.name).toBe("Required");
  });

  it("deactivates a member without deleting the row", async () => {
    const created = await createSquadMember({ name: "Ana", roleType: RoleType.FULL_TIME });
    expect(created.ok).toBe(true);

    if (!created.ok) return;

    const updated = await updateSquadMember(created.data.id, {
      name: "Ana",
      roleType: RoleType.FULL_TIME,
      active: false
    });

    expect(updated.ok).toBe(true);
    expect(updated.ok ? updated.data.active : true).toBe(false);
    await expect(prisma.squadMember.count()).resolves.toBe(1);
  });

  it("rejects an absence end date before the start date", async () => {
    const member = await createSquadMember({ name: "Bruno", roleType: RoleType.INTERN });
    expect(member.ok).toBe(true);

    if (!member.ok) return;

    const result = await createAbsence({
      memberId: member.data.id,
      type: AbsenceType.VACATION,
      startDate: "2026-07-20",
      endDate: "2026-07-10"
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.endDate).toContain("on or after");
  });

  it("rejects a holiday without a name", () => {
    const result = validateHolidayInput({ date: "2026-07-09", name: "" });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.name).toBe("Required");
  });

  it("uses persisted settings for daily gross capacity", async () => {
    await updateSettings({
      workingHoursFullTime: 7,
      workingHoursIntern: 5,
      standardDayHours: 8,
      mcpHost: "localhost",
      mcpPort: 3333,
      mcpEnabled: false
    });
    await createSquadMember({ name: "Ana", roleType: RoleType.FULL_TIME });
    await createSquadMember({ name: "Bruno", roleType: RoleType.INTERN });
    await createHoliday({ date: "2026-07-09", name: "Local holiday" });

    const summary = await getCapacitySummary();

    expect(summary.activeMemberCount).toBe(2);
    expect(summary.dailyGrossCapacityHours).toBe(12);
    expect(summary.holidayCount).toBe(1);
  });
});
