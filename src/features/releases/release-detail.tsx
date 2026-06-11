import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { countBusinessDaysInRange } from "@/lib/capacity";
import { getTranslations } from "next-intl/server";
import { getReleaseStatusTone, type ReleaseStatusValue } from "@/lib/release-status";

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

export async function ReleaseDetail({ release }: { release: ReleaseDetailView }) {
  const tRelease = await getTranslations("release");
  const tCommon = await getTranslations("common");
  const tStatus = await getTranslations("status");

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
            {tCommon("edit")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tCommon("period")}</div>
          <div className="mt-1 text-sm font-semibold">
            {release.startDate} - {release.endDate}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tCommon("status")}</div>
          <div className="mt-1">
            <Badge tone={getReleaseStatusTone(release.status as ReleaseStatusValue)}>
              {tStatus(release.status)}
            </Badge>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tRelease("meetingPercentage")}</div>
          <div className="mt-1 text-sm font-semibold">{release.meetingPercentage}%</div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tRelease("supportPercentage")}</div>
          <div className="mt-1 text-sm font-semibold">{release.supportPercentage}%</div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tRelease("defaultSprintLengthBusinessDays")}</div>
          <div className="mt-1 text-sm font-semibold">{tCommon("workingDays", { count: release.defaultSprintLengthBusinessDays })}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tRelease("sprintCount")}</div>
          <div className="mt-1 text-sm font-semibold">{release.sprintCount}</div>
        </Card>
      </div>

      {release.description && (
        <Card>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{tRelease("description")}</div>
          <p className="mt-1 text-sm text-slate-700">{release.description}</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{tRelease("generatedSprints")}</h2>
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">{tRelease("sprint")}</th>
                <th className="px-3 py-2">{tCommon("period")}</th>
                <th className="px-3 py-2">{tCommon("status")}</th>
                <th className="px-3 py-2">{tRelease("objective")}</th>
                <th className="px-3 py-2">{tRelease("plannedEffort")}</th>
                <th className="px-3 py-2">{tCommon("capacity")}</th>
                <th className="px-3 py-2">{tRelease("remaining")}</th>
                <th className="px-3 py-2">{tRelease("risk")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {release.sprints.map((sprint) => (
                <tr key={sprint.id}>
                  <td className="px-3 py-3 font-medium">{sprint.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {sprint.startDate} - {sprint.endDate} ({tCommon("workingDays", { count: countBusinessDaysInRange(sprint.startDate, sprint.endDate) })})
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={sprint.status === "IN_PROGRESS" ? "success" : sprint.status === "CLOSED" ? "warning" : "neutral"}>
                      {tStatus(sprint.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{sprint.goal || "—"}</td>
                  <td className="px-3 py-3">{sprint.plannedEffortDays ?? 0}d</td>
                  <td className="px-3 py-3 text-slate-500">—</td>
                  <td className="px-3 py-3 text-slate-500">—</td>
                  <td className="px-3 py-3">
                    <Badge tone="neutral">{tRelease("capacityPending")}</Badge>
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
