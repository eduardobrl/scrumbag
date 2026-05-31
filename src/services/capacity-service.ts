import { Database } from "bun:sqlite";
import { eachDayOfInterval, isWeekend, parseISO } from "date-fns";
import { AbsenceRepository } from "../data/absence-repository";
import { SquadRepository } from "../data/squad-repository";
import type {
  Absence,
  CapacityOverride,
  CapacityResult,
  NewCapacityOverride,
  SquadMember,
  WasteConfig,
} from "../domain/types";

export class CapacityService {
  private squadRepo: SquadRepository;
  private absenceRepo: AbsenceRepository;

  constructor(private db: Database) {
    this.squadRepo = new SquadRepository(db);
    this.absenceRepo = new AbsenceRepository(db);
  }

  isWorkingDay(date: Date): boolean {
    return !isWeekend(date);
  }

  getWorkingDaysInRange(start: string, end: string): number {
    return this.getWorkingDatesInRange(start, end).length;
  }

  getAbsenceHoursInRange(
    absence: Absence,
    start: string,
    end: string,
    dailyCapacityHours: number
  ): number {
    return this.countOverlapWorkingDays(absence.start_date, absence.end_date, start, end) * dailyCapacityHours;
  }

  getWastePercentage(): number {
    const row = this.db
      .query<{ value: string }, []>("SELECT value FROM app_config WHERE key = 'waste_percentage'")
      .get();
    const parsed = Number(row?.value ?? 15);
    return Number.isFinite(parsed) ? parsed : 15;
  }

  setWastePercentage(wastePercentage: number): WasteConfig {
    this.db.run(
      `INSERT INTO app_config (key, value)
       VALUES ('waste_percentage', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(wastePercentage)]
    );
    return { waste_percentage: wastePercentage };
  }

  getOverridesInRange(start: string, end: string): CapacityOverride[] {
    return this.db
      .query<CapacityOverride, [string, string]>(
        `SELECT * FROM capacity_overrides
         WHERE start_date <= ? AND end_date >= ?
         ORDER BY start_date DESC`
      )
      .all(end, start);
  }

  getAllOverrides(): CapacityOverride[] {
    return this.db
      .query<CapacityOverride, []>("SELECT * FROM capacity_overrides ORDER BY start_date DESC")
      .all();
  }

  createOverride(override: NewCapacityOverride): CapacityOverride {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO capacity_overrides
       (id, member_id, start_date, end_date, override_hours, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        override.member_id,
        override.start_date,
        override.end_date,
        override.override_hours,
        override.reason ?? null,
        now,
      ]
    );

    return {
      id,
      member_id: override.member_id,
      start_date: override.start_date,
      end_date: override.end_date,
      override_hours: override.override_hours,
      reason: override.reason ?? null,
      created_at: now,
    };
  }

  updateOverride(id: string, changes: NewCapacityOverride): CapacityOverride | null {
    this.db.run(
      `UPDATE capacity_overrides
       SET member_id = ?, start_date = ?, end_date = ?, override_hours = ?, reason = ?
       WHERE id = ?`,
      [
        changes.member_id,
        changes.start_date,
        changes.end_date,
        changes.override_hours,
        changes.reason ?? null,
        id,
      ]
    );

    return this.findOverrideById(id);
  }

  deleteOverride(id: string): boolean {
    const result = this.db.run("DELETE FROM capacity_overrides WHERE id = ?", [id]);
    return result.changes > 0;
  }

  calculate(start_date: string, end_date: string): CapacityResult {
    const members = this.squadRepo.findAll();
    const absences = this.absenceRepo.findByDateRange(start_date, end_date);
    const overrides = this.getOverridesInRange(start_date, end_date);
    const wastePercentage = this.getWastePercentage();
    const workingDays = this.getWorkingDaysInRange(start_date, end_date);

    const breakdown = members.map((member) => {
      const rawCapacity = workingDays * member.daily_capacity_hours;
      const memberAbsenceHours = this.sumAbsenceHours(member, absences, start_date, end_date);
      const holidayHours = this.sumHolidayHours(member, absences, start_date, end_date);
      const realCapacity = Math.max(0, rawCapacity - memberAbsenceHours - holidayHours);
      const wasteHours = realCapacity * (wastePercentage / 100);
      const computedFinal = Math.max(0, realCapacity - wasteHours);
      const finalCapacity = this.applyOverrides(
        computedFinal,
        workingDays,
        member.id,
        overrides,
        start_date,
        end_date
      );

      return {
        member_id: member.id,
        member_name: member.name,
        role: member.role,
        daily_capacity_hours: member.daily_capacity_hours,
        raw_capacity_hours: this.roundHours(rawCapacity),
        absence_hours: this.roundHours(memberAbsenceHours),
        holiday_hours: this.roundHours(holidayHours),
        real_capacity_hours: this.roundHours(realCapacity),
        waste_hours: this.roundHours(wasteHours),
        final_capacity_hours: this.roundHours(finalCapacity),
      };
    });

    return {
      start_date,
      end_date,
      total_members: members.length,
      total_raw_hours: this.roundHours(breakdown.reduce((sum, item) => sum + item.raw_capacity_hours, 0)),
      total_absence_hours: this.roundHours(breakdown.reduce((sum, item) => sum + item.absence_hours, 0)),
      total_holiday_hours: this.roundHours(breakdown.reduce((sum, item) => sum + item.holiday_hours, 0)),
      total_real_hours: this.roundHours(breakdown.reduce((sum, item) => sum + item.real_capacity_hours, 0)),
      total_waste_hours: this.roundHours(breakdown.reduce((sum, item) => sum + item.waste_hours, 0)),
      total_final_hours: this.roundHours(breakdown.reduce((sum, item) => sum + item.final_capacity_hours, 0)),
      members: breakdown,
    };
  }

  private findOverrideById(id: string): CapacityOverride | null {
    const row = this.db
      .query<CapacityOverride, [string]>("SELECT * FROM capacity_overrides WHERE id = ?")
      .get(id);
    return row ?? null;
  }

  private getWorkingDatesInRange(start: string, end: string): Date[] {
    return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).filter((date) =>
      this.isWorkingDay(date)
    );
  }

  private countOverlapWorkingDays(
    rangeStart: string,
    rangeEnd: string,
    queryStart: string,
    queryEnd: string
  ): number {
    const start = rangeStart > queryStart ? rangeStart : queryStart;
    const end = rangeEnd < queryEnd ? rangeEnd : queryEnd;

    if (start > end) {
      return 0;
    }

    return this.getWorkingDaysInRange(start, end);
  }

  private sumAbsenceHours(
    member: SquadMember,
    absences: Absence[],
    start: string,
    end: string
  ): number {
    return absences
      .filter((absence) => absence.member_id === member.id && absence.type !== "holiday")
      .reduce(
        (sum, absence) => sum + this.getAbsenceHoursInRange(absence, start, end, member.daily_capacity_hours),
        0
      );
  }

  private sumHolidayHours(
    member: SquadMember,
    absences: Absence[],
    start: string,
    end: string
  ): number {
    return absences
      .filter((absence) => absence.type === "holiday" && (absence.member_id === null || absence.member_id === member.id))
      .reduce(
        (sum, absence) => sum + this.getAbsenceHoursInRange(absence, start, end, member.daily_capacity_hours),
        0
      );
  }

  private applyOverrides(
    computedFinal: number,
    workingDays: number,
    memberId: string,
    overrides: CapacityOverride[],
    start: string,
    end: string
  ): number {
    let finalCapacity = computedFinal;

    for (const override of overrides.filter((item) => item.member_id === memberId)) {
      const overlapDays = this.countOverlapWorkingDays(override.start_date, override.end_date, start, end);
      const overrideDays = this.getWorkingDaysInRange(override.start_date, override.end_date);

      if (overlapDays === 0 || overrideDays === 0) {
        continue;
      }

      const computedOverlap = workingDays > 0 ? (computedFinal / workingDays) * overlapDays : 0;
      const overrideOverlap = (override.override_hours / overrideDays) * overlapDays;
      finalCapacity = finalCapacity - computedOverlap + overrideOverlap;
    }

    return Math.max(0, finalCapacity);
  }

  private roundHours(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
