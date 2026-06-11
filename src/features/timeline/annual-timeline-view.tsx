"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { clsx } from "clsx";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FeatureMoveToast, type FeatureMoveToastState } from "@/features/timeline/feature-move-toast";
import type { FeatureReassignmentUndo } from "@/lib/features";
import type { AnnualTimelineData, AnnualTimelineFeature } from "@/lib/annual-timeline";
import { useTranslations } from "next-intl";
import { getReleaseStatusTone, type ReleaseStatusValue } from "@/lib/release-status";

export type AnnualTimelineLabels = {
  title: string;
  subtitle: string;
  comparisonTitle: string;
  release: string;
  features: string;
  stories: string;
  estimatedDays: string;
  completion: string;
  sprints: string;
  remainingCapacity: string;
  noReleases: string;
  noFeatures: string;
  orphanFeatures: string;
  noOrphanFeatures: string;
  active: string;
  finished: string;
  cancelled: string;
  unplanned: string;
  legendActive: string;
  legendFinished: string;
  legendCancelled: string;
  legendGap: string;
  movedTo: string;
  undo: string;
};

export type DragFeatureData = {
  featureId: string;
  sourceReleaseId: string | null;
  featureName: string;
};

export function buildFeatureReassignmentRequest(featureId: string, targetReleaseId: string) {
  return {
    url: `/api/features/${featureId}`,
    init: {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reassignRelease", targetReleaseId })
    }
  };
}

export function getFeatureDropTargetId(overId: string | null | undefined): string | null {
  return overId?.startsWith("release-drop-") ? overId.replace("release-drop-", "") : null;
}

export function getFeatureDragId(activeId: string | null | undefined): string | null {
  return activeId?.startsWith("feature-drag-") ? activeId.replace("feature-drag-", "") : null;
}

export function shouldIgnoreFeatureDrop(
  feature: DragFeatureData | undefined,
  targetReleaseId: string | null,
  pendingMove: boolean
) {
  return !feature || !targetReleaseId || feature.sourceReleaseId === targetReleaseId || pendingMove;
}

export function AnnualTimelineView({
  data,
  labels
}: {
  data: AnnualTimelineData;
  labels: AnnualTimelineLabels;
}) {
  const router = useRouter();
  const tStatus = useTranslations("status");
  const [pendingMove, setPendingMove] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [toast, setToast] = useState<FeatureMoveToastState>(null);

  async function handleDragEnd(event: DragEndEvent) {
    const featureFromData = event.active.data.current as DragFeatureData | undefined;
    const featureId = getFeatureDragId(typeof event.active.id === "string" ? event.active.id : null);
    const featureFromTimeline = featureId
      ? [...data.orphanFeatures, ...data.releases.flatMap((release) => release.features)].find((item) => item.id === featureId)
      : undefined;
    const feature = featureFromData ?? (featureFromTimeline
      ? {
          featureId: featureFromTimeline.id,
          sourceReleaseId: featureFromTimeline.releaseId,
          featureName: featureFromTimeline.name
        }
      : undefined);
    const targetReleaseId = getFeatureDropTargetId(typeof event.over?.id === "string" ? event.over.id : null);

    if (shouldIgnoreFeatureDrop(feature, targetReleaseId, pendingMove) || !feature || !targetReleaseId) {
      return;
    }

    const targetRelease = data.releases.find((release) => release.id === targetReleaseId);
    if (!targetRelease) {
      return;
    }

    setPendingMove(true);
    try {
      const request = buildFeatureReassignmentRequest(feature.featureId, targetReleaseId);
      const response = await fetch(request.url, request.init);
      const payload = (await response.json()) as { undo?: FeatureReassignmentUndo; errors?: unknown };
      if (!response.ok || !payload.undo) {
        throw new Error("Feature move failed");
      }
      router.refresh();
      setToast({
        message: `${feature.featureName} ${labels.movedTo} ${targetRelease.name}`,
        undo: payload.undo
      });
    } finally {
      setPendingMove(false);
    }
  }

  async function undoMove() {
    if (!toast || undoing) {
      return;
    }

    setUndoing(true);
    try {
      await fetch(`/api/features/${toast.undo.featureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undoReassignRelease", undo: toast.undo })
      });
      setToast(null);
      router.refresh();
    } finally {
      setUndoing(false);
    }
  }

  if (data.releases.length === 0) {
    return (
      <Card>
        <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{labels.noReleases}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">{labels.comparisonTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{labels.subtitle}</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[860px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4 font-semibold">{labels.release}</th>
                <th className="px-3 py-2 font-semibold">{labels.features}</th>
                <th className="px-3 py-2 font-semibold">{labels.stories}</th>
                <th className="px-3 py-2 font-semibold">{labels.estimatedDays}</th>
                <th className="px-3 py-2 font-semibold">{labels.completion}</th>
                <th className="px-3 py-2 font-semibold">{labels.sprints}</th>
                <th className="px-3 py-2 font-semibold">{labels.remainingCapacity}</th>
              </tr>
            </thead>
            <tbody>
              {data.summaries.map((summary) => (
                <tr key={summary.id} className="border-b border-line last:border-b-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{summary.name}</div>
                    <div className="text-xs text-slate-500">
                      {summary.startDate} - {summary.endDate}
                    </div>
                  </td>
                  <td className="px-3 py-3">{summary.featureCount}</td>
                  <td className="px-3 py-3">{summary.storyCount}</td>
                  <td className="px-3 py-3">{summary.estimatedDays.toFixed(1)}d</td>
                  <td className="px-3 py-3">{summary.completionPercentage}%</td>
                  <td className="px-3 py-3">{summary.sprintCount}</td>
                  <td
                    className={clsx(
                      "px-3 py-3 font-medium",
                      summary.remainingCapacityDays < 0 ? "text-red-700" : "text-emerald-700"
                    )}
                  >
                    {summary.remainingCapacityDays.toFixed(1)}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DndContext id="annual-timeline-dnd" onDragEnd={handleDragEnd}>
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">{labels.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{labels.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <Legend swatch="bg-accent" label={labels.legendActive} />
              <Legend swatch="bg-emerald-600" label={labels.legendFinished} />
              <Legend swatch="border border-slate-300 bg-slate-100" label={labels.legendCancelled} />
              <Legend swatch="border border-dashed border-slate-300 bg-white" label={labels.legendGap} />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[1120px] text-sm">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: "220px repeat(12, minmax(72px, 1fr))" }}
              >
                <div />
                {data.quarters.map((quarter) => (
                  <div
                    key={quarter.quarter}
                    className="rounded-md border border-line bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-600"
                    style={{ gridColumn: `span ${quarter.monthCount}` }}
                  >
                    {quarter.label}
                  </div>
                ))}
                <div />
                {data.months.map((month) => (
                  <div
                    key={month.index}
                    className="rounded-md border border-line bg-white px-2 py-2 text-center text-xs font-semibold text-slate-600"
                  >
                    {month.label}
                  </div>
                ))}
              </div>

              <OrphanFeaturesSection features={data.orphanFeatures} labels={labels} pendingMove={pendingMove} />

              {data.releases.map((release) => (
                <ReleaseSwimlane
                  key={release.id}
                  release={release}
                  labels={labels}
                  pendingMove={pendingMove}
                  statusLabel={tStatus}
                />
              ))}
            </div>
          </div>
        </Card>
      </DndContext>
      <FeatureMoveToast
        toast={toast}
        undoing={undoing}
        undoLabel={labels.undo}
        onUndo={undoMove}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

function OrphanFeaturesSection({
  features,
  labels,
  pendingMove
}: {
  features: AnnualTimelineFeature[];
  labels: AnnualTimelineLabels;
  pendingMove: boolean;
}) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{labels.orphanFeatures}</h3>
        <span className="text-xs text-slate-500">{features.length}</span>
      </div>
      {features.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{labels.noOrphanFeatures}</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <DraggableOrphanFeature key={feature.id} feature={feature} disabled={pendingMove} labels={labels} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableOrphanFeature({
  feature,
  disabled,
  labels
}: {
  feature: AnnualTimelineFeature;
  disabled: boolean;
  labels: AnnualTimelineLabels;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `feature-drag-${feature.id}`,
    disabled,
    data: {
      featureId: feature.id,
      sourceReleaseId: null,
      featureName: feature.name
    } satisfies DragFeatureData
  });
  const transformStyle = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;

  return (
    <Link
      ref={setNodeRef}
      href={`/features/${feature.id}`}
      {...attributes}
      {...listeners}
      data-feature-id={feature.id}
      data-orphan-feature-id={feature.id}
      className={clsx(
        "block rounded-md border border-line bg-white px-3 py-2 text-sm shadow-sm transition-opacity hover:border-accent",
        isDragging && "opacity-70"
      )}
      style={{ transform: transformStyle }}
      title={`${feature.name} - ${labels.orphanFeatures}`}
      aria-label={`${feature.name} - ${labels.orphanFeatures}`}
    >
      <span className="block truncate font-medium text-accent">{feature.name}</span>
      <span className="mt-1 block text-xs text-slate-500">
        {feature.storyCount} {labels.stories} / {feature.estimatedDays.toFixed(1)}d / {feature.completionPercentage}%
      </span>
    </Link>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={clsx("h-2 w-5 rounded", swatch)} />
      {label}
    </span>
  );
}

function ReleaseSwimlane({
  release,
  labels,
  pendingMove,
  statusLabel
}: {
  release: AnnualTimelineData["releases"][number];
  labels: AnnualTimelineLabels;
  pendingMove: boolean;
  statusLabel: (status: string) => string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `release-drop-${release.id}` });

  return (
    <div
      ref={setNodeRef}
      data-release-id={release.id}
      className={clsx(
        "mt-3 grid gap-1 rounded-md border p-1 transition-colors",
        isOver ? "border-accent bg-teal-50" : "border-transparent"
      )}
      style={{ gridTemplateColumns: "220px repeat(12, minmax(72px, 1fr))" }}
    >
      <div className="col-span-full rounded-md border border-line bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{release.name}</span>
          <Badge tone={getReleaseStatusTone(release.status as ReleaseStatusValue)}>
            {statusLabel(release.status)}
          </Badge>
          <span className="text-xs text-slate-500">
            {release.startDate} - {release.endDate}
          </span>
        </div>
      </div>
      {release.features.length === 0 ? (
        <>
          <div className="flex min-h-11 items-center text-sm text-slate-500">{labels.noFeatures}</div>
          {Array.from({ length: 12 }, (_, index) => (
            <div key={`${release.id}-empty-${index}`} className="min-h-11 rounded-sm border border-transparent" />
          ))}
        </>
      ) : (
        release.features.map((feature) => (
          <FeatureRow key={feature.id} feature={feature} labels={labels} pendingMove={pendingMove} />
        ))
      )}
    </div>
  );
}

function FeatureRow({
  feature,
  labels,
  pendingMove
}: {
  feature: AnnualTimelineFeature;
  labels: AnnualTimelineLabels;
  pendingMove: boolean;
}) {
  const activeSet = new Set(feature.activeMonthIndexes);
  const statusLabel =
    feature.status === "CANCELLED" ? labels.cancelled : feature.status === "FINISHED" ? labels.finished : labels.active;

  return (
    <>
      <Link
        href={`/features/${feature.id}`}
        className={clsx(
          "flex min-h-11 items-center gap-2 overflow-hidden text-sm font-medium text-accent hover:underline",
          feature.status === "CANCELLED" && "text-slate-500 line-through"
        )}
      >
        <span className="min-w-0 truncate">{feature.name}</span>
        <span className="shrink-0 text-xs font-normal text-slate-500">{feature.completionPercentage}%</span>
      </Link>
      {Array.from({ length: 12 }, (_, index) => {
        const inSpan = feature.startIndex !== null && feature.endIndex !== null && index >= feature.startIndex && index <= feature.endIndex;
        const activeHere = activeSet.has(index);
        const isGap = inSpan && !activeHere;

        return (
          <div key={`${feature.id}-${index}`} className="flex min-h-11 items-center">
            {inSpan ? (
              <DraggableFeatureBar
                feature={feature}
                disabled={pendingMove}
                isGap={isGap}
                label={`${feature.name} - ${isGap ? labels.legendGap : statusLabel}`}
              />
            ) : index === 0 && feature.startIndex === null ? (
              <DraggableUnplannedFeature feature={feature} disabled={pendingMove} label={`${feature.name} - ${labels.unplanned}`}>
                {labels.unplanned}
              </DraggableUnplannedFeature>
            ) : (
              <div className="h-5 w-full rounded-sm border border-transparent" />
            )}
          </div>
        );
      })}
    </>
  );
}

function DraggableUnplannedFeature({
  feature,
  disabled,
  label,
  children
}: {
  feature: AnnualTimelineFeature;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `feature-drag-${feature.id}`,
    disabled,
    data: {
      featureId: feature.id,
      sourceReleaseId: feature.releaseId,
      featureName: feature.name
    } satisfies DragFeatureData
  });
  const transformStyle = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;

  return (
    <Link
      ref={setNodeRef}
      href={`/features/${feature.id}`}
      {...attributes}
      {...listeners}
      data-feature-id={feature.id}
      className={clsx(
        "flex h-5 w-full items-center rounded-sm border border-dashed border-slate-300 bg-white px-2 text-[11px] text-slate-500 transition-opacity",
        isDragging && "opacity-70"
      )}
      style={{ transform: transformStyle }}
      title={label}
      aria-label={label}
    >
      {children}
    </Link>
  );
}

function DraggableFeatureBar({
  feature,
  disabled,
  isGap,
  label
}: {
  feature: AnnualTimelineFeature;
  disabled: boolean;
  isGap: boolean;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `feature-drag-${feature.id}`,
    disabled,
    data: {
      featureId: feature.id,
      sourceReleaseId: feature.releaseId,
      featureName: feature.name
    } satisfies DragFeatureData
  });
  const transformStyle = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined;

  return (
    <Link
      ref={setNodeRef}
      href={`/features/${feature.id}`}
      {...attributes}
      {...listeners}
      data-feature-id={feature.id}
      className={clsx(
        "h-5 w-full rounded-sm border transition-opacity",
        isDragging && "opacity-70",
        feature.status === "CANCELLED"
          ? "border-slate-300 bg-slate-100"
          : feature.status === "FINISHED"
            ? "border-transparent bg-emerald-600"
            : isGap
              ? "border-dashed border-slate-300 bg-white"
              : "border-transparent bg-accent"
      )}
      style={{ transform: transformStyle }}
      title={label}
      aria-label={label}
    />
  );
}
