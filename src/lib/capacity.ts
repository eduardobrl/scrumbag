import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOrCreateSettings } from "@/lib/settings";
import { eachBusinessDayInRange, normalizeDateOnly } from "@/lib/date-utils";

export { countBusinessDaysInRange } from "@/lib/date-utils";

export type SprintCapacity = {
  grossCapacityHours: number;
  grossCapacityDays: number;
  absenceReductionHours: number;
  holidayReductionHours: number;
  capacityAfterAbsencesHours: number;
  meetingReductionHours: number;
  supportReductionHours: number;
  netCapacityHours: number;
  netCapacityDays: number;
  businessDaysInSprint: number;
  activeMemberCount: number;
};

function normalizeDate(date: Date): Date {
  return normalizeDateOnly(date);
}

function eachBusinessDay(startDate: Date, endDate: Date): Date[] {
  return eachBusinessDayInRange(startDate, endDate);
}

function dateKey(date: Date): string {
  return normalizeDate(date).toISOString().slice(0, 10);
}

function percent(value: number): number {
  return value > 1 ? value / 100 : value;
}

export async function calculateSprintCapacity(sprintId: string): Promise<SprintCapacity> {
  const settings = await getOrCreateSettings();
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { release: true }
  });

  if (!sprint) {
    return emptyCapacity(settings.standardDayHours);
  }

  const [members, absences, holidays] = await Promise.all([
    prisma.squadMember.findMany({ where: { active: true } }),
    prisma.absence.findMany(),
    prisma.holiday.findMany()
  ]);

  const businessDays = eachBusinessDay(sprint.startDate, sprint.endDate);
  const businessDaySet = new Set(businessDays.map(dateKey));
  const hoursForRole = (roleType: RoleType) =>
    roleType === RoleType.FULL_TIME ? settings.workingHoursFullTime : settings.workingHoursIntern;
  const dailyHoursByMember = new Map(members.map((member) => [member.id, hoursForRole(member.roleType)]));

  const grossCapacityHours = members.reduce(
    (sum, member) => sum + hoursForRole(member.roleType) * businessDays.length,
    0
  );

  const absenceReductionHours = absences.reduce((sum, absence) => {
    const memberHours = dailyHoursByMember.get(absence.memberId);
    if (!memberHours) return sum;

    const overlapDays = eachBusinessDay(
      maxDate(absence.startDate, sprint.startDate),
      minDate(absence.endDate, sprint.endDate)
    ).length;

    return sum + overlapDays * memberHours;
  }, 0);

  const averageDailyHours =
    members.length > 0
      ? members.reduce((sum, member) => sum + hoursForRole(member.roleType), 0) / members.length
      : 0;
  const holidayCount = holidays.filter((holiday) => businessDaySet.has(dateKey(holiday.date))).length;
  const holidayReductionHours = members.length * averageDailyHours * holidayCount;
  const capacityAfterAbsencesHours = Math.max(
    0,
    grossCapacityHours - absenceReductionHours - holidayReductionHours
  );
  const meetingReductionHours = capacityAfterAbsencesHours * percent(sprint.release.meetingPercentage);
  const supportReductionHours = capacityAfterAbsencesHours * percent(sprint.release.supportPercentage);
  const netCapacityHours = Math.max(0, capacityAfterAbsencesHours - meetingReductionHours - supportReductionHours);

  return {
    grossCapacityHours,
    grossCapacityDays: grossCapacityHours / settings.standardDayHours,
    absenceReductionHours,
    holidayReductionHours,
    capacityAfterAbsencesHours,
    meetingReductionHours,
    supportReductionHours,
    netCapacityHours,
    netCapacityDays: netCapacityHours / settings.standardDayHours,
    businessDaysInSprint: businessDays.length,
    activeMemberCount: members.length
  };
}

function emptyCapacity(standardDayHours: number): SprintCapacity {
  return {
    grossCapacityHours: 0,
    grossCapacityDays: 0 / standardDayHours,
    absenceReductionHours: 0,
    holidayReductionHours: 0,
    capacityAfterAbsencesHours: 0,
    meetingReductionHours: 0,
    supportReductionHours: 0,
    netCapacityHours: 0,
    netCapacityDays: 0 / standardDayHours,
    businessDaysInSprint: 0,
    activeMemberCount: 0
  };
}

function minDate(left: Date, right: Date): Date {
  return left < right ? left : right;
}

function maxDate(left: Date, right: Date): Date {
  return left > right ? left : right;
}
