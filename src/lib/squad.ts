import { AbsenceType, RoleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";

export type SquadMemberInput = {
  name: unknown;
  roleType: unknown;
  active?: unknown;
};

export type AbsenceInput = {
  memberId: unknown;
  type: unknown;
  startDate: unknown;
  endDate: unknown;
  notes?: unknown;
};

export type HolidayInput = {
  date: unknown;
  name: unknown;
};

function validateRoleType(value: unknown): ValidationResult<RoleType> {
  if (value === RoleType.FULL_TIME || value === RoleType.INTERN) {
    return { ok: true, data: value };
  }

  return { ok: false, errors: { roleType: "Choose Full time or Intern" } };
}

function validateActive(value: unknown): ValidationResult<boolean> {
  if (value === undefined) {
    return { ok: true, data: true };
  }

  if (typeof value === "boolean") {
    return { ok: true, data: value };
  }

  return { ok: false, errors: { active: "Active must be true or false" } };
}

export function validateSquadMemberInput(input: SquadMemberInput) {
  const name = requireText(input.name, "name");
  const roleType = validateRoleType(input.roleType);
  const active = validateActive(input.active);

  if (!name.ok || !roleType.ok || !active.ok) {
    return {
      ok: false as const,
      errors: mergeErrors(
        !name.ok ? name.errors : undefined,
        !roleType.ok ? roleType.errors : undefined,
        !active.ok ? active.errors : undefined
      )
    };
  }

  return {
    ok: true as const,
    data: {
      name: name.data,
      roleType: roleType.data,
      active: active.data
    }
  };
}

function validateAbsenceType(value: unknown): ValidationResult<AbsenceType> {
  if (value === AbsenceType.VACATION || value === AbsenceType.DAY_OFF) {
    return { ok: true, data: value };
  }

  return { ok: false, errors: { type: "Choose Vacation or Day off" } };
}

function dateOnly(value: unknown, field: string): ValidationResult<Date> {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ok: false, errors: { [field]: "Use YYYY-MM-DD" } };
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return { ok: false, errors: { [field]: "Use a valid date" } };
  }

  return { ok: true, data: date };
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function validateAbsenceInput(input: AbsenceInput) {
  const memberId = requireText(input.memberId, "memberId");
  const type = validateAbsenceType(input.type);
  const startDate = dateOnly(input.startDate, "startDate");
  const endDate = dateOnly(input.endDate, "endDate");
  const errors = mergeErrors(
    !memberId.ok ? memberId.errors : undefined,
    !type.ok ? type.errors : undefined,
    !startDate.ok ? startDate.errors : undefined,
    !endDate.ok ? endDate.errors : undefined
  );

  if (Object.keys(errors).length > 0) {
    return { ok: false as const, errors };
  }

  if (!memberId.ok || !type.ok || !startDate.ok || !endDate.ok) {
    return { ok: false as const, errors };
  }

  if (endDate.data < startDate.data) {
    return { ok: false as const, errors: { endDate: "End date must be on or after start date" } };
  }

  const member = await prisma.squadMember.findUnique({ where: { id: memberId.data } });

  if (!member) {
    return { ok: false as const, errors: { memberId: "Choose an existing member" } };
  }

  return {
    ok: true as const,
    data: {
      memberId: memberId.data,
      type: type.data,
      startDate: startDate.data,
      endDate: endDate.data,
      notes: optionalText(input.notes)
    }
  };
}

export function validateHolidayInput(input: HolidayInput) {
  const date = dateOnly(input.date, "date");
  const name = requireText(input.name, "name");

  if (!date.ok || !name.ok) {
    return {
      ok: false as const,
      errors: mergeErrors(!date.ok ? date.errors : undefined, !name.ok ? name.errors : undefined)
    };
  }

  return {
    ok: true as const,
    data: {
      date: date.data,
      name: name.data
    }
  };
}

export async function listSquadMembers() {
  return prisma.squadMember.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }]
  });
}

export async function createSquadMember(input: SquadMemberInput) {
  const validated = validateSquadMemberInput(input);

  if (!validated.ok) {
    return validated;
  }

  const member = await prisma.squadMember.create({
    data: validated.data
  });

  return { ok: true as const, data: member };
}

export async function updateSquadMember(id: string, input: SquadMemberInput) {
  const validated = validateSquadMemberInput(input);

  if (!validated.ok) {
    return validated;
  }

  const member = await prisma.squadMember.update({
    where: { id },
    data: validated.data
  });

  return { ok: true as const, data: member };
}

export async function listAbsences() {
  return prisma.absence.findMany({
    include: { member: true },
    orderBy: [{ startDate: "asc" }]
  });
}

export async function createAbsence(input: AbsenceInput) {
  const validated = await validateAbsenceInput(input);

  if (!validated.ok) {
    return validated;
  }

  const absence = await prisma.absence.create({
    data: validated.data,
    include: { member: true }
  });

  return { ok: true as const, data: absence };
}

export async function listHolidays() {
  return prisma.holiday.findMany({
    orderBy: [{ date: "asc" }]
  });
}

export async function createHoliday(input: HolidayInput) {
  const validated = validateHolidayInput(input);

  if (!validated.ok) {
    return validated;
  }

  const holiday = await prisma.holiday.create({
    data: validated.data
  });

  return { ok: true as const, data: holiday };
}

export function toMemberView(member: Awaited<ReturnType<typeof listSquadMembers>>[number]) {
  return {
    id: member.id,
    name: member.name,
    roleType: member.roleType,
    active: member.active
  };
}

export function toAbsenceView(absence: Awaited<ReturnType<typeof listAbsences>>[number]) {
  return {
    id: absence.id,
    memberId: absence.memberId,
    memberName: absence.member.name,
    type: absence.type,
    startDate: absence.startDate.toISOString().slice(0, 10),
    endDate: absence.endDate.toISOString().slice(0, 10),
    notes: absence.notes ?? ""
  };
}

export function toHolidayView(holiday: Awaited<ReturnType<typeof listHolidays>>[number]) {
  return {
    id: holiday.id,
    date: holiday.date.toISOString().slice(0, 10),
    name: holiday.name
  };
}
