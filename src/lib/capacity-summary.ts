import { AbsenceType, RoleType } from "@prisma/client";
import { getOrCreateSettings } from "@/lib/settings";
import { listAbsences, listHolidays, listSquadMembers } from "@/lib/squad";

export async function getCapacitySummary() {
  const [settings, members, absences, holidays] = await Promise.all([
    getOrCreateSettings(),
    listSquadMembers(),
    listAbsences(),
    listHolidays()
  ]);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const activeMembers = members.filter((member) => member.active);
  const dailyGrossCapacityHours = activeMembers.reduce((total, member) => {
    return total + (member.roleType === RoleType.FULL_TIME ? settings.workingHoursFullTime : settings.workingHoursIntern);
  }, 0);
  const futureAbsences = absences.filter((absence) => absence.endDate >= today);
  const absenceImpactByType = futureAbsences.reduce(
    (totals, absence) => {
      totals[absence.type] += 1;
      return totals;
    },
    { [AbsenceType.VACATION]: 0, [AbsenceType.DAY_OFF]: 0 }
  );

  return {
    activeMemberCount: activeMembers.length,
    dailyGrossCapacityHours,
    futureAbsenceCount: futureAbsences.length,
    holidayCount: holidays.length,
    absenceImpactByType
  };
}
