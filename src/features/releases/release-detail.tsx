import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";

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
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
  CANCELLED: "Cancelled"
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning",
  CANCELLED: "danger"
};

const SPRINT_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed"
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
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Period</div>
          <div className="mt-1 text-sm font-semibold">
            {release.startDate} to {release.endDate}
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
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Meeting %</div>
          <div className="mt-1 text-sm font-semibold">{release.meetingPercentage}%</div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Support %</div>
          <div className="mt-1 text-sm font-semibold">{release.supportPercentage}%</div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Default sprint length</div>
          <div className="mt-1 text-sm font-semibold">{release.defaultSprintLengthBusinessDays} business days</div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Sprint count</div>
          <div className="mt-1 text-sm font-semibold">{release.sprintCount}</div>
        </Card>
      </div>

      {release.description && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</div>
          <p className="mt-1 text-sm text-slate-700">{release.description}</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Generated sprints</h2>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Sprint</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Goal</th>
                <th className="px-3 py-2">Planned effort</th>
                <th className="px-3 py-2">Capacity</th>
                <th className="px-3 py-2">Remaining</th>
                <th className="px-3 py-2">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {release.sprints.map((sprint) => (
                <tr key={sprint.id}>
                  <td className="px-3 py-3 font-medium">{sprint.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{sprint.startDate} to {sprint.endDate}</td>
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
                    <Badge tone="neutral">Pending capacity</Badge>
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
