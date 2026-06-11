import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";
import { generateSprintsForRelease } from "@/lib/sprint-generation";
import { ReleaseStatus } from "@prisma/client";
import { captureReleaseEstimateBaseline } from "@/lib/release-estimates";
import { isAllowedReleaseTransition, isReleaseStatus } from "@/lib/release-status";

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
  if (isReleaseStatus(value)) {
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

export async function listReleaseOptions() {
  return prisma.release.findMany({
    select: { id: true, name: true, status: true, startDate: true, endDate: true },
    orderBy: [{ status: "asc" }, { startDate: "desc" }]
  });
}

export async function getReleaseById(id: string) {
  return prisma.release.findUnique({
    where: { id },
    include: { sprints: { orderBy: { startDate: "asc" } } }
  });
}

export async function getReleaseForView(releaseId?: string) {
  if (releaseId) {
    const selected = await getReleaseById(releaseId);
    if (selected) return selected;
  }

  return getActiveReleaseSummary();
}

export async function getReleaseDetails(id: string) {
  return prisma.release.findUnique({
    where: { id },
    include: { sprints: { orderBy: { startDate: "asc" } } }
  });
}

export async function getActiveReleaseSummary() {
  return prisma.release.findFirst({
    where: { status: ReleaseStatus.IN_PROGRESS },
    include: { sprints: { orderBy: { startDate: "asc" } } }
  });
}

export async function reconcileGeneratedSprints(
  releaseId: string,
  generatedRanges: { name: string; startDate: Date; endDate: Date }[]
) {
  const existingSprints = await prisma.sprint.findMany({
    where: { releaseId },
    orderBy: { startDate: "asc" }
  });

  // In v1, we assume no stories exist yet (Phase 3 hasn't run), so we can safely
  // remove extra generated sprints. In later phases, this check would need to
  // verify no stories are assigned before deleting.
  const safeToDelete = true; // v1: no story model yet

  const updates: Promise<unknown>[] = [];

  // Update existing sprints where possible
  for (let i = 0; i < Math.min(existingSprints.length, generatedRanges.length); i++) {
    const existing = existingSprints[i];
    const generated = generatedRanges[i];

    if (
      existing.name !== generated.name ||
      existing.startDate.getTime() !== generated.startDate.getTime() ||
      existing.endDate.getTime() !== generated.endDate.getTime()
    ) {
      updates.push(
        prisma.sprint.update({
          where: { id: existing.id },
          data: {
            name: generated.name,
            startDate: generated.startDate,
            endDate: generated.endDate
          }
        })
      );
    }
  }

  // Create missing sprints
  for (let i = existingSprints.length; i < generatedRanges.length; i++) {
    const generated = generatedRanges[i];
    updates.push(
      prisma.sprint.create({
        data: {
          releaseId,
          name: generated.name,
          startDate: generated.startDate,
          endDate: generated.endDate,
          status: "PLANNED"
        }
      })
    );
  }

  // Remove extra generated sprints only if safe (v1: always safe)
  if (safeToDelete) {
    for (let i = generatedRanges.length; i < existingSprints.length; i++) {
      updates.push(prisma.sprint.delete({ where: { id: existingSprints[i].id } }));
    }
  }

  await Promise.all(updates);
}

export async function updateRelease(id: string, input: ReleaseInput) {
  const existing = await prisma.release.findUnique({
    where: { id },
    include: { sprints: { orderBy: { startDate: "asc" } } }
  });

  if (!existing) {
    return { ok: false as const, errors: { general: "Release not found" } };
  }

  const validated = await validateReleaseInput(input);

  if (!validated.ok) {
    return validated;
  }

  const data = validated.data;

  if (!isAllowedReleaseTransition(existing.status as ReleaseStatus, data.status as ReleaseStatus)) {
    return {
      ok: false as const,
      errors: {
        status: "Release status must move forward one step at a time: PLANNED -> PLANNING -> IN_PROGRESS -> CLOSED"
      }
    };
  }

  // Prevent multiple IN_PROGRESS releases (unless this release is already IN_PROGRESS)
  if (data.status === ReleaseStatus.IN_PROGRESS && existing.status !== ReleaseStatus.IN_PROGRESS) {
    const existingActive = await prisma.release.findFirst({
      where: { status: ReleaseStatus.IN_PROGRESS }
    });

    if (existingActive && existingActive.id !== id) {
      return {
        ok: false as const,
        errors: { status: "Only one release can be in progress at a time" }
      };
    }
  }

  const needsSprintReconciliation =
    data.startDate.getTime() !== existing.startDate.getTime() ||
    data.endDate.getTime() !== existing.endDate.getTime() ||
    data.defaultSprintLengthBusinessDays !== existing.defaultSprintLengthBusinessDays;

  let sprintInputs: { name: string; startDate: Date; endDate: Date }[] | undefined;

  if (needsSprintReconciliation) {
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: data.startDate, lte: data.endDate }
      }
    });

    sprintInputs = generateSprintsForRelease({
      startDate: data.startDate,
      endDate: data.endDate,
      defaultSprintLengthBusinessDays: data.defaultSprintLengthBusinessDays,
      holidays: holidays.map((h) => h.date)
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const release = await tx.release.update({
      where: { id },
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

    if (existing.status === ReleaseStatus.PLANNING && data.status === ReleaseStatus.IN_PROGRESS) {
      await captureReleaseEstimateBaseline(tx, id);
    }

    if (sprintInputs) {
      const existingSprints = await tx.sprint.findMany({
        where: { releaseId: id },
        orderBy: { startDate: "asc" }
      });

      // Update existing sprints
      for (let i = 0; i < Math.min(existingSprints.length, sprintInputs.length); i++) {
        const existing = existingSprints[i];
        const generated = sprintInputs[i];
        if (
          existing.name !== generated.name ||
          existing.startDate.getTime() !== generated.startDate.getTime() ||
          existing.endDate.getTime() !== generated.endDate.getTime()
        ) {
          await tx.sprint.update({
            where: { id: existing.id },
            data: {
              name: generated.name,
              startDate: generated.startDate,
              endDate: generated.endDate
            }
          });
        }
      }

      // Create missing sprints
      for (let i = existingSprints.length; i < sprintInputs.length; i++) {
        const generated = sprintInputs[i];
        await tx.sprint.create({
          data: {
            releaseId: id,
            name: generated.name,
            startDate: generated.startDate,
            endDate: generated.endDate,
            status: "PLANNED"
          }
        });
      }

      // Remove extra sprints (safe in v1: no stories yet)
      for (let i = sprintInputs.length; i < existingSprints.length; i++) {
        await tx.sprint.delete({ where: { id: existingSprints[i].id } });
      }
    }

    return tx.release.findUniqueOrThrow({
      where: { id },
      include: { sprints: { orderBy: { startDate: "asc" } } }
    });
  });

  return { ok: true as const, data: updated };
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
      status: s.status,
      goal: s.goal ?? ""
    }))
  };
}

export function toActiveReleaseSummary(release: NonNullable<Awaited<ReturnType<typeof getActiveReleaseSummary>>>) {
  return {
    id: release.id,
    name: release.name,
    status: release.status,
    startDate: release.startDate.toISOString().slice(0, 10),
    endDate: release.endDate.toISOString().slice(0, 10)
  };
}
