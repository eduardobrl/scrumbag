import { Badge } from "@/components/ui/badge";
import { countBusinessDaysInRange } from "@/lib/date-utils";
import { getTranslations } from "next-intl/server";

export type SprintListItem = {
  id: string;
  name: string;
  goal: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  plannedEffortDays: number;
  capacityDays: number | null;
  remainingCapacityDays: number | null;
  occupancyPercentage: number | null;
  riskLabel: string;
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning"
};

function formatPeriod(start: Date, end: Date, workingDaysLabel: string): string {
  return `${start.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)} (${workingDaysLabel})`;
}

export async function SprintList({ sprints }: { sprints: SprintListItem[] }) {
  const [tSprint, tCommon, tStatus, tRisk] = await Promise.all([
    getTranslations("sprint"),
    getTranslations("common"),
    getTranslations("status"),
    getTranslations("risk")
  ]);

  if (sprints.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 text-center">
        <p className="text-sm text-slate-600">{tSprint("noSprints")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Sprint</th>
            <th className="px-3 py-2">{tCommon("period")}</th>
            <th className="px-3 py-2">{tCommon("status")}</th>
            <th className="px-3 py-2">{tSprint("goal")}</th>
            <th className="px-3 py-2">{tSprint("capacity")}</th>
            <th className="px-3 py-2">{tSprint("plannedEffort")}</th>
            <th className="px-3 py-2">{tSprint("remaining")}</th>
            <th className="px-3 py-2">{tSprint("occupancy")}</th>
            <th className="px-3 py-2">{tSprint("risk")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {sprints.map((sprint) => (
            <tr key={sprint.id} className="hover:bg-slate-50">
              <td className="px-3 py-3">
                <a href={`/sprints/${sprint.id}`} className="font-medium text-accent hover:underline">
                  {sprint.name}
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                {formatPeriod(
                  sprint.startDate,
                  sprint.endDate,
                  tCommon("workingDays", { count: countBusinessDaysInRange(sprint.startDate, sprint.endDate) })
                )}
              </td>
              <td className="px-3 py-3">
                <Badge tone={STATUS_TONE[sprint.status] ?? "neutral"}>{tStatus(sprint.status)}</Badge>
              </td>
              <td className="px-3 py-3 text-slate-600">{sprint.goal || "-"}</td>
              <td className="px-3 py-3 text-slate-600">{sprint.capacityDays?.toFixed(1) ?? "-"}d</td>
              <td className="px-3 py-3 text-slate-600">{sprint.plannedEffortDays}d</td>
              <td
                className={`px-3 py-3 ${
                  sprint.remainingCapacityDays !== null && sprint.remainingCapacityDays < 0
                    ? "text-red-700"
                    : "text-slate-600"
                }`}
              >
                {sprint.remainingCapacityDays?.toFixed(1) ?? "-"}d
              </td>
              <td className="px-3 py-3 text-slate-600">
                {sprint.occupancyPercentage !== null ? `${sprint.occupancyPercentage.toFixed(0)}%` : "-"}
              </td>
              <td className="px-3 py-3">
                <Badge tone={riskTone(sprint.riskLabel)}>{tRisk(sprint.riskLabel)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function riskTone(riskLabel: string): "neutral" | "success" | "warning" | "danger" {
  if (riskLabel.startsWith("Over capacity")) return "danger";
  if (riskLabel === "High risk" || riskLabel === "Medium risk") return "warning";
  if (riskLabel === "On track") return "success";
  return "neutral";
}
