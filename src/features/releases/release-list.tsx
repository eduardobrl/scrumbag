import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Eye, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";

export type ReleaseListItem = {
  id: string;
  name: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: string;
  sprintCount: number;
  meetingPercentage: number;
  supportPercentage: number;
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  IN_PROGRESS: "success",
  CLOSED: "warning",
  CANCELLED: "danger"
};

export async function ReleaseList({ releases }: { releases: ReleaseListItem[] }) {
  const [tRelease, tCommon, tStatus] = await Promise.all([
    getTranslations("release"),
    getTranslations("common"),
    getTranslations("status")
  ]);

  if (releases.length === 0) {
    return <p className="text-sm text-slate-500">{tRelease("noReleases")}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">{tRelease("name")}</th>
            <th className="px-3 py-2">{tCommon("period")}</th>
            <th className="px-3 py-2">{tCommon("status")}</th>
            <th className="px-3 py-2">{tRelease("sprintCount")}</th>
            <th className="px-3 py-2">{tRelease("meetings")}</th>
            <th className="px-3 py-2">{tCommon("support")}</th>
            <th className="px-3 py-2">{tCommon("actions")}</th>
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
                {release.startDate} - {release.endDate}
              </td>
              <td className="px-3 py-3">
                <Badge tone={STATUS_TONE[release.status] ?? "neutral"}>
                  {tStatus(release.status)}
                </Badge>
              </td>
              <td className="px-3 py-3">{release.sprintCount}</td>
              <td className="px-3 py-3">{release.meetingPercentage}%</td>
              <td className="px-3 py-3">{release.supportPercentage}%</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <IconButton label={tCommon("view")} href={`/releases/${release.id}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton label={tCommon("edit")} href={`/releases/${release.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
