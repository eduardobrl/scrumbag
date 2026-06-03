import Link from "next/link";
import { Bot, FileSpreadsheet, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertPanel } from "@/features/dashboard/alert-panel";
import { DashboardCards } from "@/features/dashboard/dashboard-cards";
import { SprintTable } from "@/features/dashboard/sprint-table";
import { TimelineView } from "@/features/dashboard/timeline-view";
import { detectAlerts } from "@/lib/alerts";
import { getDashboardData } from "@/lib/dashboard";
import { getActiveReleaseSummary } from "@/lib/releases";
import { buildTimelineData } from "@/lib/timeline";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const activeRelease = await getActiveReleaseSummary();

  if (!activeRelease) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Create an active release to start tracking release health.</p>
        </div>
        <Card className="max-w-2xl">
          <h2 className="text-base font-semibold text-ink">No active release</h2>
          <p className="mt-2 text-sm text-slate-600">Release capacity, alerts, and timelines appear once a release is in progress.</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/releases">
                <PackagePlus className="h-4 w-4" aria-hidden />
                Open releases
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [dashboard, alerts, timeline] = await Promise.all([
    getDashboardData(activeRelease.id),
    detectAlerts(activeRelease.id),
    buildTimelineData(activeRelease.id)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            {dashboard.release.name} | {dashboard.release.startDate} to {dashboard.release.endDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/reports">
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/assistant">
              <Bot className="h-4 w-4" aria-hidden />
              Ask AI
            </Link>
          </Button>
        </div>
      </div>

      <DashboardCards data={dashboard} />
      <AlertPanel alerts={alerts} />
      <SprintTable sprints={dashboard.sprints} />
      <TimelineView data={timeline} />
    </div>
  );
}
