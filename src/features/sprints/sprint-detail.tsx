"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import type { SprintPlanningSummary } from "@/lib/sprint-planning-summary";
import type { ScheduleWarning } from "@/lib/sprints";

export type SprintDetailView = {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  releaseName: string;
  releaseId: string;
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning"
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed"
};

export function SprintDetail({
  sprint,
  summary,
  warnings = []
}: {
  sprint: SprintDetailView;
  summary: SprintPlanningSummary;
  warnings?: ScheduleWarning[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sprints">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Sprints
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">{sprint.name}</h1>
        </div>
        <Button variant="secondary" asChild>
          <Link href={`/sprints/${sprint.id}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">Release:</span>{" "}
          <Link href={`/releases`} className="text-accent hover:underline">
            {sprint.releaseName}
          </Link>
        </p>
        <p>
          <span className="font-medium text-slate-800">Period:</span> {sprint.startDate} to{" "}
          {sprint.endDate}
        </p>
        <p>
          <span className="font-medium text-slate-800">Status:</span>{" "}
          <Badge tone={STATUS_TONE[sprint.status] ?? "neutral"}>
            {STATUS_LABEL[sprint.status] ?? sprint.status}
          </Badge>
        </p>
        <p>
          <span className="font-medium text-slate-800">Goal:</span>{" "}
          {sprint.goal || "No goal set"}
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-medium">Schedule warnings:</p>
          <ul className="mt-1 list-disc pl-4">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Gross capacity</p>
          <p className="text-lg font-semibold text-slate-800">{summary.grossCapacityDays.toFixed(1)}d</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Net capacity</p>
          <p className="text-lg font-semibold text-slate-800">{summary.netCapacityDays.toFixed(1)}d</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned effort</p>
          <p className="text-lg font-semibold text-slate-800">{summary.plannedEffortDays}d</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
          <p
            className={`text-lg font-semibold ${
              summary.remainingCapacityDays !== null && summary.remainingCapacityDays < 0
                ? "text-red-700"
                : "text-slate-800"
            }`}
          >
            {summary.remainingCapacityDays?.toFixed(1) ?? "-"}d
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Occupancy</p>
          <p className="text-lg font-semibold text-slate-800">
            {summary.occupancyPercentage !== null ? `${summary.occupancyPercentage.toFixed(0)}%` : "-"}
          </p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk</p>
          <Badge tone={riskTone(summary.riskLabel)}>{summary.riskLabel}</Badge>
        </Card>
      </div>

      {summary.capacityDays !== null && summary.plannedEffortDays > summary.capacityDays && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          Capacidade estourada em {(summary.plannedEffortDays - summary.capacityDays).toFixed(1)} dias
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button variant="secondary" asChild>
          <Link href={`/releases`}>Return to release</Link>
        </Button>
      </div>
    </div>
  );
}

function riskTone(riskLabel: string): "neutral" | "success" | "warning" | "danger" {
  if (riskLabel.startsWith("Over capacity")) return "danger";
  if (riskLabel === "High risk" || riskLabel === "Medium risk") return "warning";
  if (riskLabel === "On track") return "success";
  return "neutral";
}
