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
