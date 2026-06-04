import { ReleaseSwitcher } from "@/components/release-switcher";
import { getDashboardData } from "@/lib/dashboard";
import { getActiveReleaseSummary, listReleaseOptions } from "@/lib/releases";

export async function AppHeader() {
  const [activeRelease, releases] = await Promise.all([getActiveReleaseSummary(), listReleaseOptions()]);
  const releaseOptions = await Promise.all(
    releases.map(async (release) => {
      try {
        const dashboard = await getDashboardData(release.id);
        return {
          id: release.id,
          name: release.name,
          status: release.status,
          capacityLabel: `Capacidade: ${dashboard.plannedEffortDays.toFixed(1)} / ${dashboard.totalCapacityDays.toFixed(1)} dias`,
          overCapacity: dashboard.risk === "Over capacity"
        };
      } catch {
        return {
          id: release.id,
          name: release.name,
          status: release.status,
          capacityLabel: null,
          overCapacity: false
        };
      }
    })
  );

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b border-line bg-white px-6">
      <ReleaseSwitcher releases={releaseOptions} defaultReleaseId={activeRelease?.id ?? releases[0]?.id ?? ""} />
    </header>
  );
}
