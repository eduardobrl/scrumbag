import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";
import { generateSprintsForRelease } from "@/lib/sprint-generation";
import { ReleaseStatus } from "@prisma/client";

export type ReleaseInput = {
  name: unknown;
  objective: unknown;
  description?: unknown;
  startDate: unknown;
  endDate: unknown;
  defaultSprintLengthBusinessDays: unknown;
  meetingPercentage: unknown;
  supportPercentage: unknown;
  status: unknown;
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

function positiveInteger(value: unknown, field: string): ValidationResult<number> {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric <= 0) {
    return { ok: false, errors: { [field]: "Must be a positive integer" } };
  }

  return { ok: true, data: numeric };
}

function percentage(value: unknown, field: string): ValidationResult<number> {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    return { ok: false, errors: { [field]: "Must be between 0 and 100" } };
  }

  return { ok: true, data: numeric };
}

function validateReleaseStatus(value: unknown): ValidationResult<ReleaseStatus> {
  const valid = Object.values(ReleaseStatus);
  if (valid.includes(value as ReleaseStatus)) {
    return { ok: true, data: value as ReleaseStatus };
  }

  return { ok: false, errors: { status: "Choose a valid status" } };
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function validateReleaseInput(input: ReleaseInput) {
  const name = requireText(input.name, "name");
  const objective = requireText(input.objective, "objective");
  const startDate = dateOnly(input.startDate, "startDate");
  const endDate = dateOnly(input.endDate, "endDate");
  const defaultSprintLength = positiveInteger(input.defaultSprintLengthBusinessDays, "defaultSprintLengthBusinessDays");
  const meetingPercentageResult = percentage(input.meetingPercentage, "meetingPercentage");
  const supportPercentageResult = percentage(input.supportPercentage, "supportPercentage");
  const status = validateReleaseStatus(input.status);

  if (
    !name.ok ||
    !objective.ok ||
    !startDate.ok ||
    !endDate.ok ||
    !defaultSprintLength.ok ||
    !meetingPercentageResult.ok ||
    !supportPercentageResult.ok ||
    !status.ok
  ) {
    return {
      ok: false as const,
      errors: mergeErrors(
        !name.ok ? name.errors : undefined,
        !objective.ok ? objective.errors : undefined,
        !startDate.ok ? startDate.errors : undefined,
        !endDate.ok ? endDate.errors : undefined,
        !defaultSprintLength.ok ? defaultSprintLength.errors : undefined,
        !meetingPercentageResult.ok ? meetingPercentageResult.errors : undefined,
        !supportPercentageResult.ok ? supportPercentageResult.errors : undefined,
        !status.ok ? status.errors : undefined
      )
    };
  }

  if (endDate.data < startDate.data) {
    return { ok: false as const, errors: { endDate: "End date must be on or after start date" } };
  }

  const totalPercentage = meetingPercentageResult.data + supportPercentageResult.data;
  if (totalPercentage > 100) {
    return {
      ok: false as const,
      errors: { meetingPercentage: "Meeting + support percentages cannot exceed 100%" }
    };
  }

  return {
    ok: true as const,
    data: {
      name: name.data,
      objective: objective.data,
      description: optionalText(input.description),
      startDate: startDate.data,
      endDate: endDate.data,
      defaultSprintLengthBusinessDays: defaultSprintLength.data,
      meetingPercentage: meetingPercentageResult.data,
      supportPercentage: supportPercentageResult.data,
      status: status.data
    }
  };
}

export async function listReleases() {
  return prisma.release.findMany({
    include: { sprints: { orderBy: { startDate: "asc" } } },
    orderBy: [{ status: "asc" }, { startDate: "desc" }]
  });
}

export async function createRelease(input: ReleaseInput) {
  const validated = await validateReleaseInput(input);

  if (!validated.ok) {
    return validated;
  }

  const data = validated.data;

  // Prevent multiple IN_PROGRESS releases
  if (data.status === ReleaseStatus.IN_PROGRESS) {
    const existingActive = await prisma.release.findFirst({
      where: { status: ReleaseStatus.IN_PROGRESS }
    });

    if (existingActive) {
      return {
        ok: false as const,
        errors: { status: "Only one release can be in progress at a time" }
      };
    }
  }

  // Fetch holidays for sprint generation
  const holidays = await prisma.holiday.findMany({
    where: {
      date: { gte: data.startDate, lte: data.endDate }
    }
  });

  const sprintInputs = generateSprintsForRelease({
    startDate: data.startDate,
    endDate: data.endDate,
    defaultSprintLengthBusinessDays: data.defaultSprintLengthBusinessDays,
    holidays: holidays.map((h) => h.date)
  });

  const release = await prisma.$transaction(async (tx) => {
    const created = await tx.release.create({
      data: {
        name: data.name,
        objective: data.objective,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        defaultSprintLengthBusinessDays: data.defaultSprintLengthBusinessDays,
        meetingPercentage: data.meetingPercentage,
        supportPercentage: data.supportPercentage,
        status: data.status
      }
    });

    for (const sprint of sprintInputs) {
      await tx.sprint.create({
        data: {
          releaseId: created.id,
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          status: "PLANNED"
        }
      });
    }

    return tx.release.findUniqueOrThrow({
      where: { id: created.id },
      include: { sprints: { orderBy: { startDate: "asc" } } }
    });
  });

  return { ok: true as const, data: release };
}

export function toReleaseView(release: Awaited<ReturnType<typeof listReleases>>[number]) {
  return {
    id: release.id,
    name: release.name,
    objective: release.objective,
    description: release.description ?? "",
    startDate: release.startDate.toISOString().slice(0, 10),
    endDate: release.endDate.toISOString().slice(0, 10),
    defaultSprintLengthBusinessDays: release.defaultSprintLengthBusinessDays,
    meetingPercentage: release.meetingPercentage,
    supportPercentage: release.supportPercentage,
    status: release.status,
    sprintCount: release.sprints.length,
    sprints: release.sprints.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate.toISOString().slice(0, 10),
      endDate: s.endDate.toISOString().slice(0, 10),
      status: s.status
    }))
  };
}
