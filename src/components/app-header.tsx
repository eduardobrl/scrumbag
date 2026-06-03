import Link from "next/link";
import { Bot, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/lib/dashboard";
import { getActiveReleaseSummary } from "@/lib/releases";

export async function AppHeader() {
  const activeRelease = await getActiveReleaseSummary();
  const dashboard = activeRelease ? await getDashboardData(activeRelease.id) : null;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-white px-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Active release</span>
        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
        {activeRelease ? (
          <>
            <span className="font-semibold">{activeRelease.name}</span>
            <Badge tone="success">In progress</Badge>
            <Badge tone={dashboard?.risk === "Over capacity" ? "danger" : "success"}>
              Capacity: {dashboard?.plannedEffortDays.toFixed(1)} / {dashboard?.totalCapacityDays.toFixed(1)} days
            </Badge>
          </>
        ) : (
          <>
            <span className="font-semibold">No active release</span>
            <Badge>Not configured</Badge>
            <Badge tone="warning">Capacity: --</Badge>
          </>
        )}
      </div>
      <Link
        href="/assistant"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        Assistant AI
      </Link>
    </header>
  );
}
