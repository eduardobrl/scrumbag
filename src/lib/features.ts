import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";
import { FeatureLifecycleStatus, StoryStatus } from "@prisma/client";

export type CalculatedFeatureStatus = "NOT_STARTED" | "IN_PROGRESS" | "FINISHED";

export type FeatureInput = {
  releaseId: unknown;
  name: unknown;
  description?: unknown;
};

export type FeatureSummary = {
  storyCount: number;
  finishedStoryCount: number;
  totalStoryPoints: number;
  totalEstimatedDays: number;
  calculatedStatus: CalculatedFeatureStatus;
  progressPercentage: number;
  periodLabel: string;
};

export type FeatureReassignmentUndo = {
  featureId: string;
  previousReleaseId: string;
  targetReleaseId: string;
  stories: Array<{
    id: string;
    previousSprintId: string | null;
    previousStatus: StoryStatus;
  }>;
};

type FeatureWithStories = Awaited<ReturnType<typeof getFeatureDetails>>;

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

async function requireRelease(releaseId: unknown): Promise<ValidationResult<string>> {
  const parsed = requireText(releaseId, "releaseId");

  if (!parsed.ok) {
    return parsed;
  }

  const release = await prisma.release.findUnique({ where: { id: parsed.data } });
  if (!release) {
    return { ok: false, errors: { releaseId: "Release not found" } };
  }

  return parsed;
}

export async function validateFeatureInput(input: FeatureInput) {
  const releaseId = await requireRelease(input.releaseId);
  const name = requireText(input.name, "name");

  if (!releaseId.ok || !name.ok) {
    return {
      ok: false as const,
      errors: mergeErrors(!releaseId.ok ? releaseId.errors : undefined, !name.ok ? name.errors : undefined)
    };
  }

  return {
    ok: true as const,
    data: {
      releaseId: releaseId.data,
      name: name.data,
      description: optionalText(input.description)
    }
  };
}

export function calculateFeatureSummary(stories: Array<{
  storyPoints: number | null;
  estimatedDays: number | null;
  status: StoryStatus;
  currentSprint?: { name: string; startDate: Date; endDate: Date } | null;
}>): FeatureSummary {
  const scopedStories = stories.filter((story) => story.status !== StoryStatus.CANCELLED);
  const storyCount = scopedStories.length;
  const finishedStories = scopedStories.filter((story) => story.status === StoryStatus.DONE);
  const activeStories = scopedStories.filter(
    (story) => story.status === StoryStatus.IN_PROGRESS || story.status === StoryStatus.DONE
  );
  const totalStoryPoints = scopedStories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0);
  const finishedStoryPoints = finishedStories.reduce((sum, story) => sum + (story.storyPoints ?? 0), 0);
  const totalEstimatedDays = scopedStories.reduce((sum, story) => sum + (story.estimatedDays ?? 0), 0);

  let calculatedStatus: CalculatedFeatureStatus = "NOT_STARTED";
  if (storyCount > 0 && finishedStories.length === storyCount) {
    calculatedStatus = "FINISHED";
  } else if (activeStories.length > 0) {
    calculatedStatus = "IN_PROGRESS";
  }

  const progressPercentage =
    storyCount === 0
      ? 0
      : totalStoryPoints > 0
        ? Math.round((finishedStoryPoints / totalStoryPoints) * 100)
        : Math.round((finishedStories.length / storyCount) * 100);

  const plannedStories = scopedStories.filter((story) => story.currentSprint);
  const periodLabel =
    plannedStories.length === 0
      ? "Unplanned"
      : plannedStories
          .map((story) => story.currentSprint!.name)
          .filter((name, index, names) => names.indexOf(name) === index)
          .join(" - ");

  return {
    storyCount,
    finishedStoryCount: finishedStories.length,
    totalStoryPoints,
    totalEstimatedDays,
    calculatedStatus,
    progressPercentage,
    periodLabel
  };
}

export async function createFeature(input: FeatureInput) {
  const validated = await validateFeatureInput(input);

  if (!validated.ok) {
    return validated;
  }

  const feature = await prisma.feature.create({
    data: {
      releaseId: validated.data.releaseId,
      name: validated.data.name,
      description: validated.data.description,
      lifecycleStatus: FeatureLifecycleStatus.ACTIVE
    },
    include: featureInclude
  });

  return { ok: true as const, data: feature };
}

export async function updateFeature(id: string, input: FeatureInput) {
  const existing = await prisma.feature.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, errors: { general: "Feature not found" } };
  }

  const validated = await validateFeatureInput(input);
  if (!validated.ok) {
    return validated;
  }

  const feature = await prisma.feature.update({
    where: { id },
    data: validated.data,
    include: featureInclude
  });

  return { ok: true as const, data: feature };
}

export async function cancelFeature(id: string) {
  const existing = await prisma.feature.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false as const, errors: { general: "Feature not found" } };
  }

  const feature = await prisma.feature.update({
    where: { id },
    data: { lifecycleStatus: FeatureLifecycleStatus.CANCELLED },
    include: featureInclude
  });

  return { ok: true as const, data: feature };
}

export async function reassignFeatureRelease(featureId: string, targetReleaseId: unknown) {
  const releaseId = await requireRelease(targetReleaseId);
  if (!releaseId.ok) {
    return releaseId;
  }

  const existing = await prisma.feature.findUnique({
    where: { id: featureId },
    include: { stories: true }
  });
  if (!existing) {
    return { ok: false as const, errors: { general: "Feature not found" } };
  }

  const undo: FeatureReassignmentUndo = {
    featureId,
    previousReleaseId: existing.releaseId,
    targetReleaseId: releaseId.data,
    stories: existing.stories.map((story) => ({
      id: story.id,
      previousSprintId: story.currentSprintId,
      previousStatus: story.status
    }))
  };

  if (existing.releaseId === releaseId.data) {
    const feature = await getFeatureDetails(featureId);
    return { ok: true as const, data: { feature: feature!, undo, changed: false } };
  }

  const feature = await prisma.$transaction(async (tx) => {
    await tx.feature.update({
      where: { id: featureId },
      data: { releaseId: releaseId.data }
    });
    await tx.story.updateMany({
      where: { featureId },
      data: {
        currentSprintId: null,
        status: StoryStatus.BACKLOG
      }
    });

    return tx.feature.findUniqueOrThrow({
      where: { id: featureId },
      include: featureInclude
    });
  });

  return { ok: true as const, data: { feature, undo, changed: true } };
}

function parseUndoPayload(value: unknown): ValidationResult<FeatureReassignmentUndo> {
  if (!value || typeof value !== "object") {
    return { ok: false, errors: { undo: "Undo payload is required" } };
  }

  const payload = value as Partial<FeatureReassignmentUndo>;
  if (
    typeof payload.featureId !== "string" ||
    typeof payload.previousReleaseId !== "string" ||
    typeof payload.targetReleaseId !== "string" ||
    !Array.isArray(payload.stories)
  ) {
    return { ok: false, errors: { undo: "Undo payload is invalid" } };
  }

  const stories = [];
  for (const story of payload.stories) {
    if (!story || typeof story !== "object") {
      return { ok: false, errors: { undo: "Undo story payload is invalid" } };
    }
    const item = story as Partial<FeatureReassignmentUndo["stories"][number]>;
    if (
      typeof item.id !== "string" ||
      !(typeof item.previousSprintId === "string" || item.previousSprintId === null) ||
      !Object.values(StoryStatus).includes(item.previousStatus as StoryStatus)
    ) {
      return { ok: false, errors: { undo: "Undo story payload is invalid" } };
    }
    stories.push({
      id: item.id,
      previousSprintId: item.previousSprintId,
      previousStatus: item.previousStatus as StoryStatus
    });
  }

  return {
    ok: true,
    data: {
      featureId: payload.featureId,
      previousReleaseId: payload.previousReleaseId,
      targetReleaseId: payload.targetReleaseId,
      stories
    }
  };
}

export async function undoReassignFeatureRelease(featureId: string, undoPayload: unknown) {
  const parsed = parseUndoPayload(undoPayload);
  if (!parsed.ok) {
    return parsed;
  }

  const undo = parsed.data;
  if (undo.featureId !== featureId) {
    return { ok: false as const, errors: { undo: "Undo payload does not match feature" } };
  }

  const [feature, previousRelease] = await Promise.all([
    prisma.feature.findUnique({ where: { id: featureId } }),
    prisma.release.findUnique({ where: { id: undo.previousReleaseId } })
  ]);
  if (!feature) {
    return { ok: false as const, errors: { general: "Feature not found" } };
  }
  if (!previousRelease) {
    return { ok: false as const, errors: { releaseId: "Release not found" } };
  }

  const sprintIds = undo.stories
    .map((story) => story.previousSprintId)
    .filter((id): id is string => typeof id === "string");
  const validSprints = new Set(
    (
      await prisma.sprint.findMany({
        where: { id: { in: sprintIds }, releaseId: undo.previousReleaseId },
        select: { id: true }
      })
    ).map((sprint) => sprint.id)
  );

  const restored = await prisma.$transaction(async (tx) => {
    await tx.feature.update({
      where: { id: featureId },
      data: { releaseId: undo.previousReleaseId }
    });

    for (const story of undo.stories) {
      const canRestoreSprint = story.previousSprintId === null || validSprints.has(story.previousSprintId);
      await tx.story.update({
        where: { id: story.id },
        data: canRestoreSprint
          ? {
              currentSprintId: story.previousSprintId,
              status: story.previousStatus
            }
          : {
              currentSprintId: null,
              status: StoryStatus.BACKLOG
            }
      });
    }

    return tx.feature.findUniqueOrThrow({
      where: { id: featureId },
      include: featureInclude
    });
  });

  return { ok: true as const, data: { feature: restored } };
}

const featureInclude = {
  release: true,
  stories: {
    include: {
      currentSprint: true
    },
    orderBy: { createdAt: "asc" as const }
  }
};

export async function listFeatures(releaseId?: string) {
  return prisma.feature.findMany({
    where: releaseId ? { releaseId } : undefined,
    include: featureInclude,
    orderBy: [{ lifecycleStatus: "asc" }, { createdAt: "desc" }]
  });
}

export async function getFeatureDetails(id: string) {
  return prisma.feature.findUnique({
    where: { id },
    include: featureInclude
  });
}

export function toFeatureView(feature: NonNullable<FeatureWithStories>) {
  const summary = calculateFeatureSummary(feature.stories);

  return {
    id: feature.id,
    releaseId: feature.releaseId,
    releaseName: feature.release.name,
    name: feature.name,
    description: feature.description ?? "",
    lifecycleStatus: feature.lifecycleStatus,
    createdAt: feature.createdAt.toISOString(),
    updatedAt: feature.updatedAt.toISOString(),
    summary
  };
}
