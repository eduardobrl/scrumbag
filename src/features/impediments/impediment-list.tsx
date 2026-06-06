import Link from "next/link";
import React from "react";
import { Badge } from "@/components/ui/badge";

export type ImpedimentListItem = {
  id: string;
  title: string;
  reportedDate: string;
  status: string;
  impact: {
    storyCount: number;
    estimatedDays: number;
    blockedBusinessDays: number;
  };
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberto",
  RESOLVED: "Resolvido"
};

export function ImpedimentList({
  impediments,
  releaseId
}: {
  impediments: ImpedimentListItem[];
  releaseId?: string;
}) {
  if (impediments.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-slate-600">
        Nenhum impedimento para esta release ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Impedimento</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Registro</th>
            <th className="px-3 py-2">Historias</th>
            <th className="px-3 py-2">Dias estimados</th>
            <th className="px-3 py-2">Dias bloqueados</th>
            <th className="px-3 py-2">Acao</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {impediments.map((impediment) => (
            <tr key={impediment.id}>
              <td className="px-3 py-3 font-medium text-slate-900">{impediment.title}</td>
              <td className="px-3 py-3">
                <Badge tone={impediment.status === "RESOLVED" ? "success" : "warning"}>
                  {STATUS_LABEL[impediment.status] ?? impediment.status}
                </Badge>
              </td>
              <td className="px-3 py-3">{impediment.reportedDate}</td>
              <td className="px-3 py-3">{impediment.impact.storyCount}</td>
              <td className="px-3 py-3">{impediment.impact.estimatedDays}d</td>
              <td className="px-3 py-3">{impediment.impact.blockedBusinessDays}d</td>
              <td className="px-3 py-3">
                <Link
                  className="text-sm font-medium text-accent hover:text-teal-800"
                  href={`/impediments/${impediment.id}${releaseId ? `?releaseId=${encodeURIComponent(releaseId)}` : ""}`}
                >
                  Visualizar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
