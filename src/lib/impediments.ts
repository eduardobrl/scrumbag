import { prisma } from "@/lib/db";
import { countBusinessDaysInRange, normalizeDateOnly } from "@/lib/date-utils";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";
import { ImpedimentStatus } from "@prisma/client";

export type ImpedimentInput = {
  title: unknown;
  description?: unknown;
  reportedDate: unknown;
  affectedStoryIds: unknown;
};

export type ImpedimentUpdateInput = {
  title?: unknown;
  description?: unknown;
  reportedDate?: unknown;
  affectedStoryIds?: unknown;
};

export type ImpedimentResolveInput = {
  resolutionDate: unknown;
  resolutionNotes?: unknown;
};

const impedimentInclude = {
  affectedStories: {
    include: {
      feature: { include: { release: true } },
      currentSprint: true
    },
    orderBy: { title: "asc" as const }
  }
};

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseDateOnly(value: unknown, field: string): ValidationResult<Date> {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return { ok: false, errors: { [field]: "Required" } };
  }

  const date =
    value instanceof Date
      ? normalizeDateOnly(value)
      : new Date(`${value.trim().slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return { ok: false, errors: { [field]: "Choose a valid date" } };
  }

  return { ok: true, data: date };
}

function parseAffectedStoryIds(value: unknown): ValidationResult<string[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, errors: { affectedStoryIds: "Select at least one affected story" } };
  }

  const ids = Array.from(
    new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))
  );
  if (ids.length === 0) {
    return { ok: false, errors: { affectedStoryIds: "Select at least one affected story" } };
  }

  return { ok: true, data: ids.map((id) => id.trim()) };
}

async function validateAffectedStories(storyIds: string[]) {
  const stories = await prisma.story.findMany({
    where: { id: { in: storyIds } },
    include: { feature: true }
  });

  if (stories.length !== storyIds.length) {
    return { ok: false as const, errors: { affectedStoryIds: "One or more affected stories were not found" } };
  }

  const releaseIds = new Set(stories.map((story) => story.feature.releaseId));
  if (releaseIds.size > 1) {
    return { ok: false as const, errors: { affectedStoryIds: "Affected stories must belong to the same release" } };
  }

  return {
    ok: true as const,
    data: {
      storyIds,
      releaseId: stories[0]?.feature.releaseId ?? "",
      stories
    }
  };
}

export async function validateImpedimentInput(input: ImpedimentInput) {
  const title = requireText(input.title, "title");
  const reportedDate = parseDateOnly(input.reportedDate, "reportedDate");
  const affectedStoryIds = parseAffectedStoryIds(input.affectedStoryIds);

  if (!title.ok || !reportedDate.ok || !affectedStoryIds.ok) {
    return {
      ok: false as const,
      errors: mergeErrors(
        !title.ok ? title.errors : undefined,
        !reportedDate.ok ? reportedDate.errors : undefined,
        !affectedStoryIds.ok ? affectedStoryIds.errors : undefined
      )
    };
  }

  const affectedStories = await validateAffectedStories(affectedStoryIds.data);
  if (!affectedStories.ok) {
    return affectedStories;
  }

  return {
    ok: true as const,
    data: {
      title: title.data,
      description: optionalText(input.description),
      reportedDate: reportedDate.data,
      affectedStoryIds: affectedStories.data.storyIds,
      releaseId: affectedStories.data.releaseId
    }
  };
}

function validateResolutionInput(input: ImpedimentResolveInput, reportedDate: Date) {
  const resolutionDate = parseDateOnly(input.resolutionDate, "resolutionDate");
  if (!resolutionDate.ok) {
    return resolutionDate;
  }

  if (resolutionDate.data < normalizeDateOnly(reportedDate)) {
    return { ok: false as const, errors: { resolutionDate: "Resolution date cannot be before reported date" } };
  }

  return {
    ok: true as const,
    data: {
      resolutionDate: resolutionDate.data,
      resolutionNotes: optionalText(input.resolutionNotes)
    }
  };
}

export function calculateBlockedBusinessDays(reportedDate: Date, resolutionDate?: Date | null, today = new Date()) {
  return countBusinessDaysInRange(reportedDate, resolutionDate ?? today);
}

export function calculateDeliveryImpact(
  impediment: NonNullable<Awaited<ReturnType<typeof getImpedimentDetail>>>,
  today = new Date()
) {
  return {
    storyCount: impediment.affectedStories.length,
    estimatedDays: impediment.affectedStories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0),
    blockedBusinessDays: calculateBlockedBusinessDays(impediment.reportedDate, impediment.resolutionDate, today)
  };
}

export async function createImpediment(input: ImpedimentInput) {
  const validated = await validateImpedimentInput(input);
  if (!validated.ok) {
    return validated;
  }

  const impediment = await prisma.impediment.create({
    data: {
      title: validated.data.title,
      description: validated.data.description,
      reportedDate: validated.data.reportedDate,
      affectedStories: {
        connect: validated.data.affectedStoryIds.map((id) => ({ id }))
      }
    },
    include: impedimentInclude
  });

  return { ok: true as const, data: impediment };
}

export async function listImpedimentsByRelease(releaseId: string) {
  return prisma.impediment.findMany({
    where: {
      affectedStories: {
        some: {
          feature: { releaseId }
        }
      }
    },
    include: impedimentInclude,
    orderBy: [{ status: "asc" }, { reportedDate: "desc" }, { createdAt: "desc" }]
  });
}

export async function getImpedimentDetail(id: string) {
  return prisma.impediment.findUnique({
    where: { id },
    include: impedimentInclude
  });
}

export async function updateImpediment(id: string, input: ImpedimentUpdateInput) {
  const existing = await getImpedimentDetail(id);
  if (!existing) {
    return { ok: false as const, errors: { general: "Impediment not found" } };
  }

  const validated = await validateImpedimentInput({
    title: input.title ?? existing.title,
    description: input.description === undefined ? existing.description : input.description,
    reportedDate: input.reportedDate ?? existing.reportedDate,
    affectedStoryIds: input.affectedStoryIds ?? existing.affectedStories.map((story) => story.id)
  });
  if (!validated.ok) {
    return validated;
  }

  const impediment = await prisma.impediment.update({
    where: { id },
    data: {
      title: validated.data.title,
      description: validated.data.description,
      reportedDate: validated.data.reportedDate,
      affectedStories: {
        set: validated.data.affectedStoryIds.map((storyId) => ({ id: storyId }))
      }
    },
    include: impedimentInclude
  });

  return { ok: true as const, data: impediment };
}

export async function resolveImpediment(id: string, input: ImpedimentResolveInput) {
  const existing = await getImpedimentDetail(id);
  if (!existing) {
    return { ok: false as const, errors: { general: "Impediment not found" } };
  }

  if (existing.status === ImpedimentStatus.RESOLVED) {
    return { ok: false as const, errors: { status: "Resolved impediments cannot be reopened or resolved again" } };
  }

  const validated = validateResolutionInput(input, existing.reportedDate);
  if (!validated.ok) {
    return validated;
  }

  const impediment = await prisma.impediment.update({
    where: { id },
    data: {
      status: ImpedimentStatus.RESOLVED,
      resolutionDate: validated.data.resolutionDate,
      resolutionNotes: validated.data.resolutionNotes
    },
    include: impedimentInclude
  });

  return { ok: true as const, data: impediment };
}

export function toImpedimentView(impediment: NonNullable<Awaited<ReturnType<typeof getImpedimentDetail>>>) {
  const impact = calculateDeliveryImpact(impediment);

  return {
    id: impediment.id,
    title: impediment.title,
    description: impediment.description ?? "",
    reportedDate: impediment.reportedDate.toISOString().slice(0, 10),
    resolutionDate: impediment.resolutionDate?.toISOString().slice(0, 10) ?? null,
    resolutionNotes: impediment.resolutionNotes ?? "",
    status: impediment.status,
    releaseId: impediment.affectedStories[0]?.feature.releaseId ?? null,
    affectedStories: impediment.affectedStories.map((story) => ({
      id: story.id,
      title: story.title,
      status: story.status,
      estimatedDays: story.estimatedDays,
      featureId: story.featureId,
      featureName: story.feature.name,
      currentSprintId: story.currentSprintId,
      currentSprintName: story.currentSprint?.name ?? "Backlog"
    })),
    impact,
    createdAt: impediment.createdAt.toISOString(),
    updatedAt: impediment.updatedAt.toISOString()
  };
}
