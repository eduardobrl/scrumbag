import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DashboardSprintRow } from "@/lib/dashboard";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning"
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planejada",
  IN_PROGRESS: "Em andamento",
  CLOSED: "Encerrada"
};

function occupancyTone(value: number): "success" | "warning" | "danger" {
  if (value > 100) return "danger";
  if (value > 80) return "warning";
  return "success";
}

export function SprintTable({ sprints }: { sprints: DashboardSprintRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line p-4">
        <h2 className="text-base font-semibold text-ink">Sprints</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Sprint</th>
              <th className="px-3 py-2">Período</th>
              <th className="px-3 py-2">Objetivo</th>
              <th className="px-3 py-2">Capacidade</th>
              <th className="px-3 py-2">Planejado</th>
              <th className="px-3 py-2">Restante</th>
              <th className="px-3 py-2">Ocupação</th>
              <th className="px-3 py-2">Progresso</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {sprints.map((sprint) => (
              <tr key={sprint.id} className="hover:bg-slate-50">
                <td className="px-3 py-3">
                  <Link href={`/sprints/${sprint.id}`} className="font-medium text-accent hover:underline">
                    {sprint.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-600">{sprint.period}</td>
                <td className="max-w-64 px-3 py-3 text-slate-600">{sprint.goal || "-"}</td>
                <td className="px-3 py-3 text-slate-600">{sprint.netCapacityDays.toFixed(1)}d</td>
                <td className="px-3 py-3 text-slate-600">{sprint.plannedEffortDays.toFixed(1)}d</td>
                <td className={sprint.remainingCapacityDays < 0 ? "px-3 py-3 text-red-700" : "px-3 py-3 text-slate-600"}>
                  {sprint.remainingCapacityDays.toFixed(1)}d
                </td>
                <td className="px-3 py-3">
                  <Badge tone={occupancyTone(sprint.occupancyPercentage)}>
                    {sprint.occupancyPercentage.toFixed(0)}%
                  </Badge>
                </td>
                <td className="px-3 py-3 text-slate-600">{sprint.progressPercentage.toFixed(0)}%</td>
                <td className="px-3 py-3">
                  <Badge tone={STATUS_TONE[sprint.status] ?? "neutral"}>{STATUS_LABEL[sprint.status] ?? sprint.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
