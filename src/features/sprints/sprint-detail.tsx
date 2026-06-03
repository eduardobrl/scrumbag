"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
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

export type SprintClosureInfo = {
  finishedCount: number;
  unfinishedCount: number;
  destinationSprintName: string;
  hasNextSprint: boolean;
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
  warnings = [],
  closureInfo
}: {
  sprint: SprintDetailView;
  summary: SprintPlanningSummary;
  warnings?: ScheduleWarning[];
  closureInfo?: SprintClosureInfo;
}) {
  const [modal, setModal] = useState<"close" | "reopen" | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function runAction(action: "close" | "reopen") {
    setError("");
    const response = await fetch(`/api/sprints/${sprint.id}/${action}`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json();
      setError(Object.values(payload.errors ?? {}).join(", "));
      return;
    }
    startTransition(() => window.location.reload());
  }

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
        {sprint.status === "IN_PROGRESS" && (
          <Button type="button" variant="primary" onClick={() => setModal("close")}>
            Close Sprint
          </Button>
        )}
        {sprint.status === "CLOSED" && (
          <Button type="button" variant="secondary" onClick={() => setModal("reopen")}>
            Reopen Sprint
          </Button>
        )}
        <Button variant="secondary" asChild>
          <Link href={`/releases`}>Return to release</Link>
        </Button>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {modal === "close" && closureInfo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Close Sprint</h2>
            <dl className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Finished stories</dt>
                <dd className="font-medium">{closureInfo.finishedCount}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Unfinished stories</dt>
                <dd className="font-medium">{closureInfo.unfinishedCount}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate-700">
              As historias nao finalizadas serao movidas para {closureInfo.destinationSprintName}. Elas manterao o
              status atual.
            </p>
            {!closureInfo.hasNextSprint && (
              <p className="mt-2 text-sm text-amber-700">
                O sistema criara automaticamente uma nova sprint apos o encerramento.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={() => void runAction("close")}>
                Close Sprint
              </Button>
            </div>
          </div>
        </div>
      )}

      {modal === "reopen" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4">
          <div className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-ink">Reopen Sprint</h2>
            <p className="mt-4 text-sm text-slate-700">
              Esta acao permitira editar novamente a sprint. O historico de vazamentos sera mantido.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={() => void runAction("reopen")}>
                Reopen Sprint
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function riskTone(riskLabel: string): "neutral" | "success" | "warning" | "danger" {
  if (riskLabel.startsWith("Over capacity")) return "danger";
  if (riskLabel === "High risk" || riskLabel === "Medium risk") return "warning";
  if (riskLabel === "On track") return "success";
  return "neutral";
}
