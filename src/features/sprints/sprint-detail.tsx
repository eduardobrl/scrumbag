"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import type { SprintPlanningSummary } from "@/lib/sprint-planning-summary";

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
  summary
}: {
  sprint: SprintDetailView;
  summary: SprintPlanningSummary;
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Capacity</p>
          <p className="text-lg font-semibold text-slate-800">—</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned effort</p>
          <p className="text-lg font-semibold text-slate-800">{summary.plannedEffortDays}d</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</p>
          <p className="text-lg font-semibold text-slate-800">—</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Occupancy</p>
          <p className="text-lg font-semibold text-slate-800">—</p>
        </Card>
      </div>

      <Card className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk</p>
        <Badge tone="neutral">{summary.riskLabel}</Badge>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="secondary" asChild>
          <Link href={`/releases`}>Return to release</Link>
        </Button>
      </div>
    </div>
  );
}
