import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportList } from "@/features/reports/report-list";
import { getActiveReleaseSummary, listReleases } from "@/lib/releases";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [releases, activeRelease] = await Promise.all([listReleases(), getActiveReleaseSummary()]);
  const releaseOptions = releases.map((release) => ({
    id: release.id,
    name: release.name,
    status: release.status
  }));
  const defaultReleaseId = activeRelease?.id ?? releaseOptions[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Reports</h1>
        <p className="mt-1 text-sm text-slate-600">Generate planning, capacity, progress, leakage, and timeline exports.</p>
      </div>

      {releaseOptions.length === 0 ? (
        <Card>
          <h2 className="text-base font-semibold text-ink">No releases available</h2>
          <p className="mt-2 text-sm text-slate-600">Create a release before generating reports.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/releases">Open releases</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <ReportList releases={releaseOptions} defaultReleaseId={defaultReleaseId} />
      )}
    </div>
  );
}
