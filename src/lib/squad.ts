import { RoleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";

export type SquadMemberInput = {
  name: unknown;
  roleType: unknown;
  active?: unknown;
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
