"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportViewer } from "@/features/reports/report-viewer";
import type { GeneratedReport } from "@/lib/reports";
import { REPORT_LABELS, REPORT_TYPES, type ReportType } from "@/lib/report-types";

type ReleaseOption = {
  id: string;
  name: string;
  status: string;
};

export function ReportList({
  releases,
  defaultReleaseId
}: {
  releases: ReleaseOption[];
  defaultReleaseId: string;
}) {
  const [releaseId, setReleaseId] = useState(defaultReleaseId);
  const [reportType, setReportType] = useState<ReportType>("release-planning");
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reportType, releaseId })
      });
      setReport(response.ok ? await response.json() : null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-medium text-slate-700">
            Release
            <select
              value={releaseId}
              onChange={(event) => setReleaseId(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.name} ({release.status})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Tipo de relatório
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value as ReportType)}
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              {REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {REPORT_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" onClick={generate} disabled={loading || releases.length === 0}>
              {loading ? "Gerando..." : "Gerar relatório"}
            </Button>
          </div>
        </div>
      </Card>
      <ReportViewer report={report} reportType={reportType} releaseId={releaseId} />
    </div>
  );
}
