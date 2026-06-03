"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GeneratedReport } from "@/lib/reports";
import type { ReportType } from "@/lib/report-types";

type Props = {
  report: GeneratedReport | null;
  reportType: ReportType;
  releaseId: string;
};

export function ReportViewer({ report, reportType, releaseId }: Props) {
  async function download(format: "csv" | "xlsx") {
    const response = await fetch("/api/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, type: reportType, releaseId })
    });
    if (!response.ok) return;

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    const name = match?.[1] ?? `${reportType}.${format}`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!report) {
    return (
      <Card>
        <h2 className="text-base font-semibold text-ink">Report preview</h2>
        <p className="mt-2 text-sm text-slate-600">Generate a report to preview rows and export files.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{report.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{report.rows.length} rows</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => download("csv")}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
          <Button type="button" variant="secondary" onClick={() => download("xlsx")}>
            <Download className="h-4 w-4" aria-hidden />
            Export Excel
          </Button>
        </div>
      </div>
      {report.rows.length === 0 ? (
        <div className="p-6 text-sm text-slate-600">No data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {report.columns.map((column) => (
                  <th key={column.key} className="px-3 py-2">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {report.rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {report.columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-3 py-3 text-slate-700">
                      {String(row[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
