import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";
import { StoryStatus } from "@prisma/client";

export type StoryInput = {
  featureId: unknown;
  title: unknown;
  description?: unknown;
  acceptanceCriteria?: unknown;
  storyPoints?: unknown;
  estimatedDays?: unknown;
  status?: unknown;
  currentSprintId?: unknown;
};

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function optionalNonNegativeNumber(value: unknown, field: string): ValidationResult<number | null> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, data: null };
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return { ok: false, errors: { [field]: "Must be zero or greater" } };
  }

  return { ok: true, data: numeric };
}

function validateStoryStatus(value: unknown): ValidationResult<StoryStatus> {
  if (value === undefined || value === null || value === "") {
    return { ok: true, data: StoryStatus.BACKLOG };
  }

  const valid = Object.values(StoryStatus);
  if (valid.includes(value as StoryStatus)) {
    return { ok: true, data: value as StoryStatus };
  }

  return { ok: false, errors: { status: "Choose a valid status" } };
}

async function validateFeatureId(featureId: unknown): Promise<ValidationResult<string>> {
  const parsed = requireText(featureId, "featureId");
  if (!parsed.ok) {
    return parsed;
  }

  const feature = await prisma.feature.findUnique({ where: { id: parsed.data } });
  if (!feature) {
    return { ok: false, errors: { featureId: "Feature not found" } };
  }

  return parsed;
}

export async function validateStoryInput(input: StoryInput) {
  const featureId = await validateFeatureId(input.featureId);
  const title = requireText(input.title, "title");
  const storyPoints = optionalNonNegativeNumber(input.storyPoints, "storyPoints");
  const estimatedDays = optionalNonNegativeNumber(input.estimatedDays, "estimatedDays");
  const status = validateStoryStatus(input.status);

  if (!featureId.ok || !title.ok || !storyPoints.ok || !estimatedDays.ok || !status.ok) {
    return {
      ok: false as const,
      errors: mergeErrors(
        !featureId.ok ? featureId.errors : undefined,
        !title.ok ? title.errors : undefined,
        !storyPoints.ok ? storyPoints.errors : undefined,
        !estimatedDays.ok ? estimatedDays.errors : undefined,
        !status.ok ? status.errors : undefined
      )
    };
  }

  return {
    ok: true as const,
    data: {
      featureId: featureId.data,
      title: title.data,
      description: optionalText(input.description),
      acceptanceCriteria: optionalText(input.acceptanceCriteria),
      storyPoints: storyPoints.data,
      estimatedDays: estimatedDays.data,
      status: status.data
    }
  };
}

export async function createStory(input: StoryInput) {
  const validated = await validateStoryInput(input);
  if (!validated.ok) {
    return validated;
  }

  const currentSprintId = typeof input.currentSprintId === "string" && input.currentSprintId.trim()
    ? input.currentSprintId.trim()
    : null;

  if (currentSprintId) {
    const sprint = await prisma.sprint.findUnique({ where: { id: currentSprintId } });
    if (!sprint) {
      return { ok: false as const, errors: { currentSprintId: "Sprint not found" } };
    }
  }

  const story = await prisma.story.create({
    data: {
      ...validated.data,
      currentSprintId,
      status: currentSprintId ? StoryStatus.SPRINT_BACKLOG : validated.data.status
    },
    include: storyInclude
  });

  return { ok: true as const, data: story };
}

export async function updateStory(id: string, input: StoryInput) {
  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, errors: { general: "Story not found" } };
  }

  const requestedSprint =
    typeof input.currentSprintId === "string" && input.currentSprintId.trim().length > 0
      ? input.currentSprintId.trim()
      : input.currentSprintId === null
        ? null
        : undefined;

  if (!existing.currentSprintId && requestedSprint) {
    return { ok: false as const, errors: { currentSprintId: "Use backlog planning to assign a story to a sprint" } };
  }

  const validated = await validateStoryInput(input);
  if (!validated.ok) {
    return validated;
  }

  const story = await prisma.story.update({
    where: { id },
    data: {
      ...validated.data,
      currentSprintId: requestedSprint
    },
    include: storyInclude
  });

  return { ok: true as const, data: story };
}

export async function cancelStory(id: string) {
  const existing = await prisma.story.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, errors: { general: "Story not found" } };
  }

  const story = await prisma.story.update({
    where: { id },
    data: { status: StoryStatus.CANCELLED },
    include: storyInclude
  });

  return { ok: true as const, data: story };
}

const storyInclude = {
  feature: { include: { release: true } },
  currentSprint: true
};

export async function getStoryDetails(id: string) {
  return prisma.story.findUnique({
    where: { id },
    include: storyInclude
  });
}

export async function listStoriesForFeature(featureId: string) {
  return prisma.story.findMany({
    where: { featureId },
    include: storyInclude,
    orderBy: { createdAt: "asc" }
  });
}

export function toStoryView(story: NonNullable<Awaited<ReturnType<typeof getStoryDetails>>>) {
  return {
    id: story.id,
    featureId: story.featureId,
    featureName: story.feature.name,
    releaseId: story.feature.releaseId,
    title: story.title,
    description: story.description ?? "",
    acceptanceCriteria: story.acceptanceCriteria ?? "",
    storyPoints: story.storyPoints,
    estimatedDays: story.estimatedDays,
    status: story.status,
    currentSprintId: story.currentSprintId,
    currentSprintName: story.currentSprint?.name ?? "Backlog"
  };
}
