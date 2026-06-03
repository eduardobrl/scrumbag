import { Badge } from "@/components/ui/badge";

export type ReleaseListItem = {
  id: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: string;
  sprintCount: number;
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning",
  CANCELLED: "danger"
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
  CANCELLED: "Cancelled"
};

export function ReleaseList({ releases }: { releases: ReleaseListItem[] }) {
  if (releases.length === 0) {
    return <p className="text-sm text-slate-500">No releases created yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Period</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Sprints</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {releases.map((release) => (
            <tr key={release.id}>
              <td className="px-3 py-3">
                <div className="font-medium">{release.name}</div>
                <div className="text-xs text-slate-500">{release.objective}</div>
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                {release.startDate} to {release.endDate}
              </td>
              <td className="px-3 py-3">
                <Badge tone={STATUS_TONE[release.status] ?? "neutral"}>
                  {STATUS_LABEL[release.status] ?? release.status}
                </Badge>
              </td>
              <td className="px-3 py-3">{release.sprintCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
