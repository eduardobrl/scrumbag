import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { countBusinessDaysInRange } from "@/lib/capacity";

export type SprintView = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  goal?: string;
  plannedEffortDays?: number;
};

export type ReleaseDetailView = {
  id: string;
  name: string;
  objective: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  meetingPercentage: number;
  supportPercentage: number;
  defaultSprintLengthBusinessDays: number;
  sprintCount: number;
  sprints: SprintView[];
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planejada",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Encerrada",
  CANCELLED: "Cancelada"
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning",
  CANCELLED: "danger"
};

const SPRINT_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planejada",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Encerrada"
};

export function ReleaseDetail({ release }: { release: ReleaseDetailView }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">{release.name}</h1>
          <p className="text-sm text-slate-500">{release.objective}</p>
        </div>
        <Button variant="secondary" asChild>
          <Link href={`/releases/${release.id}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Período</div>
          <div className="mt-1 text-sm font-semibold">
            {release.startDate} - {release.endDate}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</div>
          <div className="mt-1">
            <Badge tone={STATUS_TONE[release.status] ?? "neutral"}>
              {STATUS_LABEL[release.status] ?? release.status}
            </Badge>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Reuniões %</div>
          <div className="mt-1 text-sm font-semibold">{release.meetingPercentage}%</div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Sustentação %</div>
          <div className="mt-1 text-sm font-semibold">{release.supportPercentage}%</div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Duração padrão da sprint</div>
          <div className="mt-1 text-sm font-semibold">{release.defaultSprintLengthBusinessDays} dias úteis</div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Quantidade de sprints</div>
          <div className="mt-1 text-sm font-semibold">{release.sprintCount}</div>
        </Card>
      </div>

      {release.description && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Descrição</div>
          <p className="mt-1 text-sm text-slate-700">{release.description}</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sprints geradas</h2>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Sprint</th>
                <th className="px-3 py-2">Período</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Objetivo</th>
                <th className="px-3 py-2">Esforço planejado</th>
                <th className="px-3 py-2">Capacidade</th>
                <th className="px-3 py-2">Restante</th>
                <th className="px-3 py-2">Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {release.sprints.map((sprint) => (
                <tr key={sprint.id}>
                  <td className="px-3 py-3 font-medium">{sprint.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {sprint.startDate} - {sprint.endDate} ({countBusinessDaysInRange(sprint.startDate, sprint.endDate)} dias úteis)
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={sprint.status === "IN_PROGRESS" ? "success" : sprint.status === "CLOSED" ? "warning" : "neutral"}>
                      {SPRINT_STATUS_LABEL[sprint.status] ?? sprint.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{sprint.goal || "—"}</td>
                  <td className="px-3 py-3">{sprint.plannedEffortDays ?? 0}d</td>
                  <td className="px-3 py-3 text-slate-500">—</td>
                  <td className="px-3 py-3 text-slate-500">—</td>
                  <td className="px-3 py-3">
                    <Badge tone="neutral">Capacidade pendente</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
