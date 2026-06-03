import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";
import { SprintStatus } from "@prisma/client";

export type SprintInput = {
  goal?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  status?: unknown;
};

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

function validateSprintStatus(value: unknown): ValidationResult<SprintStatus> {
  const valid = Object.values(SprintStatus);
  if (valid.includes(value as SprintStatus)) {
    return { ok: true, data: value as SprintStatus };
  }
  return { ok: false, errors: { status: "Choose a valid status" } };
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function validateSprintInput(input: SprintInput) {
  const goal = optionalText(input.goal);
  const startDate = input.startDate !== undefined ? dateOnly(input.startDate, "startDate") : undefined;
  const endDate = input.endDate !== undefined ? dateOnly(input.endDate, "endDate") : undefined;
  const status = input.status !== undefined ? validateSprintStatus(input.status) : undefined;

  const validations: ValidationResult<unknown>[] = [];
  if (startDate !== undefined) validations.push(startDate);
  if (endDate !== undefined) validations.push(endDate);
  if (status !== undefined) validations.push(status);

  const failures = validations.filter((v) => !v.ok);
  if (failures.length > 0) {
    return {
      ok: false as const,
      errors: mergeErrors(...failures.map((f) => (!f.ok ? f.errors : undefined)))
    };
  }

  if (startDate?.ok && endDate?.ok && endDate.data < startDate.data) {
    return { ok: false as const, errors: { endDate: "End date must be on or after start date" } };
  }

  return {
    ok: true as const,
    data: {
      goal,
      startDate: startDate?.ok ? startDate.data : undefined,
      endDate: endDate?.ok ? endDate.data : undefined,
      status: status?.ok ? status.data : undefined
    }
  };
}

export async function listSprintsForRelease(releaseId: string) {
  return prisma.sprint.findMany({
    where: { releaseId },
    orderBy: { startDate: "asc" }
  });
}

export async function getSprintDetails(id: string) {
  return prisma.sprint.findUnique({
    where: { id },
    include: { release: true }
  });
}

export type ScheduleWarning = {
  type: "OVERLAP" | "GAP";
  message: string;
};

export async function detectSprintScheduleWarnings(
  releaseId: string,
  proposedSprint: { id?: string; startDate: Date; endDate: Date }
): Promise<ScheduleWarning[]> {
  const warnings: ScheduleWarning[] = [];
  const sprints = await prisma.sprint.findMany({
    where: { releaseId },
    orderBy: { startDate: "asc" }
  });

  const otherSprints = sprints.filter((s) => s.id !== proposedSprint.id);

  // Check overlap (normalize to avoid timezone drift)
  const proposedStart = normalizeDate(proposedSprint.startDate);
  const proposedEnd = normalizeDate(proposedSprint.endDate);

  for (const sprint of otherSprints) {
    const sprintStart = normalizeDate(sprint.startDate);
    const sprintEnd = normalizeDate(sprint.endDate);
    if (
      proposedStart <= sprintEnd &&
      proposedEnd >= sprintStart
    ) {
      warnings.push({
        type: "OVERLAP",
        message: `Sprint dates cannot overlap with ${sprint.name}`
      });
      break;
    }
  }

  // Check release gap: find uncovered business-day periods inside release
  const release = await prisma.release.findUnique({ where: { id: releaseId } });
  if (!release) return warnings;

  const allSprints = otherSprints.concat([
    {
      ...proposedSprint,
      id: proposedSprint.id ?? "proposed",
      releaseId,
      name: "Proposed",
      goal: null,
      status: SprintStatus.PLANNED,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  allSprints.sort((a, b) => normalizeDate(a.startDate).getTime() - normalizeDate(b.startDate).getTime());

  // Find gaps between sprints that cover business days
  for (let i = 1; i < allSprints.length; i++) {
    const prev = allSprints[i - 1];
    const curr = allSprints[i];
    const dayAfterPrev = normalizeDate(prev.endDate);
    dayAfterPrev.setDate(dayAfterPrev.getDate() + 1);

    const currStart = normalizeDate(curr.startDate);
    if (dayAfterPrev < currStart) {
      // Check if there are business days in the gap
      const hasBusinessDays = hasBusinessDaysInRange(dayAfterPrev, currStart);
      if (hasBusinessDays) {
        warnings.push({
          type: "GAP",
          message: "Gap in release schedule: uncovered business days between sprints"
        });
        break;
      }
    }
  }

  return warnings;
}

function normalizeDate(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10) + "T00:00:00.000Z");
}

function hasBusinessDaysInRange(start: Date, end: Date): boolean {
  const current = normalizeDate(start);
  const endNorm = normalizeDate(end);
  while (current < endNorm) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      return true;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return false;
}

export async function updateSprint(
  id: string,
  input: SprintInput
): Promise<
  | { ok: true; data: Awaited<ReturnType<typeof getSprintDetails>>; warnings: ScheduleWarning[] }
  | { ok: false; errors: Record<string, string>; warnings?: ScheduleWarning[] }
> {
  const validated = await validateSprintInput(input);
  if (!validated.ok) {
    return { ok: false, errors: validated.errors };
  }

  const data = validated.data;
  const sprint = await prisma.sprint.findUnique({ where: { id } });
  if (!sprint) {
    return { ok: false, errors: { id: "Sprint not found" } };
  }

  const startDate = data.startDate ?? sprint.startDate;
  const endDate = data.endDate ?? sprint.endDate;

  const warnings = await detectSprintScheduleWarnings(sprint.releaseId, {
    id,
    startDate,
    endDate
  });

  const hasOverlap = warnings.some((w) => w.type === "OVERLAP");
  if (hasOverlap) {
    return {
      ok: false,
      errors: { dates: "Sprint dates cannot overlap with another sprint in this release" },
      warnings
    };
  }

  const updated = await prisma.sprint.update({
    where: { id },
    data: {
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status
    },
    include: { release: true }
  });

  return { ok: true, data: updated, warnings };
}

export function toSprintView(sprint: Awaited<ReturnType<typeof listSprintsForRelease>>[number]) {
  return {
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal ?? "",
    startDate: sprint.startDate.toISOString().slice(0, 10),
    endDate: sprint.endDate.toISOString().slice(0, 10),
    status: sprint.status
  };
}
